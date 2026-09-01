// backend/prisma.config.ts
import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // La URL de conexión se inyecta desde la variable de entorno DATABASE_URL
    // (no se hardcodean credenciales en el repositorio).
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'node ./prisma/seed.js',
  },
  schema: 'prisma/schema.prisma',
});