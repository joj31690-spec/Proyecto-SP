// frontend/src/lib/api.js
import { getToken } from './auth';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
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
  getMovimientos: () => request('/movimientos'),
  createMovimiento: (m) => request('/movimientos', { method: 'POST', body: m }),
  deleteMovimiento: (id) => request(`/movimientos/${id}`, { method: 'DELETE' }),

  getDashboard: () => request('/dashboard'),
};
