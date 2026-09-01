# Skills del Agente

Estructura de integración de skills para el agente de IA del proyecto.

## Skills base — TasteSkill

Skills de referencia descargadas desde [TasteSkill](https://www.tasteskill.dev/).

| Skill      | Descripción                                        | Estado        |
| ---------- | -------------------------------------------------- | ------------- |
| Node.js    | Buenas prácticas para el backend en Node           | Descargar ✔  |
| Express    | Estructura de API REST con Express                 | Descargar ✔  |
| Prisma ORM | Modelado y migraciones con Prisma                  | Descargar ✔  |
| React/Vite | Componentes y flujo SPA con Vite                   | Descargar ✔  |
| Docker     | Buenas prácticas en Dockerfiles y Compose          | Descargar ✔  |

> ⚠️ Placeholder: descargar cada skill desde TasteSkill y colocar su contenido
> en una subcarpeta dentro de `agente/skills/tasteskill/`.

## Skills personalizadas — SysLab 2.0

Skills custom alineadas a la arquitectura **SysLab 2.0**:

- `syslab-backend/` — Skill para el backend (patrón controlador-servicio, auth JWT,
  manejo de errores centralizado).
- `syslab-persistencia/` — Skill para Prisma/PostgreSQL (modelos, Decimal para
  montos, migraciones, seed idempotente).
- `syslab-docker/` — Skill para orquestación multi-contenedor (Compose, healthchecks,
  redes, volúmenes).

## Cómo añadir una skill

1. Crear la carpeta dentro de `agente/skills/`.
2. Incluir un `SKILL.md` con: nombre, descripción, instrucciones y ejemplos.
3. Referenciarla en `agente/rules.md` cuando corresponda.