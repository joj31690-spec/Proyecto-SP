# Proyecto-SP

Sistema web para la **gestión y control de finanzas personales** (**Personal Finance Manager**), diseñado para permitir a un usuario registrar, organizar y analizar sus ingresos y gastos con el objetivo de obtener una visión clara de sus hábitos financieros y facilitar la toma de decisiones sobre el uso de su dinero.

> **Docente:** Ing. Elias Cassal Baldiviezo
>
> **Materia:** Sistemas Paralelos
>
> **Arquitectura Base:** SysLab 2.0

---

## 📌 Descripción del proyecto

**Personal Finance Manager** es una aplicación web orientada a la administración de las finanzas personales de un usuario.

El sistema permitirá registrar diferentes movimientos financieros, clasificarlos mediante categorías y consultar información histórica para conocer cuánto dinero se recibe, cuánto se gasta y en qué se utiliza.

La aplicación estará diseñada de forma modular para permitir la incorporación progresiva de nuevas funcionalidades relacionadas con la gestión financiera personal, como presupuestos, metas de ahorro, gastos recurrentes, estadísticas y reportes.

El objetivo principal es proporcionar una herramienta sencilla y centralizada que permita al usuario **llevar un control de sus finanzas y comprender mejor sus hábitos de consumo**.

## 🎯 Objetivo general

Desarrollar una aplicación web que permita gestionar y analizar las finanzas personales mediante el registro de ingresos y gastos, proporcionando información organizada que facilite el control del dinero y la toma de decisiones financieras.

## 🎯 Objetivos específicos

* Registrar ingresos y gastos personales.
* Clasificar los movimientos financieros mediante categorías.
* Consultar el historial de movimientos.
* Obtener el balance entre ingresos y gastos.
* Visualizar un resumen de la situación financiera.
* Filtrar movimientos por diferentes criterios.
* Mantener la información financiera asociada a cada usuario.
* Implementar un sistema de autenticación para proteger la información.
* Diseñar una arquitectura que permita ampliar el sistema posteriormente.

---

## 🛠️ Arquitectura de Tecnologías (SysLab 2.0)

El proyecto está diseñado sobre la arquitectura **SysLab 2.0**, distribuyendo responsabilidades en tres capas principales orquestadas mediante contenedores Docker:

* **Frontend:** [React + Vite] — Interfaz de usuario responsiva.
* **Backend:** [Node.js con Express] — API RESTful / Servidor de aplicaciones.
* **Persistencia / Base de Datos:** PostgreSQL con **Prisma ORM** como mapeador objeto-relacional.
* **Agente de IA:** Reglas (`rules`) y habilidades (`skills`) personalizadas integradas desde [TasteSkill](https://www.tasteskill.dev/).

```text
┌─────────────────────────────┐
│           FRONTEND          │
│  React + Vite               │
└──────────────┬──────────────┘
               │ HTTP / REST API
┌──────────────▼──────────────┐
│           BACKEND           │
│  Node.js + Express          │
│  JWT + Bcrypt + Prisma ORM  │
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│         DATABASE            │
│  PostgreSQL (Docker)        │
└─────────────────────────────┘
```

---

## 📁 Estructura del Repositorio

```text
.
├── agente/                    # Skills e instrucciones del agente de IA
│   ├── skills/                # Skills de TasteSkill y custom SysLab 2.0
│   └── rules.md               # Reglas de comportamiento del agente
├── backend/                   # Código fuente del Backend
│   ├── prisma/
│   │   ├── migrations/        # Migraciones aplicadas (Prisma)
│   │   ├── schema.prisma      # Modelo de datos Prisma
│   │   └── seed.js            # Script de datos iniciales
│   ├── Dockerfile             # Imagen Docker del Backend
│   └── package.json
├── frontend/                  # Código fuente del Frontend
│   ├── Dockerfile             # Imagen Docker del Frontend
│   └── package.json
├── docker-compose.yml         # Orquestación de contenedores (Frontend, Backend, DB)
└── README.md                  # Documentación general del proyecto
```

---

## 🚀 Guía de Ejecución

### Requisitos previos

* Docker Engine + Docker Compose V2 instalados.

### Levantar el sistema

```bash
# 1. Configurar credenciales
cp .env.example .env

# 2. Construir y levantar los contenedores
docker compose up --build -d

# 3. Verificar el estado
docker compose ps
```

### Migraciones y datos iniciales

```bash
# Ejecutar migraciones (crear tablas en PostgreSQL)
docker compose exec backend-api npx prisma migrate dev --name init

# Ejecutar el script de poblado de datos (Seed)
docker compose exec backend-api node prisma/seed.js
```

### Acceso

| Servicio   | URL                                          |
| ---------- | -------------------------------------------- |
| Frontend   | http://localhost:5173                        |
| Backend    | http://localhost:5000/api                    |
| PostgreSQL | `localhost:5433` (usuario `admin_syslab`)    |

### Detener el sistema

```bash
docker compose down
```

> **Nota:** no usar `docker compose down -v` si se desea conservar los datos de PostgreSQL (se almacenan en el volumen `postgres_data`).

---

## 🔐 Seguridad: variables de entorno y secretos

Este repositorio es **público**, por lo que no contiene credenciales reales:

* Los archivos `.env`, `backend/.env` y `frontend/.env` están ignorados por Git (ver `.gitignore`) y nunca se suben al repositorio.
* `docker-compose.yml` lee las credenciales de PostgreSQL desde variables del `.env` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`).
* `backend/prisma.config.ts` obtiene la conexión desde `DATABASE_URL` (inyectada por el contenedor), sin credenciales hardcodeadas.
* `.env.example` es la plantilla pública con placeholders; para ejecutar localmente se debe crear `.env` copiando la plantilla y reemplazando los valores.

```bash
cp .env.example .env
# editar .env con tus valores reales y NO subirlo al repositorio
```

---

## 🧩 Las 6 Evidencias de la Práctica

1. **Estructura de directorios e inicialización** — árbol del proyecto con `package.json` en `./backend` y `./frontend`.
2. **Modelado de persistencia** — captura de `schema.prisma` y `git log -1` del commit `feat(backend)`.
3. **Agente, reglas e skills** — explorador mostrando `agente/` con las skills y `rules.md`.
4. **Docker Compose** — `docker compose ps` con los 3 contenedores en estado `Up` / `healthy`.
5. **Migraciones y seed** — resultado exitoso de `prisma migrate dev` y ejecución de `seed.js`.
6. **Documentación y publicación** — este repositorio público y el `README.md` renderizado en GitHub.

---

## 📜 Historial de Commits (Conventional Commits)

```text
7603ac8 fix(security): remover credenciales hardcodeadas y parametrizar postgres via .env
318d778 docs(readme): completar documentacion del proyecto y guia de ejecucion
731b6be feat(db): migrar esquema a postgresql y ejecutar script de seed
70ffa5b feat(docker): configurar entorno multi-contenedor con docker-compose
f593b4c chore(agente): incorporar skills de tasteskill y reglas de arquitectura syslab 2.0
b452fa7 feat(backend): definir esquema de prisma y script de seed inicial
2ee452b chore(init): inicializar estructura base del proyecto
```

---

## 📧 Contacto

* **Docente:** Ing. Elias Cassal Baldiviezo
* **Materia:** Sistemas Paralelos