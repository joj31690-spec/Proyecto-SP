// backend/src/middlewares/errorHandler.js
// Manejador centralizado de errores Express.
module.exports = function errorHandler(err, req, res, next) {
  if (err.code === 'P2002') return res.status(409).json({ status: 'error', message: 'Ese nombre u operación ya existe. Actualiza la pantalla antes de intentarlo de nuevo.' });
  if (err.code === 'P2003') return res.status(409).json({ status: 'error', message: 'El registro tiene referencias. Archívalo o reasigna sus registros antes de eliminarlo.' });
  console.error(err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Error interno del servidor',
  });
};
