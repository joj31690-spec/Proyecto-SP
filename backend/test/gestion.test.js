const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const prisma = require('../src/lib/prisma');
const { hoy } = require('../src/lib/validacion');

test('Categorías, reservas, retiros y préstamos mantienen sus saldos y referencias', async () => {
  const base = process.env.TEST_API_URL || 'http://localhost:5000/api';
  const usuarios = [];
  async function call(path, token, method = 'GET', body, status = 200) {
    const res = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const json = await res.json();
    assert.equal(res.status, status, `${method} ${path}: ${JSON.stringify(json)}`);
    return json.data ?? json;
  }
  try {
    for (let i = 0; i < 2; i++) usuarios.push(await call('/auth/register', null, 'POST', { nombre: 'Gestión temporal', email: `gestion-${randomUUID()}@example.test`, password: 'Prueba1234!' }, 201));
    const [a, b] = usuarios;
    const categorias = await call('/categorias', a.token);
    assert.equal(categorias.length, 9, 'Se mantienen todas las categorías iniciales');
    const ingreso = categorias.find((c) => c.tipo === 'ingreso');
    const gasto = categorias.find((c) => c.tipo === 'gasto');
    const otra = await call('/categorias', a.token, 'POST', { nombre: 'Regalos', tipo: 'ingreso', color: '#123456' }, 201);
    await call('/categorias', a.token, 'POST', { nombre: 'regalos', tipo: 'ingreso', color: '#123456' }, 409);
    await call(`/categorias/${otra.id}`, b.token, 'PUT', { ...otra, nombre: 'Ajena' }, 404);
    await call(`/categorias/${otra.id}`, a.token, 'PUT', { ...otra, archivada: true });
    assert.ok(!(await call('/categorias', a.token)).some((c) => c.id === otra.id));
    assert.ok((await call('/categorias?todas=true', a.token)).some((c) => c.id === otra.id));
    const movBody = { tipo: 'ingreso', categoriaId: otra.id, monto: '1000', fecha: hoy(), descripcion: 'Dinero inicial' };
    await call('/movimientos', a.token, 'POST', movBody, 400);
    await call(`/categorias/${otra.id}`, a.token, 'PUT', { ...otra, archivada: false });
    const inicial = await call('/movimientos', a.token, 'POST', movBody, 201);
    await call(`/categorias/${otra.id}`, a.token, 'PUT', { ...otra, tipo: 'gasto' }, 400);
    await call(`/categorias/${otra.id}`, a.token, 'DELETE', undefined, 409);
    await call(`/categorias/${otra.id}`, a.token, 'DELETE', { destinoId: gasto.id }, 400);
    await call(`/categorias/${otra.id}`, a.token, 'DELETE', { destinoId: ingreso.id });
    assert.equal((await call('/movimientos', a.token))[0].categoriaId, ingreso.id);
    assert.equal((await call('/movimientos', a.token))[0].id, inicial.id);

    const origenGasto = await call('/categorias', a.token, 'POST', { nombre: 'Gasto temporal', tipo: 'gasto', color: '#654321' }, 201);
    const periodo = { anio: Number(hoy().slice(0, 4)), mes: Number(hoy().slice(5, 7)) };
    const pOrigen = await call('/presupuestos', a.token, 'POST', { ...periodo, categoriaId: origenGasto.id, monto: '100' }, 201);
    const pDestino = await call('/presupuestos', a.token, 'POST', { ...periodo, categoriaId: gasto.id, monto: '200' }, 201);
    await call(`/categorias/${origenGasto.id}`, a.token, 'DELETE', { destinoId: gasto.id }, 409);
    await call(`/presupuestos/${pDestino.id}`, a.token, 'DELETE');
    await call(`/categorias/${origenGasto.id}`, a.token, 'DELETE', { destinoId: gasto.id });
    assert.equal((await call(`/presupuestos?anio=${periodo.anio}&mes=${periodo.mes}`, a.token))[0].id, pOrigen.id, 'La reasignación conserva el presupuesto');

    const meta = await call('/metas', a.token, 'POST', { nombre: 'Emergencias', objetivo: '1000' }, 201);
    const aporte = await call(`/metas/${meta.id}/aportes`, a.token, 'POST', { monto: '600', fecha: hoy(), solicitud: randomUUID() }, 201);
    let resumen = await call('/dashboard', a.token);
    assert.equal(resumen.saldo, 1000); assert.equal(resumen.reservado, 600); assert.equal(resumen.disponible, 400);
    const segunda = await call('/metas', a.token, 'POST', { nombre: 'Otro objetivo', objetivo: '500' }, 201);
    await call(`/metas/${segunda.id}/aportes`, a.token, 'POST', { monto: '500' }, 400);
    await call(`/metas/${meta.id}/retiros`, b.token, 'POST', { monto: '10' }, 404);
    const retiradas = await Promise.all([1, 2].map(() => fetch(`${base}/metas/${meta.id}/retiros`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${a.token}` }, body: JSON.stringify({ monto: '400', solicitud: randomUUID() }) })));
    assert.deepEqual(retiradas.map((r) => r.status).sort(), [201, 400]);
    resumen = await call('/dashboard', a.token);
    assert.equal(resumen.saldo, 1000); assert.equal(resumen.reservado, 200); assert.equal(resumen.disponible, 800);
    const solicitud = randomUUID();
    const retiroBody = { monto: '100', crearGasto: true, categoriaId: gasto.id, fecha: hoy(), nota: 'Medicamentos', solicitud };
    const retiro = await call(`/metas/${meta.id}/retiros`, a.token, 'POST', retiroBody, 201);
    await call(`/metas/${meta.id}/retiros`, a.token, 'POST', retiroBody, 409);
    resumen = await call('/dashboard', a.token);
    assert.equal(resumen.saldo, 900); assert.equal(resumen.reservado, 100); assert.equal(resumen.disponible, 800);
    await call(`/movimientos/${retiro.movimientoId}`, a.token, 'DELETE', undefined, 409);
    await call(`/movimientos/${retiro.movimientoId}`, a.token, 'PUT', { ...movBody, tipo: 'gasto', categoriaId: gasto.id }, 409);
    await call(`/metas/${meta.id}/aportes/${aporte.id}`, a.token, 'DELETE', undefined, 400);
    await call(`/metas/${meta.id}/aportes/${retiro.id}`, a.token, 'DELETE');
    assert.equal((await call('/dashboard', a.token)).saldo, 1000);
    assert.equal((await call('/dashboard', a.token)).reservado, 200);
    await call(`/metas/${meta.id}`, a.token, 'DELETE');
    assert.equal((await call('/dashboard', a.token)).reservado, 0);

    const prestBody = { persona: 'Persona de prueba', tipo: 'debo', monto: '500', fecha: hoy(), solicitud: randomUUID() };
    const deuda = await call('/prestamos', a.token, 'POST', prestBody, 201);
    await call('/prestamos', a.token, 'POST', prestBody, 409);
    assert.equal((await call('/prestamos', b.token)).length, 0);
    await call(`/prestamos/${deuda.id}`, b.token, 'DELETE', undefined, 404);
    resumen = await call('/dashboard', a.token);
    assert.equal(resumen.saldo, 1500); assert.equal(resumen.totalIngresos, 1000);
    const devolucionBody = { capital: '200', intereses: '5', categoriaId: gasto.id, fecha: hoy(), solicitud: randomUUID() };
    const devolucion = await call(`/prestamos/${deuda.id}/pagos`, a.token, 'POST', devolucionBody, 201);
    await call(`/prestamos/${deuda.id}/pagos`, a.token, 'POST', devolucionBody, 409);
    resumen = await call('/dashboard', a.token);
    assert.equal(resumen.saldo, 1295); assert.equal(resumen.totalGastos, 5);
    assert.equal(Number((await call('/prestamos', a.token))[0].pendiente), 300);
    await call(`/prestamos/${deuda.id}/pagos`, a.token, 'POST', { ...devolucionBody, capital: '301', solicitud: randomUUID() }, 400);
    await call(`/movimientos/${devolucion.movimientoId}`, a.token, 'DELETE', undefined, 409);
    await call(`/prestamos/${deuda.id}/pagos/${devolucion.id}`, a.token, 'DELETE');
    assert.equal((await call('/dashboard', a.token)).saldo, 1500);
    const soloIntereses = await call(`/prestamos/${deuda.id}/pagos`, a.token, 'POST', { capital: '0.00', intereses: '2.50', categoriaId: gasto.id, fecha: hoy(), solicitud: randomUUID() }, 201);
    assert.equal(Number((await call('/prestamos', a.token))[0].pendiente), 500);
    assert.equal((await call('/dashboard', a.token)).saldo, 1497.5);
    await call(`/prestamos/${deuda.id}/pagos/${soloIntereses.id}`, a.token, 'DELETE');
    await call(`/prestamos/${deuda.id}/pagos`, a.token, 'POST', { capital: '500', fecha: hoy(), solicitud: randomUUID() }, 201);
    assert.equal((await call('/prestamos', a.token))[0].estado, 'saldado');
    await call(`/prestamos/${deuda.id}`, a.token, 'DELETE');
    assert.equal((await call('/dashboard', a.token)).saldo, 1000);

    const prestado = await call('/prestamos', a.token, 'POST', { ...prestBody, tipo: 'me_deben', monto: '300', solicitud: randomUUID() }, 201);
    assert.equal((await call('/dashboard', a.token)).saldo, 700);
    await call(`/prestamos/${prestado.id}/pagos`, a.token, 'POST', { capital: '100', intereses: '10', categoriaId: ingreso.id, fecha: hoy(), solicitud: randomUUID() }, 201);
    resumen = await call('/dashboard', a.token);
    assert.equal(resumen.saldo, 810); assert.equal(resumen.totalIngresos, 1010); assert.equal(resumen.totalGastos, 0);
    assert.equal(Number((await call('/prestamos', a.token))[0].pendiente), 200);
    const simultaneos = await Promise.all([1, 2].map(() => fetch(`${base}/prestamos/${prestado.id}/pagos`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${a.token}` }, body: JSON.stringify({ capital: '200', fecha: hoy(), solicitud: randomUUID() }) })));
    assert.deepEqual(simultaneos.map((r) => r.status).sort(), [201, 400], 'No se devuelve el mismo capital dos veces');
    await call(`/prestamos/${prestado.id}`, a.token, 'DELETE');
    assert.equal((await call('/dashboard', a.token)).saldo, 1000);
  } finally {
    for (const u of usuarios) await prisma.usuario.delete({ where: { id: u.usuario.id } });
    await prisma.$disconnect();
  }
});
