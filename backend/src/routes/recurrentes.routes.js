const router = require('express').Router();
const prisma = require('../lib/prisma');
const { error, id, dinero, texto, fecha, hoy } = require('../lib/validacion');
const { siguiente, recordatorio } = require('../lib/recurrencia');

async function datos(body, usuarioId) {
  if (!['semanal', 'quincenal', 'mensual', 'anual'].includes(body.frecuencia)) throw error('Frecuencia no válida');
  const diasAviso = Number(body.diasAviso);
  if (!Number.isInteger(diasAviso) || diasAviso < 0 || diasAviso > 30) throw error('El aviso debe estar entre 0 y 30 días');
  const categoria = await prisma.categoria.findFirst({ where: { id: id(body.categoriaId), usuarioId, tipo: 'gasto' } });
  if (!categoria) throw error('Selecciona una categoría de gasto propia');
  return {
    nombre: texto(body.nombre, 'Nombre', 100, true), monto: dinero(body.monto),
    metodoPago: texto(body.metodoPago, 'Método de pago', 50), frecuencia: body.frecuencia,
    fechaInicio: fecha(body.fechaInicio), diasAviso, categoriaId: categoria.id,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const rows = await prisma.gastoRecurrente.findMany({ where: { usuarioId: req.usuario.id }, include: { categoria: true }, orderBy: [{ activo: 'desc' }, { proximoVencimiento: 'asc' }] });
    res.json({ status: 'ok', data: rows.map((r) => recordatorio(r, hoy())) });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = await datos(req.body || {}, req.usuario.id);
    res.status(201).json({ status: 'ok', data: await prisma.gastoRecurrente.create({ data: { ...data, proximoVencimiento: data.fechaInicio, usuarioId: req.usuario.id } }) });
  } catch (e) { next(e); }
});

router.patch('/:id/estado', async (req, res, next) => {
  try {
    if (typeof req.body?.activo !== 'boolean') throw error('Estado no válido');
    const result = await prisma.gastoRecurrente.updateMany({ where: { id: id(req.params.id), usuarioId: req.usuario.id }, data: { activo: req.body.activo } });
    if (!result.count) throw error('Gasto recurrente no encontrado', 404);
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.gastoRecurrente.deleteMany({ where: { id: id(req.params.id), usuarioId: req.usuario.id } });
    if (!result.count) throw error('Gasto recurrente no encontrado', 404);
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
});

router.post('/:id/pagar', async (req, res, next) => {
  try {
    // El cliente envía el vencimiento que está pagando. Actualización condicional
    // + transacción evitan que un doble clic registre dos cuotas diferentes.
    const esperado = fecha(req.body?.vencimiento);
    const fechaPago = req.body?.fecha || hoy();
    if (fechaPago > hoy()) throw error('La fecha de pago no puede ser futura');
    const pagado = await prisma.$transaction(async (tx) => {
      const gasto = await tx.gastoRecurrente.findFirst({ where: { id: id(req.params.id), usuarioId: req.usuario.id } });
      if (!gasto) throw error('Gasto recurrente no encontrado', 404);
      if (!gasto.activo) throw error('Primero reactiva el gasto recurrente');
      const vencimiento = gasto.proximoVencimiento.toISOString().slice(0, 10);
      if (vencimiento !== esperado.toISOString().slice(0, 10)) throw error('Este vencimiento ya cambió. Actualiza la lista.', 409);
      const result = await tx.gastoRecurrente.updateMany({
        where: { id: gasto.id, proximoVencimiento: gasto.proximoVencimiento, activo: true },
        data: { proximoVencimiento: siguiente(gasto.proximoVencimiento, gasto.frecuencia, gasto.fechaInicio) },
      });
      if (!result.count) throw error('Este pago ya fue registrado. Actualiza la lista.', 409);
      return tx.movimiento.create({ data: {
        tipo: 'gasto', monto: gasto.monto, descripcion: gasto.nombre, fecha: fecha(fechaPago),
        metodoPago: gasto.metodoPago, categoriaId: gasto.categoriaId, usuarioId: req.usuario.id,
        recurrenteId: gasto.id, fechaProgramada: gasto.proximoVencimiento,
      } });
    });
    res.status(201).json({ status: 'ok', data: pagado });
  } catch (e) { next(e); }
});

module.exports = router;
