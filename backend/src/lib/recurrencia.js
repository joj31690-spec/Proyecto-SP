// Las mensualidades conservan el día original: 31 ene → 28 feb → 31 mar.
function siguiente(actual, frecuencia, inicio) {
  const d = new Date(actual);
  if (frecuencia === 'semanal' || frecuencia === 'quincenal') {
    d.setUTCDate(d.getUTCDate() + (frecuencia === 'semanal' ? 7 : 14));
  } else {
    const mes = d.getUTCMonth() + (frecuencia === 'anual' ? 12 : 1);
    const ultimo = new Date(Date.UTC(d.getUTCFullYear(), mes + 1, 0)).getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(mes);
    d.setUTCDate(Math.min(new Date(inicio).getUTCDate(), ultimo));
  }
  return d;
}

function recordatorio(gasto, hoy) {
  const dias = Math.round((new Date(gasto.proximoVencimiento).getTime() - new Date(`${hoy}T00:00:00Z`).getTime()) / 86400000);
  return { ...gasto, diasRestantes: dias, estado: !gasto.activo ? 'pausado' : dias < 0 ? 'vencido' : dias === 0 ? 'hoy' : dias <= gasto.diasAviso ? 'proximo' : 'pendiente' };
}

module.exports = { siguiente, recordatorio };
