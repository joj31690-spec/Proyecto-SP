// backend/prisma/seed.js
// ============================================================
// Personal Finance Manager — Script de datos iniciales (Seed)
// ============================================================
require('dotenv').config({ path: __dirname + '/../.env' });

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Driver Adapter requerido por Prisma 7 en el entorno Docker
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed de Personal Finance Manager...');

  // 1. Usuario de demostración
  const passwordHash = await bcrypt.hash('Demo1234!', 10);

  const usuario = await prisma.usuario.upsert({
    where: { email: 'demo@finanzas.bo' },
    update: {},
    create: {
      nombre: 'Usuario Demo',
      email: 'demo@finanzas.bo',
      passwordHash,
      activo: true,
    },
  });
  console.log(`✅ Usuario creado: ${usuario.email}`);

  // 2. Categorías por defecto
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

  const categorias = [];
  for (const c of categoriasDefault) {
    const categoria = await prisma.categoria.upsert({
      where: { usuarioId_nombre: { usuarioId: usuario.id, nombre: c.nombre } },
      update: {},
      create: { ...c, usuarioId: usuario.id },
    });
    categorias.push(categoria);
  }
  console.log(`✅ ${categorias.length} categorías creadas.`);

  // 3. Movimientos de ejemplo (balance de demostración)
  const salario = categorias.find((c) => c.nombre === 'Salario');
  const alimentos = categorias.find((c) => c.nombre === 'Alimentación');
  const transporte = categorias.find((c) => c.nombre === 'Transporte');
  const vivienda = categorias.find((c) => c.nombre === 'Vivienda');

  await prisma.movimiento.createMany({
    data: [
      {
        tipo: 'ingreso',
        monto: 4500.0,
        descripcion: 'Sueldo mensual',
        fecha: new Date(),
        metodoPago: 'Transferencia',
        usuarioId: usuario.id,
        categoriaId: salario.id,
      },
      {
        tipo: 'gasto',
        monto: 850.0,
        descripcion: 'Supermercado quincenal',
        fecha: new Date(),
        metodoPago: 'Tarjeta',
        usuarioId: usuario.id,
        categoriaId: alimentos.id,
      },
      {
        tipo: 'gasto',
        monto: 220.0,
        descripcion: 'Pasajes y combustible',
        fecha: new Date(),
        metodoPago: 'Efectivo',
        usuarioId: usuario.id,
        categoriaId: transporte.id,
      },
      {
        tipo: 'gasto',
        monto: 1200.0,
        descripcion: 'Alquiler del mes',
        fecha: new Date(),
        metodoPago: 'Transferencia',
        usuarioId: usuario.id,
        categoriaId: vivienda.id,
      },
    ],
  });
  console.log('✅ 4 movimientos de ejemplo creados.');
  console.log('🎉 Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
