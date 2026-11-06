const { Prisma } = require('@prisma/client');

function error(message, status = 400) {
  return Object.assign(new Error(message), { status });
}

function id(value) {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) throw error('Identificador no válido');
  return n;
}

function dinero(value) {
  const texto = String(value ?? '');
  if (!/^\d+(\.\d{1,2})?$/.test(texto) || Number(texto) <= 0 || Number(texto) > 9999999999.99) {
    throw error('El monto debe ser positivo, con un máximo de dos decimales');
  }
  return new Prisma.Decimal(texto);
}

function texto(value, nombre, max, obligatorio = false) {
  if (value != null && typeof value !== 'string') throw error(`${nombre} no válido`);
  const t = (value || '').trim();
  if ((obligatorio && !t) || t.length > max) throw error(`${nombre}: ingresa ${obligatorio ? 'entre 1 y' : 'hasta'} ${max} caracteres`);
  return t;
}

function fecha(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw error('Fecha no válida (AAAA-MM-DD)');
  const d = new Date(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(d.getTime()) || d.toISOString().slice(0, 10) !== value) throw error('Fecha no válida');
  return d;
}

function hoy() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

module.exports = { error, id, dinero, texto, fecha, hoy };
