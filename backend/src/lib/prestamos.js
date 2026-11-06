const { error, id, dinero, texto, fecha, hoy } = require('./validacion');
const { cero, solicitud } = require('./finanzas');

function pendiente(p) {
  return p.pagos.filter((pago) => pago.clase === 'devolucion').reduce((s, pago) => s.minus(pago.capital), p.monto);
}

async function propio(tx, usuarioId, prestamoId) {
  const p = await tx.prestamo.findFirst({ where: { id: id(prestamoId), usuarioId }, include: { pagos: { orderBy: { id: 'desc' } } } });
  if (!p) throw error('Préstamo no encontrado', 404);
  return p;
}

async function crear(tx, usuarioId, body) {
  if (!['debo', 'me_deben'].includes(body.tipo)) throw error('Selecciona Debo o Me deben');
  const fechaReal = fecha(body.fecha);
  if (body.fecha > hoy()) throw error('El préstamo debe haber ocurrido');
  if (body.vencimiento && body.vencimiento < body.fecha) throw error('El vencimiento no puede ser anterior al préstamo');
  const monto = dinero(body.monto);
  const persona = texto(body.persona, 'Persona o entidad', 100, true);
  const p = await tx.prestamo.create({ data: {
    usuarioId, persona, monto, tipo: body.tipo, fecha: fechaReal,
    vencimiento: body.vencimiento ? fecha(body.vencimiento) : null, nota: texto(body.nota, 'Nota', 255),
  } });
  const movimiento = await tx.movimiento.create({ data: {
    usuarioId, tipo: body.tipo === 'debo' ? 'ingreso' : 'gasto', naturaleza: 'capital', monto, fecha: fechaReal,
    descripcion: `${body.tipo === 'debo' ? 'Préstamo recibido de' : 'Préstamo entregado a'} ${persona}`,
    metodoPago: texto(body.metodoPago, 'Método de pago', 50),
  } });
  await tx.pagoPrestamo.create({ data: { prestamoId: p.id, clase: 'desembolso', capital: monto, fecha: fechaReal, movimientoId: movimiento.id, solicitud: solicitud(body.solicitud) } });
  return p;
}

async function devolver(tx, usuarioId, prestamoId, body) {
  const p = await propio(tx, usuarioId, prestamoId);
  const esCero = (value) => /^0+(\.0{1,2})?$/.test(String(value));
  const capital = esCero(body.capital) ? cero() : dinero(body.capital);
  const intereses = body.intereses === undefined || body.intereses === '' || esCero(body.intereses) ? cero() : dinero(body.intereses);
  if (capital.plus(intereses).isZero()) throw error('Registra capital o intereses mayores a cero');
  if (capital.greaterThan(pendiente(p))) throw error('La devolución de capital supera lo pendiente');
  if (pendiente(p).isZero()) throw error('Este préstamo ya está saldado');
  const fechaReal = fecha(body.fecha);
  if (body.fecha > hoy() || body.fecha < p.fecha.toISOString().slice(0, 10)) throw error('La fecha debe estar entre el préstamo y hoy');
  const tipo = p.tipo === 'debo' ? 'gasto' : 'ingreso';
  const comunes = { usuarioId, tipo, fecha: fechaReal, metodoPago: texto(body.metodoPago, 'Método de pago', 50) };
  let movimiento, interesMovimiento;
  if (capital.greaterThan(0)) movimiento = await tx.movimiento.create({ data: { ...comunes, naturaleza: 'capital', monto: capital, descripcion: `Devolución de préstamo: ${p.persona}` } });
  if (intereses.greaterThan(0)) {
    const categoria = await tx.categoria.findFirst({ where: { id: id(body.categoriaId), usuarioId, tipo, archivada: false } });
    if (!categoria) throw error(`Selecciona una categoría activa de ${tipo} para los intereses`);
    interesMovimiento = await tx.movimiento.create({ data: { ...comunes, categoriaId: categoria.id, monto: intereses, descripcion: `Intereses de préstamo: ${p.persona}` } });
  }
  return tx.pagoPrestamo.create({ data: {
    prestamoId: p.id, clase: 'devolucion', capital, intereses, fecha: fechaReal,
    nota: texto(body.nota, 'Nota', 255), solicitud: solicitud(body.solicitud), movimientoId: movimiento?.id, interesMovimientoId: interesMovimiento?.id,
  } });
}

async function eliminarPago(tx, usuarioId, prestamoId, pagoId) {
  const p = await propio(tx, usuarioId, prestamoId);
  const pago = p.pagos.find((r) => r.id === id(pagoId) && r.clase === 'devolucion');
  if (!pago) throw error('Devolución no encontrada', 404);
  await tx.pagoPrestamo.delete({ where: { id: pago.id } });
  await tx.movimiento.deleteMany({ where: { id: { in: [pago.movimientoId, pago.interesMovimientoId].filter(Boolean) } } });
}

async function eliminar(tx, usuarioId, prestamoId) {
  const p = await propio(tx, usuarioId, prestamoId);
  const movimientos = p.pagos.flatMap((pago) => [pago.movimientoId, pago.interesMovimientoId]).filter(Boolean);
  await tx.prestamo.delete({ where: { id: p.id } });
  await tx.movimiento.deleteMany({ where: { id: { in: movimientos } } });
}

module.exports = { pendiente, propio, crear, devolver, eliminarPago, eliminar };
