// backend/src/routes/movimientos.routes.js
// CRUD básico de movimientos financieros del usuario autenticado
const router = require('express').Router();
const prisma = require('../lib/prisma');

// GET /api/movimientos
router.get('/', async (req, res, next) => {
  try {
    const movimientos = await prisma.movimiento.findMany({
      where: { usuarioId: req.usuario.id },
      include: { categoria: { select: { nombre: true, color: true, tipo: true } } },
      orderBy: { fecha: 'desc' },
    });
    res.json({ status: 'ok', data: movimientos });
  } catch (e) {
    next(e);
  }
});

// POST /api/movimientos
router.post('/', async (req, res, next) => {
  try {
    const { tipo, monto, descripcion, fecha, metodoPago, categoriaId } = req.body || {};

    if (!tipo || !['ingreso', 'gasto'].includes(tipo)) {
      return res.status(400).json({ status: 'error', message: 'El tipo debe ser "ingreso" o "gasto"' });
    }
    if (monto === undefined || monto === null || Number(monto) <= 0) {
      return res.status(400).json({ status: 'error', message: 'El monto debe ser mayor que 0' });
    }
    if (!categoriaId) {
      return res.status(400).json({ status: 'error', message: 'Debe indicar una categoría' });
    }

    // Validar que la categoría exista y pertenezca al usuario
    const categoria = await prisma.categoria.findFirst({
      where: { id: Number(categoriaId), usuarioId: req.usuario.id },
    });
    if (!categoria) {
      return res.status(400).json({ status: 'error', message: 'Categoría no válida' });
    }

    const movimiento = await prisma.movimiento.create({
      data: {
        tipo,
        monto: Number(monto),
        descripcion: descripcion || null,
        fecha: fecha ? new Date(fecha) : new Date(),
        metodoPago: metodoPago || null,
        usuarioId: req.usuario.id,
        categoriaId: categoria.id,
      },
      include: { categoria: { select: { nombre: true, color: true, tipo: true } } },
    });

    res.status(201).json({ status: 'ok', data: movimiento });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/movimientos/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const movimiento = await prisma.movimiento.findFirst({
      where: { id, usuarioId: req.usuario.id },
    });
    if (!movimiento) {
      return res.status(404).json({ status: 'error', message: 'Movimiento no encontrado' });
    }
    await prisma.movimiento.delete({ where: { id } });
    res.json({ status: 'ok', message: 'Movimiento eliminado' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;