// backend/src/routes/auth.routes.js
// Autenticación: registro y login con JWT + Bcrypt
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, nombre: usuario.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

function publico(usuario) {
  return { id: usuario.id, nombre: usuario.nombre, email: usuario.email };
}

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ status: 'error', message: 'Email y contraseña son obligatorios' });
    }

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ status: 'error', message: 'Credenciales incorrectas' });
    }

    const valido = await bcrypt.compare(password, usuario.passwordHash);
    if (!valido) {
      return res.status(401).json({ status: 'error', message: 'Credenciales incorrectas' });
    }

    res.json({ status: 'ok', token: generarToken(usuario), usuario: publico(usuario) });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body || {};
    if (!nombre || !email || !password) {
      return res.status(400).json({ status: 'error', message: 'Nombre, email y contraseña son obligatorios' });
    }
    if (password.length < 6) {
      return res.status(400).json({ status: 'error', message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return res.status(409).json({ status: 'error', message: 'Ya existe una cuenta con ese email' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: { nombre, email, passwordHash, activo: true },
    });

    // Crear categorías por defecto para el nuevo usuario
    const categoriasDefault = [
      { nombre: 'Salario', tipo: 'ingreso', color: '#22c55e' },
      { nombre: 'Alimentación', tipo: 'gasto', color: '#f97316' },
      { nombre: 'Transporte', tipo: 'gasto', color: '#3b82f6' },
      { nombre: 'Vivienda', tipo: 'gasto', color: '#8b5cf6' },
      { nombre: 'Servicios', tipo: 'gasto', color: '#06b6d4' },
      { nombre: 'Entretenimiento', tipo: 'gasto', color: '#ec4899' },
      { nombre: 'Salud', tipo: 'gasto', color: '#ef4444' },
      { nombre: 'Educación', tipo: 'gasto', color: '#f59e0b' },
      { nombre: 'Compras', tipo: 'gasto', color: '#10b981' },
    ];
    await prisma.categoria.createMany({
      data: categoriasDefault.map((c) => ({ ...c, usuarioId: usuario.id })),
    });

    res.status(201).json({ status: 'ok', token: generarToken(usuario), usuario: publico(usuario) });
  } catch (e) {
    next(e);
  }
});

module.exports = router;