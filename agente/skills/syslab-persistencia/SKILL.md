# SKILL.md — syslab-persistencia

## Nombre
SysLab 2.0 — Persistencia con Prisma + PostgreSQL

## Descripción
Referencia para modelar y migrar la base de datos de **Personal Finance Manager**
usando Prisma ORM sobre PostgreSQL, incluyendo reglas de diseño, migraciones y
seed idempotente.

## Instrucciones

### Modelado
- Usar `Decimal(12,2)` para montos de dinero (nunca `Float`).
- Incluir auditoría `creadoEn`/`actualizadoEn` con `@default(now())` y `@updatedAt`.
- Toda entidad de dominio (movimiento) referencia al `Usuario` dueño de los datos.
- Usar `@map` para nombres de columnas en `snake_case`.

### Migraciones
```bash
npx prisma generate          # Regenerar cliente
npx prisma migrate dev --name init   # Crear/aplicar migraciones en dev
docker compose exec backend npx prisma migrate dev --name init
```

### Seed idempotente
- Usar `upsert` para que ejecutar el seed varias veces no duplique datos.
- Hash de contraseñas con Bcrypt, nunca texto plano.
- El seed se declara en `package.json`:

```json
"prisma": { "seed": "node prisma/seed.js" }
```

```bash
npx prisma db seed
```

### Verificación
- `npx prisma db push` o `migrate dev` deben terminar en "in sync".
- Revisar datos con `docker compose exec postgres-db psql -U admin_syslab -d syslab_db -c '\dt'`.