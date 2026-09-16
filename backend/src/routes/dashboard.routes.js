// backend/src/routes/dashboard.routes.js
// Resumen financiero del usuario autenticado
const router = require('express').Router();
const prisma = require('../lib/prisma');

// GET /api/dashboard
router.get('/', async (req, res, next) => {
  try {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const monto = (movs, tipo) => movs.filter((m) => m.tipo === tipo).reduce((s, m) => s + Number(m.monto), 0);

    // Totales de todos los movimientos (saldo acumulado)
    const todos = await prisma.movimiento.findMany({ where: { usuarioId: req.usuario.id } });
    const totalIngresos = monto(todos, 'ingreso');
    const totalGastos = monto(todos, 'gasto');

    // Movimientos del mes actual
    const delMes = await prisma.movimiento.findMany({
      where: { usuarioId: req.usuario.id, fecha: { gte: inicioMes } },
    });
    const ingresosMes = monto(delMes, 'ingreso');
    const gastosMes = monto(delMes, 'gasto');

    // Últimos 8 movimientos
    const recientes = await prisma.movimiento.findMany({
      where: { usuarioId: req.usuario.id },
      include: { categoria: { select: { nombre: true, color: true } } },
      orderBy: { fecha: 'desc' },
      take: 8,
    });

    res.json({
      status: 'ok',
      data: {
        saldo: totalIngresos - totalGastos,
        totalIngresos,
        totalGastos,
        ingresosMes,
        gastosMes,
        balanceMes: ingresosMes - gastosMes,
        recientes,
      },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;