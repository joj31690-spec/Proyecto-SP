// backend/src/routes/categorias.routes.js
// Listado de categorías del usuario autenticado
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { exclusivo } = require('../lib/finanzas');
const { guardar, eliminar, referencias } = require('../lib/categorias');

// GET /api/categorias
router.get('/', async (req, res, next) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { usuarioId: req.usuario.id, ...(req.query.todas === 'true' ? {} : { archivada: false }) },
      include: referencias,
      orderBy: { nombre: 'asc' },
    });
    res.json({ status: 'ok', data: categorias });
  } catch (e) {
    next(e);
  }
});

router.post('/', async (req, res, next) => {
  try { res.status(201).json({ status: 'ok', data: await exclusivo(req.usuario.id, (tx) => guardar(tx, req.usuario.id, null, req.body || {})) }); }
  catch (e) { next(e); }
});
router.put('/:id', async (req, res, next) => {
  try { res.json({ status: 'ok', data: await exclusivo(req.usuario.id, (tx) => guardar(tx, req.usuario.id, req.params.id, req.body || {})) }); }
  catch (e) { next(e); }
});
router.delete('/:id', async (req, res, next) => {
  try { await exclusivo(req.usuario.id, (tx) => eliminar(tx, req.usuario.id, req.params.id, req.body?.destinoId)); res.json({ status: 'ok' }); }
  catch (e) { next(e); }
});
module.exports = router;
