const router = require('express').Router();
const prisma = require('../lib/prisma');
const { exclusivo } = require('../lib/finanzas');
const { error, texto, fecha, hoy } = require('../lib/validacion');
const service = require('../lib/prestamos');

router.get('/', async (req, res, next) => {
  try {
    const rows = await prisma.prestamo.findMany({ where: { usuarioId: req.usuario.id }, include: { pagos: { orderBy: { id: 'desc' } } }, orderBy: { creadoEn: 'desc' } });
    res.json({ status: 'ok', data: rows.map((p) => {
      const pendiente = service.pendiente(p);
      const estado = pendiente.isZero() ? 'saldado' : p.vencimiento && p.vencimiento.toISOString().slice(0, 10) < hoy() ? 'vencido' : 'pendiente';
      return { ...p, pendiente, estado };
    }) });
  } catch (e) { next(e); }
});
router.post('/', async (req, res, next) => {
  try { res.status(201).json({ status: 'ok', data: await exclusivo(req.usuario.id, (tx) => service.crear(tx, req.usuario.id, req.body || {})) }); }
  catch (e) { next(e); }
});
router.put('/:id', async (req, res, next) => {
  try {
    const data = await exclusivo(req.usuario.id, async (tx) => {
      const p = await service.propio(tx, req.usuario.id, req.params.id);
      const body = req.body || {};
      if (body.vencimiento && body.vencimiento < p.fecha.toISOString().slice(0, 10)) throw error('El vencimiento no puede ser anterior al préstamo');
      return tx.prestamo.update({ where: { id: p.id }, data: { persona: texto(body.persona, 'Persona o entidad', 100, true), vencimiento: body.vencimiento ? fecha(body.vencimiento) : null, nota: texto(body.nota, 'Nota', 255) } });
    });
    res.json({ status: 'ok', data });
  } catch (e) { next(e); }
});
router.post('/:id/pagos', async (req, res, next) => {
  try { res.status(201).json({ status: 'ok', data: await exclusivo(req.usuario.id, (tx) => service.devolver(tx, req.usuario.id, req.params.id, req.body || {})) }); }
  catch (e) { next(e); }
});
router.delete('/:id/pagos/:pagoId', async (req, res, next) => {
  try { await exclusivo(req.usuario.id, (tx) => service.eliminarPago(tx, req.usuario.id, req.params.id, req.params.pagoId)); res.json({ status: 'ok' }); }
  catch (e) { next(e); }
});
router.delete('/:id', async (req, res, next) => {
  try { await exclusivo(req.usuario.id, (tx) => service.eliminar(tx, req.usuario.id, req.params.id)); res.json({ status: 'ok' }); }
  catch (e) { next(e); }
});
module.exports = router;
