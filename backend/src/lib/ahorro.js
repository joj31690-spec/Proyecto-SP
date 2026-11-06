const { error, id, dinero, texto, fecha, hoy } = require('./validacion');
const { neto, resumen, solicitud } = require('./finanzas');

async function propia(tx, metaId, usuarioId) {
  const meta = await tx.metaAhorro.findFirst({ where: { id: id(metaId), usuarioId }, include: { aportes: true } });
  if (!meta) throw error('Meta no encontrada', 404);
  return meta;
}

async function registrar(tx, usuarioId, metaId, body, tipo) {
  const meta = await propia(tx, metaId, usuarioId);
  const monto = dinero(body.monto);
  const dia = body.fecha || hoy();
  const fechaReal = fecha(dia);
  if (dia > hoy()) throw error('La operación no puede tener fecha futura');
  let movimiento;
  if (tipo === 'aporte') {
    const { disponible } = await resumen(tx, usuarioId);
    if (monto.greaterThan(disponible)) throw error('El aporte supera tu dinero disponible. Registra tus ingresos o libera ahorro de otra meta antes de aportar.');
  } else {
    if (monto.greaterThan(neto(meta.aportes))) throw error('No puedes retirar más de lo ahorrado en esta meta');
    if (body.crearGasto) {
      const categoria = await tx.categoria.findFirst({ where: { id: id(body.categoriaId), usuarioId, tipo: 'gasto', archivada: false } });
      if (!categoria) throw error('Selecciona una categoría de gasto activa');
      movimiento = await tx.movimiento.create({ data: {
        usuarioId, tipo: 'gasto', monto, fecha: fechaReal, categoriaId: categoria.id,
        descripcion: texto(body.nota, 'Motivo', 255) || `Uso de ahorro: ${meta.nombre}`,
        metodoPago: texto(body.metodoPago, 'Método de pago', 50),
      } });
    }
  }
  return tx.aporteAhorro.create({ data: {
    metaId: meta.id, monto, tipo, fecha: fechaReal, nota: texto(body.nota, 'Motivo', 255),
    solicitud: solicitud(body.solicitud), movimientoId: movimiento?.id,
  } });
}

async function corregir(tx, usuarioId, metaId, aporteId) {
  const meta = await propia(tx, metaId, usuarioId);
  const aporte = meta.aportes.find((a) => a.id === id(aporteId));
  if (!aporte) throw error('Operación no encontrada', 404);
  if (aporte.tipo === 'aporte' && neto(meta.aportes).lessThan(aporte.monto)) throw error('Este aporte ya respalda retiros. Corrige primero los retiros para no dejar el ahorro negativo.');
  await tx.aporteAhorro.delete({ where: { id: aporte.id } });
  if (aporte.movimientoId) await tx.movimiento.delete({ where: { id: aporte.movimientoId } });
}

module.exports = { propia, registrar, corregir };
