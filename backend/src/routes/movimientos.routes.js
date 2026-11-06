const router = require('express').Router();
const prisma = require('../lib/prisma');
const { error, id, dinero, texto, fecha } = require('../lib/validacion');
const include = { categoria: { select: { id: true, nombre: true, color: true, tipo: true } }, ahorro: { select: { metaId: true } }, capitalPrestamo: { select: { prestamoId: true } }, interesPrestamo: { select: { prestamoId: true } } };

async function datos(body, usuarioId, categoriaAnterior) {
  const { tipo } = body;
  if (!['ingreso', 'gasto'].includes(tipo)) throw error('El tipo debe ser ingreso o gasto');
  const categoria = await prisma.categoria.findFirst({ where: { id: id(body.categoriaId), usuarioId, tipo } });
  if (!categoria) throw error('La categoría debe pertenecer al usuario y coincidir con el tipo de movimiento');
  if (categoria.archivada && categoria.id !== categoriaAnterior) throw error('La categoría está archivada. Elige una activa.');
  return {
    tipo, monto: dinero(body.monto), categoriaId: categoria.id,
    descripcion: texto(body.descripcion, 'Descripción', 255),
    metodoPago: texto(body.metodoPago, 'Método de pago', 50),
    fecha: fecha(body.fecha),
  };
}

router.get('/', async (req, res, next) => {
  try {
    const q = req.query;
    const where = { usuarioId: req.usuario.id };
    if (q.tipo) {
      if (!['ingreso', 'gasto'].includes(q.tipo)) throw error('Tipo no válido');
      where.tipo = q.tipo;
    }
    if (q.categoriaId) where.categoriaId = id(q.categoriaId);
    if (q.metodoPago) where.metodoPago = { equals: texto(q.metodoPago, 'Método de pago', 50), mode: 'insensitive' };
    if (q.buscar) where.descripcion = { contains: texto(q.buscar, 'Búsqueda', 255), mode: 'insensitive' };
    if (q.desde || q.hasta) {
      where.fecha = {};
      if (q.desde) { fecha(q.desde); where.fecha.gte = new Date(`${q.desde}T00:00:00-04:00`); }
      if (q.hasta) {
        fecha(q.hasta);
        const fin = new Date(`${q.hasta}T00:00:00-04:00`);
        fin.setUTCDate(fin.getUTCDate() + 1);
        where.fecha.lt = fin;
      }
      if (q.desde && q.hasta && q.desde > q.hasta) throw error('La fecha inicial no puede ser posterior a la final');
    }
    res.json({ status: 'ok', data: await prisma.movimiento.findMany({ where, include, orderBy: [{ fecha: 'desc' }, { id: 'desc' }] }) });
  } catch (e) { next(e); }
});

router.get('/metodos', async (req, res, next) => {
  try {
    const rows = await prisma.movimiento.findMany({ where: { usuarioId: req.usuario.id, metodoPago: { not: null } }, distinct: ['metodoPago'], select: { metodoPago: true } });
    res.json({ status: 'ok', data: rows.map((r) => r.metodoPago).filter(Boolean).sort() });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = await datos(req.body || {}, req.usuario.id);
    res.status(201).json({ status: 'ok', data: await prisma.movimiento.create({ data: { ...data, usuarioId: req.usuario.id }, include }) });
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const movimiento = await prisma.movimiento.findFirst({ where: { id: id(req.params.id), usuarioId: req.usuario.id }, include: { ahorro: true, capitalPrestamo: true, interesPrestamo: true } });
    if (!movimiento) throw error('Movimiento no encontrado', 404);
    if (movimiento.ahorro || movimiento.capitalPrestamo || movimiento.interesPrestamo) throw error('Este movimiento está vinculado. Corrígelo desde Metas de ahorro o Deudas y préstamos.', 409);
    const data = await datos(req.body || {}, req.usuario.id, movimiento.categoriaId);
    res.json({ status: 'ok', data: await prisma.movimiento.update({ where: { id: movimiento.id }, data, include }) });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const m = await prisma.movimiento.findFirst({ where: { id: id(req.params.id), usuarioId: req.usuario.id }, include: { ahorro: true, capitalPrestamo: true, interesPrestamo: true } });
    if (m?.ahorro || m?.capitalPrestamo || m?.interesPrestamo) throw error('Elimina la operación vinculada desde Metas de ahorro o Deudas y préstamos para mantener los saldos coherentes.', 409);
    const result = await prisma.movimiento.deleteMany({ where: { id: id(req.params.id), usuarioId: req.usuario.id } });
    if (!result.count) throw error('Movimiento no encontrado', 404);
    res.json({ status: 'ok', message: 'Movimiento eliminado' });
  } catch (e) { next(e); }
});

module.exports = router;
