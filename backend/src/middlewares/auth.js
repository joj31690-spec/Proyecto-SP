// backend/src/middlewares/auth.js
// Middleware que verifica el token JWT en el header Authorization.
// Asigna req.usuario = { id, email, nombre } si es válido.
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'No autenticado: falta el token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.id, email: payload.email, nombre: payload.nombre };
    next();
  } catch (e) {
    return res.status(401).json({ status: 'error', message: 'Token inválido o expirado' });
  }
};