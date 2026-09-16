// backend/src/routes/presupuestos.routes.js
// Presupuestos mensuales por categoría del usuario autenticado
const router = require('express').Router();
const prisma = require('../lib/prisma');

function validarPeriodo(anio, mes) {
  const a = Number(anio);
  const m = Number(mes);
  if (!a || !m || m < 1 || m > 12 || a < 2000 || a > 2100) return null;
  return { anio: a, mes: m };
}

// GET /api/presupuestos?anio=YYYY&mes=M
// Lista presupuestos del mes, con el gasto real acumulado por categoría
router.get('/', async (req, res, next) => {
  try {
    const periodo = validarPeriodo(req.query.anio, req.query.mes) || (() => {
      const ahora = new Date();
      return { anio: ahora.getFullYear(), mes: ahora.getMonth() + 1 };
    })();

    const presupuestos = await prisma.presupuesto.findMany({
      where: {
        anio: periodo.anio,
        mes: periodo.mes,
        categoria: { usuarioId: req.usuario.id },
      },
      include: { categoria: { select: { id: true, nombre: true, color: true, tipo: true } } },
      orderBy: { monto: 'asc' },
    });

    const inicio = new Date(periodo.anio, periodo.mes - 1, 1);
    const fin = new Date(periodo.anio, periodo.mes, 1);

    const conGasto = await Promise.all(
      presupuestos.map(async (p) => {
        const gastados = await prisma.movimiento.aggregate({
          where: {
            usuarioId: req.usuario.id,
            categoriaId: p.categoriaId,
            tipo: 'gasto',
            fecha: { gte: inicio, lt: fin },
          },
          _sum: { monto: true },
        });
        const gastado = Number(gastados._sum.monto || 0);
        return { ...p, monto: Number(p.monto), gastado, restante: Number(p.monto) - gastado };
      })
    );

    res.json({ status: 'ok', periodo, data: conGasto });
  } catch (e) {
    next(e);
  }
});

// POST /api/presupuestos
// Crea o actualiza (upsert) el presupuesto de una categoría para un mes
router.post('/', async (req, res, next) => {
  try {
    const { categoriaId, monto, anio, mes } = req.body || {};
    const periodo = validarPeriodo(anio, mes);
    if (!periodo) {
      return res.status(400).json({ status: 'error', message: 'El periodo (anio y mes) es obligatorio y debe ser válido' });
    }
    if (monto === undefined || monto === null || Number(monto) <= 0) {
      return res.status(400).json({ status: 'error', message: 'El presupuesto debe ser mayor que 0' });
    }

    const categoria = await prisma.categoria.findFirst({
      where: { id: Number(categoriaId), usuarioId: req.usuario.id },
    });
    if (!categoria) {
      return res.status(400).json({ status: 'error', message: 'Categoría no válida' });
    }

    const presupuesto = await prisma.presupuesto.upsert({
      where: { categoriaId_anio_mes: { categoriaId: categoria.id, anio: periodo.anio, mes: periodo.mes } },
      create: { monto: Number(monto), anio: periodo.anio, mes: periodo.mes, categoriaId: categoria.id },
      update: { monto: Number(monto) },
      include: { categoria: { select: { id: true, nombre: true, color: true, tipo: true } } },
    });

    res.status(201).json({ status: 'ok', data: { ...presupuesto, monto: Number(presupuesto.monto) } });
  } catch (e) {
    next(e);
  }
});

// DELETE /api/presupuestos/:id
// Elimina el presupuesto (solo si la categoría pertenece al usuario)
router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const presupuesto = await prisma.presupuesto.findFirst({
      where: { id, categoria: { usuarioId: req.usuario.id } },
    });
    if (!presupuesto) {
      return res.status(404).json({ status: 'error', message: 'Presupuesto no encontrado' });
    }
    await prisma.presupuesto.delete({ where: { id } });
    res.json({ status: 'ok', message: 'Presupuesto eliminado' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;