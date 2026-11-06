const { test } = require('node:test');
const assert = require('node:assert/strict');
const prisma = require('../src/lib/prisma');
const { siguiente, recordatorio } = require('../src/lib/recurrencia');
const { hoy } = require('../src/lib/validacion');

test('Las recurrencias conservan el día original y respetan años bisiestos', () => {
  const iso = (d) => d.toISOString().slice(0, 10);
  const enero = new Date('2027-01-31T00:00:00Z');
  const febrero = siguiente(enero, 'mensual', enero);
  assert.equal(iso(febrero), '2027-02-28');
  assert.equal(iso(siguiente(febrero, 'mensual', enero)), '2027-03-31');
  const bisiesto = new Date('2024-02-29T00:00:00Z');
  assert.equal(iso(siguiente(bisiesto, 'anual', bisiesto)), '2025-02-28');
  assert.equal(iso(siguiente(enero, 'quincenal', enero)), '2027-02-14');
  const record = { activo: true, diasAviso: 3, proximoVencimiento: new Date('2027-01-31T00:00:00Z') };
  assert.equal(recordatorio(record, '2027-01-30').estado, 'proximo');
  assert.equal(recordatorio(record, '2027-02-01').estado, 'vencido');
  assert.equal(recordatorio({ ...record, activo: false }, '2027-02-01').estado, 'pausado');
});

test('Edición, filtros, metas y pagos recurrentes: persistencia y aislamiento por usuario', async () => {
  const base = process.env.TEST_API_URL || 'http://localhost:5000/api';
  const usuarios = [];
  async function call(path, token, method = 'GET', body, status = 200) {
    const res = await fetch(`${base}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    const data = await res.json();
    assert.equal(res.status, status, `${method} ${path}: ${JSON.stringify(data)}`);
    return data.data ?? data;
  }
  try {
    for (let n = 0; n < 2; n++) {
      const u = await call('/auth/register', null, 'POST', { nombre: 'Prueba automática', email: `test-${crypto.randomUUID()}@example.test`, password: 'Prueba1234!' }, 201);
      usuarios.push(u);
    }
    const [a, b] = usuarios;
    const categorias = await call('/categorias', a.token);
    const gasto = categorias.find((c) => c.tipo === 'gasto');
    const ingreso = categorias.find((c) => c.tipo === 'ingreso');
    const body = { tipo: 'gasto', monto: '12.50', categoriaId: gasto.id, fecha: hoy(), descripcion: 'Compra de prueba', metodoPago: 'QR' };
    const movimiento = await call('/movimientos', a.token, 'POST', body, 201);
    await call(`/movimientos/${movimiento.id}`, b.token, 'PUT', body, 404);
    await call('/movimientos', a.token, 'POST', { ...body, categoriaId: ingreso.id }, 400);
    await call('/movimientos', a.token, 'POST', { ...body, monto: 'NaN' }, 400);
    await call('/movimientos', a.token, 'POST', { ...body, fecha: '2026-02-30' }, 400);
    await call(`/movimientos/${movimiento.id}`, a.token, 'PUT', { ...body, monto: '15.75', descripcion: 'Compra editada' });
    const query = new URLSearchParams({ buscar: 'EDITADA', desde: hoy(), hasta: hoy(), categoriaId: String(gasto.id), tipo: 'gasto', metodoPago: 'qr' });
    const encontrados = await call(`/movimientos?${query}`, a.token);
    assert.equal(encontrados.length, 1);
    assert.equal(Number(encontrados[0].monto), 15.75);
    assert.equal((await call('/movimientos?tipo=ingreso', a.token)).length, 0);
    assert.equal((await call(`/movimientos?${query}`, b.token)).length, 0);
    await call('/movimientos?desde=2026-12-31&hasta=2026-01-01', a.token, 'GET', undefined, 400);

    await call('/movimientos', a.token, 'POST', { ...body, tipo: 'ingreso', categoriaId: ingreso.id, monto: '1000', descripcion: 'Ingreso para ahorro' }, 201);
    const saldo = (await call('/dashboard', a.token)).saldo;
    const meta = await call('/metas', a.token, 'POST', { nombre: 'Fondo de prueba', objetivo: '100', fechaObjetivo: '2027-06-30' }, 201);
    assert.equal(meta.fechaObjetivo.slice(0, 10), '2027-06-30');
    const aporte = await call(`/metas/${meta.id}/aportes`, a.token, 'POST', { monto: '40.25', fecha: hoy() }, 201);
    await call(`/metas/${meta.id}/aportes`, b.token, 'POST', { monto: '30' }, 404);
    await call(`/metas/${meta.id}`, b.token, 'DELETE', undefined, 404);
    let metas = await call('/metas', a.token);
    assert.equal(Number(metas[0].ahorrado), 40.25);
    assert.equal(Number(metas[0].restante), 59.75);
    await call(`/metas/${meta.id}`, a.token, 'PUT', { nombre: 'Fondo actualizado', objetivo: '100', fechaObjetivo: '2027-07-31' });
    assert.equal((await call('/metas', a.token))[0].fechaObjetivo.slice(0, 10), '2027-07-31');
    assert.equal((await call('/metas', b.token)).length, 0);
    await call(`/metas/${meta.id}/aportes`, a.token, 'POST', { monto: '60' }, 201);
    metas = await call('/metas', a.token);
    assert.equal(metas[0].completada, true);
    assert.equal(Number(metas[0].restante), 0);
    await call(`/metas/${meta.id}/aportes/${aporte.id}`, a.token, 'DELETE');
    assert.equal((await call('/metas', a.token))[0].completada, false);
    assert.equal((await call('/dashboard', a.token)).saldo, saldo, 'Los aportes no son gastos');

    const r = await call('/recurrentes', a.token, 'POST', { nombre: 'Servicio de prueba', monto: '25', categoriaId: gasto.id, metodoPago: 'QR', frecuencia: 'mensual', fechaInicio: hoy(), diasAviso: 3 }, 201);
    assert.equal((await call('/recurrentes', a.token))[0].estado, 'hoy');
    assert.equal((await call('/dashboard', a.token)).saldo, saldo, 'Programar un pago no lo descuenta');
    await call(`/recurrentes/${r.id}/pagar`, b.token, 'POST', { vencimiento: hoy(), fecha: hoy() }, 404);
    await call(`/recurrentes/${r.id}/estado`, a.token, 'PATCH', { activo: false });
    await call(`/recurrentes/${r.id}/pagar`, a.token, 'POST', { vencimiento: hoy(), fecha: hoy() }, 400);
    await call(`/recurrentes/${r.id}/estado`, a.token, 'PATCH', { activo: true });
    const pagos = await Promise.all([1, 2].map(() => fetch(`${base}/recurrentes/${r.id}/pagar`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${a.token}` }, body: JSON.stringify({ vencimiento: hoy(), fecha: hoy() }) })));
    assert.deepEqual(pagos.map((p) => p.status).sort(), [201, 409], 'Una cuota solo se paga una vez incluso con peticiones simultáneas');
    assert.equal((await call('/dashboard', a.token)).saldo, saldo - 25);
    assert.notEqual((await call('/recurrentes', a.token))[0].proximoVencimiento.slice(0, 10), hoy());
    await call(`/recurrentes/${r.id}`, a.token, 'DELETE');
    assert.equal((await call('/movimientos', a.token)).length, 3, 'Eliminar la programación conserva el pago');
  } finally {
    for (const u of usuarios) await prisma.usuario.delete({ where: { id: u.usuario.id } });
    await prisma.$disconnect();
  }
});
