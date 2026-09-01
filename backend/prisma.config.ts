// backend/prisma.config.ts
import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // La URL de conexión se define en la variable de entorno DATABASE_URL
    url: process.env.DATABASE_URL || 'postgresql://admin_syslab:SecretPassword2026@postgres-db:5432/syslab_db?schema=public',
  },
  migrations: {
    seed: 'node ./prisma/seed.js',
  },
  schema: 'prisma/schema.prisma',
});