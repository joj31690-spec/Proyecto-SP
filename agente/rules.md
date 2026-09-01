# rules.md — Reglas e Instrucciones del Agente

> Reglas que gobiernan el comportamiento del agente de IA en el desarrollo del
> backend y la persistencia de **Personal Finance Manager (SysLab 2.0)**.

## 1. Objetivo

El agente colabora en el desarrollo de una API REST para la gestión de finanzas
personales: autenticación de usuarios, registro de ingresos/gastos, categorías,
historial y dashboard. Todas las decisiones de código deben alinearse con la
arquitectura **SysLab 2.0** y con las reglas de este archivo.

## 2. Arquitectura y Stack

- **Backend:** Node.js + Express (API RESTful).
- **Persistencia:** PostgreSQL mediante **Prisma ORM**.
- **Autenticación:** JWT + contraseñas con hash **Bcrypt**.
- **Frontend:** React + Vite, consumiendo `/api`.
- **Contenedores:** Docker Compose orquestando `frontend-app`, `backend-api` y `postgres-db`.

## 3. Reglas de comportamiento del backend

1. **Rutas RESTful** — Nombrar los endpoints en plural y en español, bajo `/api`:
   `/api/auth`, `/api/categorias`, `/api/movimientos`, `/api/dashboard`.
2. **Controladores delgados** — La lógica de negocio va en servicios, no en los
   controladores.
3. **Error handling centralizado** — Todo error debe responder JSON con
   `{ "status": "error", "message": "..." }`. No exponer stack traces en producción.
4. **Validación** — Validar payloads (montos positivos, tipos `ingreso|gasto`,
   categorías existentes) antes de tocar la base de datos.
5. **Autenticación protegida por defecto** — Los endpoints de finanzas exigen
   token JWT válido; el hash de contraseñas siempre con Bcrypt (costo 10+).
6. **No exponer secretos** — `.env` jamás se sube al repositorio.

## 4. Reglas de persistencia (Prisma)

1. Toda consulta pasa por el cliente Prisma; no usar SQL crudo.
2. El modelo `Movimiento` siempre referencia `Usuario` (los datos pertenecen a un
   usuario) y `Categoria`.
3. Los montos se manejan como `Decimal(12,2)` (dinero), nunca `Float`.
4. Los campos de auditoría `creadoEn` / `actualizadoEn` deben estar presentes en
   los modelos principales.
5. Migraciones: usar `prisma migrate dev` en desarrollo y registrar el estado en
   Git bajo la carpeta `backend/prisma/`.

## 5. Convención de commits

Mensajes en **español** con Conventional Commits:

| Tipo   | Uso                                   | Ejemplo                                      |
| ------ | ------------------------------------- | -------------------------------------------- |
| `feat` | Nuevas características                | `feat(backend): agregar modelo de datos`     |
| `fix`  | Corrección de errores                 | `fix(docker): corregir puerto de postgres`   |
| `docs` | Documentación                         | `docs(readme): instrucciones de ejecución`   |
| `chore`| Mantenimiento / configuración / deps  | `chore(agente): instalar skills de tasteskill` |

## 6. Verificación obligatoria antes de cada commit

1. `npm run` / sintaxis válida en archivos modificados.
2. `docker compose config` sin errores.
3. El `schema.prisma` debe poder ejecutar `prisma generate` sin errores.
4. Ejecutar el seed y verificar que la base queda poblada.