const router = require('express').Router();
const prisma = require('../lib/prisma');
const { Prisma } = require('@prisma/client');
const { error, id, dinero, texto, fecha, hoy } = require('../lib/validacion');

async function propia(metaId, usuarioId) {
  const meta = await prisma.metaAhorro.findFirst({ where: { id: id(metaId), usuarioId } });
  if (!meta) throw error('Meta no encontrada', 404);
  return meta;
}

function datos(body) {
  return {
    nombre: texto(body.nombre, 'Nombre', 100, true), objetivo: dinero(body.objetivo),
    fechaObjetivo: body.fechaObjetivo ? fecha(body.fechaObjetivo) : null,
  };
}

router.get('/', async (req, res, next) => {
  try {
    const metas = await prisma.metaAhorro.findMany({
      where: { usuarioId: req.usuario.id },
      include: { aportes: { orderBy: [{ fecha: 'desc' }, { id: 'desc' }] } },
      orderBy: { creadoEn: 'desc' },
    });
    res.json({ status: 'ok', data: metas.map((m) => {
      const ahorrado = m.aportes.reduce((sum, a) => sum.plus(a.monto), new Prisma.Decimal(0));
      return { ...m, ahorrado, restante: m.objetivo.greaterThan(ahorrado) ? m.objetivo.minus(ahorrado) : 0, completada: ahorrado.greaterThanOrEqualTo(m.objetivo) };
    }) });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    res.status(201).json({ status: 'ok', data: await prisma.metaAhorro.create({ data: { ...datos(req.body || {}), usuarioId: req.usuario.id } }) });
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const meta = await propia(req.params.id, req.usuario.id);
    res.json({ status: 'ok', data: await prisma.metaAhorro.update({ where: { id: meta.id }, data: datos(req.body || {}) }) });
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await prisma.metaAhorro.deleteMany({ where: { id: id(req.params.id), usuarioId: req.usuario.id } });
    if (!result.count) throw error('Meta no encontrada', 404);
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
});

router.post('/:id/aportes', async (req, res, next) => {
  try {
    const meta = await propia(req.params.id, req.usuario.id);
    const body = req.body || {};
    const dia = body.fecha || hoy();
    if (dia > hoy()) throw error('Un aporte realizado no puede tener fecha futura');
    res.status(201).json({ status: 'ok', data: await prisma.aporteAhorro.create({ data: {
      metaId: meta.id, monto: dinero(body.monto), fecha: fecha(dia), nota: texto(body.nota, 'Nota', 255),
    } }) });
  } catch (e) { next(e); }
});

router.delete('/:id/aportes/:aporteId', async (req, res, next) => {
  try {
    const result = await prisma.aporteAhorro.deleteMany({ where: { id: id(req.params.aporteId), metaId: id(req.params.id), meta: { usuarioId: req.usuario.id } } });
    if (!result.count) throw error('Aporte no encontrado', 404);
    res.json({ status: 'ok' });
  } catch (e) { next(e); }
});

module.exports = router;
