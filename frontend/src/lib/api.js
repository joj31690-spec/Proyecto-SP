// frontend/src/lib/api.js
import { getToken, expireSession } from './auth';

const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = auth ? getToken() : null;
  if (auth) {
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (auth && res.status === 401) expireSession(token);
    const err = new Error(data.message || 'Error en la petición');
    err.status = res.status;
    throw err;
  }
  return data.data !== undefined ? data.data : data;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  register: (nombre, email, password) => request('/auth/register', { method: 'POST', body: { nombre, email, password }, auth: false }),

  getCategorias: () => request('/categorias'),
  getMovimientos: (filtros = {}) => request(`/movimientos?${new URLSearchParams(Object.entries(filtros).filter(([, v]) => v !== ''))}`),
  getMetodos: () => request('/movimientos/metodos'),
  createMovimiento: (m) => request('/movimientos', { method: 'POST', body: m }),
  updateMovimiento: (id, m) => request(`/movimientos/${id}`, { method: 'PUT', body: m }),
  deleteMovimiento: (id) => request(`/movimientos/${id}`, { method: 'DELETE' }),

  getPresupuestos: (anio, mes) => request(`/presupuestos?anio=${anio}&mes=${mes}`),
  savePresupuesto: (p) => request('/presupuestos', { method: 'POST', body: p }),
  deletePresupuesto: (id) => request(`/presupuestos/${id}`, { method: 'DELETE' }),

  getDashboard: () => request('/dashboard'),
  getMetas: () => request('/metas'),
  saveMeta: (id, m) => request(`/metas${id ? `/${id}` : ''}`, { method: id ? 'PUT' : 'POST', body: m }),
  deleteMeta: (id) => request(`/metas/${id}`, { method: 'DELETE' }),
  createAporte: (id, a) => request(`/metas/${id}/aportes`, { method: 'POST', body: a }),
  deleteAporte: (id, aporteId) => request(`/metas/${id}/aportes/${aporteId}`, { method: 'DELETE' }),
  getRecurrentes: () => request('/recurrentes'),
  createRecurrente: (r) => request('/recurrentes', { method: 'POST', body: r }),
  estadoRecurrente: (id, activo) => request(`/recurrentes/${id}/estado`, { method: 'PATCH', body: { activo } }),
  deleteRecurrente: (id) => request(`/recurrentes/${id}`, { method: 'DELETE' }),
  pagarRecurrente: (id, pago) => request(`/recurrentes/${id}/pagar`, { method: 'POST', body: pago }),
};
