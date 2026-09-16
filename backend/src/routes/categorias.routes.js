// backend/src/routes/categorias.routes.js
// Listado de categorías del usuario autenticado
const router = require('express').Router();
const prisma = require('../lib/prisma');

// GET /api/categorias
router.get('/', async (req, res, next) => {
  try {
    const categorias = await prisma.categoria.findMany({
      where: { usuarioId: req.usuario.id },
      orderBy: { nombre: 'asc' },
    });
    res.json({ status: 'ok', data: categorias });
  } catch (e) {
    next(e);
  }
});

module.exports = router;