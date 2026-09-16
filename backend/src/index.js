// backend/src/index.js
// Personal Finance Manager — Servidor Express
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const auth = require('./middlewares/auth');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/auth.routes');
const categoriasRoutes = require('./routes/categorias.routes');
const movimientosRoutes = require('./routes/movimientos.routes');
const presupuestosRoutes = require('./routes/presupuestos.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const app = express();

// CORS: permitir el frontend local (localhost) y cualquier FRONTEND_URL configurada
const origenesPermitidos = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];
if (process.env.FRONTEND_URL) {
  origenesPermitidos.push(new RegExp(`^${process.env.FRONTEND_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`));
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || origenesPermitidos.some((r) => r.test(origin))) {
      return callback(null, true);
    }
    return callback(new Error('Origen no permitido por CORS'));
  },
}));
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Personal Finance Manager API',
    version: '1.0.0',
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Rutas públicas
app.use('/api/auth', authRoutes);

// Rutas protegidas (requieren token JWT)
app.use('/api/categorias', auth, categoriasRoutes);
app.use('/api/movimientos', auth, movimientosRoutes);
app.use('/api/presupuestos', auth, presupuestosRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);

// Ruta no encontrada
app.use('/api', (req, res) => {
  res.status(404).json({ status: 'error', message: 'Ruta no encontrada' });
});

// Error handling centralizado
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Personal Finance Manager corriendo en el puerto ${PORT}`);
});