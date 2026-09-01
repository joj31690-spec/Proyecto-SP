// backend/src/index.js
// Personal Finance Manager — Servidor Express
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
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

// Error handling centralizado
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor Personal Finance Manager corriendo en el puerto ${PORT}`);
});