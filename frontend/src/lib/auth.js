// frontend/src/lib/auth.js
// Gestión de sesión en localStorage (token JWT + datos de usuario)

const TOKEN_KEY = 'pfm_token';
const USER_KEY = 'pfm_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

export function saveSession({ token, usuario }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAutenticado() {
  return Boolean(getToken());
}
