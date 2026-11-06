export function hoy() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function dia(fecha) {
  return fecha ? fecha.slice(0, 10) : '';
}

export function fechaVisible(fecha) {
  if (!fecha) return 'Sin fecha límite';
  return new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/La_Paz' }).format(new Date(`${dia(fecha)}T12:00:00Z`));
}
