const { error, id, texto } = require('./validacion');

function datos(body) {
  if (!['ingreso', 'gasto'].includes(body.tipo)) throw error('Tipo de categoría no válido');
  if (typeof body.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(body.color)) throw error('Color no válido');
  return { nombre: texto(body.nombre, 'Nombre', 80, true), tipo: body.tipo, color: body.color };
}
const referencias = { _count: { select: { movimientos: true, presupuestos: true, recurrentes: true } } };

async function guardar(tx, usuarioId, categoriaId, body) {
  const values = datos(body);
  let categoria;
  if (categoriaId) {
    categoria = await tx.categoria.findFirst({ where: { id: id(categoriaId), usuarioId }, include: referencias });
    if (!categoria) throw error('Categoría no encontrada', 404);
    if (values.tipo !== categoria.tipo && Object.values(categoria._count).some(Boolean)) throw error('Una categoría con registros no puede cambiar de tipo. Crea otra categoría.');
  }
  const existe = await tx.categoria.findFirst({ where: { usuarioId, ...(categoria ? { id: { not: categoria.id } } : {}), nombre: { equals: values.nombre, mode: 'insensitive' } } });
  if (existe) throw error('Ya tienes una categoría con ese nombre', 409);
  if (body.archivada !== undefined && typeof body.archivada !== 'boolean') throw error('Estado no válido');
  return categoria ? tx.categoria.update({ where: { id: categoria.id }, data: { ...values, ...(body.archivada === undefined ? {} : { archivada: body.archivada }) } }) : tx.categoria.create({ data: { ...values, usuarioId } });
}

async function eliminar(tx, usuarioId, categoriaId, destinoId) {
  const origen = await tx.categoria.findFirst({ where: { id: id(categoriaId), usuarioId }, include: referencias });
  if (!origen) throw error('Categoría no encontrada', 404);
  if (Object.values(origen._count).some(Boolean)) {
    if (!destinoId) throw error('Esta categoría tiene registros. Archívala o elige otra categoría para reasignarlos.', 409);
    const destino = await tx.categoria.findFirst({ where: { id: id(destinoId), usuarioId, tipo: origen.tipo, archivada: false } });
    if (!destino || destino.id === origen.id) throw error('Elige otra categoría activa del mismo tipo');
    const presupuestos = await tx.presupuesto.findMany({ where: { categoriaId: origen.id } });
    for (const p of presupuestos) {
      if (await tx.presupuesto.findUnique({ where: { categoriaId_anio_mes: { categoriaId: destino.id, anio: p.anio, mes: p.mes } } })) throw error('Ambas categorías tienen presupuesto para el mismo mes. Ajusta esos presupuestos o archiva la categoría.', 409);
    }
    await tx.movimiento.updateMany({ where: { categoriaId: origen.id }, data: { categoriaId: destino.id } });
    await tx.presupuesto.updateMany({ where: { categoriaId: origen.id }, data: { categoriaId: destino.id } });
    await tx.gastoRecurrente.updateMany({ where: { categoriaId: origen.id }, data: { categoriaId: destino.id } });
  }
  await tx.categoria.delete({ where: { id: origen.id } });
}
module.exports = { guardar, eliminar, referencias };
