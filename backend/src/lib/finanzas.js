const { Prisma } = require('@prisma/client');
const { randomUUID } = require('node:crypto');
const prisma = require('./prisma');
const { error } = require('./validacion');

const cero = () => new Prisma.Decimal(0);
function neto(aportes) {
  return aportes.reduce((s, a) => a.tipo === 'retiro' ? s.minus(a.monto) : s.plus(a.monto), cero());
}

async function resumen(db, usuarioId) {
  const [movimientos, aportes] = await Promise.all([
    db.movimiento.findMany({ where: { usuarioId } }),
    db.aporteAhorro.findMany({ where: { meta: { usuarioId } } }),
  ]);
  const saldo = movimientos.reduce((s, m) => m.tipo === 'ingreso' ? s.plus(m.monto) : s.minus(m.monto), cero());
  const reservado = neto(aportes);
  return { saldo, reservado, disponible: saldo.minus(reservado) };
}

// Todas las operaciones de ahorro y préstamos del mismo usuario se serializan.
// La escritura adquiere un bloqueo de fila hasta finalizar la transacción.
function exclusivo(usuarioId, accion) {
  return prisma.$transaction(async (tx) => {
    await tx.usuario.update({ where: { id: usuarioId }, data: { actualizadoEn: new Date() } });
    return accion(tx);
  }, { maxWait: 10000, timeout: 15000 });
}

function solicitud(value) {
  if (value === undefined) return randomUUID();
  if (typeof value !== 'string' || !/^[\w-]{10,80}$/.test(value)) throw error('Identificador de operación no válido');
  return value;
}

module.exports = { cero, neto, resumen, exclusivo, solicitud };
