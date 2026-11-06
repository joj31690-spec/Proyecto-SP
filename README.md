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
* Definir presupuestos mensuales por categoría y controlar el gasto real.
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
# Las migraciones versionadas se aplican automáticamente al iniciar el backend.
# También se pueden aplicar manualmente:
docker compose exec backend-api npx prisma migrate deploy

# Ejecutar el script de poblado de datos (Seed)
docker compose exec backend-api node prisma/seed.js
```

### Acceso

| Servicio   | URL                                          |
| ---------- | -------------------------------------------- |
| Frontend   | http://localhost:5173                        |
| Backend    | http://localhost:5000/api                    |
| PostgreSQL | `localhost:5433` (usuario `admin_syslab`)    |

Desde otro equipo de la red, abrir `http://<IP-de-la-VM>:5173`.
El frontend consulta `/api` en esa misma dirección y Vite reenvía las peticiones
al backend mediante la red interna de Docker (`http://backend-api:5000`).
Así, el navegador no depende de una IP fija para la API ni de acceder al puerto 5000.
Docker Compose establece `VITE_API_URL=/api` y `API_PROXY_TARGET` automáticamente.
Si se ejecuta Vite fuera de Docker, el proxy utiliza `http://localhost:5000` por defecto.
Para servir una compilación con otro servidor web, configurar también el proxy de `/api`.

Si aparece `No se pudo cargar el resumen: Failed to fetch`, comprobar
`docker compose ps` y `http://<IP-de-la-VM>:5173/api/health`.
Después de cambiar variables de entorno, aplicar los cambios con
`docker compose up -d` y recargar la página.

### Detener el sistema

```bash
docker compose down
```

> **Nota:** no usar `docker compose down -v` si se desea conservar los datos de PostgreSQL (se almacenan en el volumen `postgres_data`).

---

## Funcionalidades de gestión financiera

### Movimientos

- Crear, editar y eliminar ingresos o gastos propios.
- Buscar por descripción y combinar filtros por fechas (ambos extremos incluidos),
  categoría, tipo y método de pago. Los métodos incluyen los valores registrados
  por el usuario; al registrar un movimiento se sugieren efectivo, QR, transferencia y tarjeta.
- Limpiar filtros y consultar el número de resultados.
- Las fechas de movimientos y sus filtros utilizan el calendario de Bolivia
  (`America/La_Paz`). Los montos admiten hasta dos decimales.

### Metas de ahorro

- Página propia en **Metas de ahorro**, con nombre, monto objetivo y fecha opcional.
- Apartado destacado en el resumen con total ahorrado, metas alcanzadas y hasta tres
  metas, mostrando primero las que siguen en progreso.
- Registrar aportes con fecha y nota; consultar y eliminar aportes incorrectos.
- Editar el objetivo o eliminar la meta con su historial. Se permiten aportes que
  superen el objetivo; la barra se limita al 100 % y la meta se marca como alcanzada.
- Los aportes son un seguimiento del dinero ya separado: **no crean gastos,
  no realizan transferencias y no modifican el saldo financiero**. El usuario debe
  evitar asignar el mismo ahorro a varias metas. La fecha objetivo es informativa.

### Gastos recurrentes y recordatorios

- Programar gastos semanales, cada 14 días, mensuales o anuales, con categoría,
  monto, método de pago, primer vencimiento pendiente y aviso entre 0 y 30 días.
- Ver recordatorios de pagos próximos, del día o vencidos en el resumen y en
  **Pagos recurrentes**. Se calculan al consultar la pantalla; no se envían correos
  ni notificaciones externas y no hace falta un proceso de tareas programadas.
- Registrar manualmente cada pago con su fecha real: se crea un gasto y se avanza
  exactamente un vencimiento. Las cuotas atrasadas se registran una por una.
- Dos solicitudes simultáneas para la misma cuota no duplican el pago.
- Las mensualidades conservan su día original: 31 de enero → último día de febrero
  → 31 de marzo. Las anualidades también consideran años bisiestos.
- Pausar y reactivar conserva el vencimiento pendiente. Eliminar la programación
  conserva los movimientos pagados; eliminar un movimiento no retrocede el calendario.

### Verificaciones

Con los servicios levantados:

```bash
docker compose exec backend-api npm test
docker compose exec frontend-app npm run build
docker compose config --quiet
```

Las pruebas de API crean usuarios temporales y los eliminan al terminar. Cubren
edición, filtros combinados, aislamiento por usuario, aportes, metas alcanzadas,
saldo, recordatorios y concurrencia de pagos, además del calendario de recurrencias.

Si se actualiza una instalación antigua creada con `prisma db push`, antes de
usar las migraciones se debe comprobar que su esquema coincide con las migraciones
existentes y establecer la línea base con `prisma migrate resolve --applied` para
las migraciones que ya estén reflejadas en esa base. No se debe reiniciar ni borrar
la base para actualizarla.

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

## 📖 Historias de Usuario y Criterios de Aceptación (Implementadas)

Historias de usuario ya **implementadas** en el sistema, cada una con su criterio de aceptación verificado.

### Historia de Usuario 1 — Definición y control de presupuestos mensuales

> **Como** usuario, **quiero** definir un límite de gasto mensual por categoría **para** controlar mi consumo y evitar sobrepasarlo.

**Criterio de aceptación:** el sistema permite guardar un presupuesto por categoría (gasto) para un periodo específico (mes/año), muestra el gasto real acumulado frente al límite con una barra de progreso y marca en rojo las categorías que exceden el presupuesto.

### Historia de Usuario 2 — Registro y administración de movimientos

> **Como** usuario, **quiero** registrar, consultar y eliminar mis ingresos y gastos clasificándolos por categoría **para** mantener un control de mi historial financiero.

**Criterio de aceptación:** el sistema permite crear un movimiento de tipo ingreso o gasto con monto mayor a 0, fecha, método de pago y una categoría válida del usuario, lo lista ordenado por fecha y permite eliminarlo.

### Historia de Usuario 3 — Visualización del resumen financiero

> **Como** usuario, **quiero** visualizar un resumen de mi situación financiera **para** conocer mi saldo, mis ingresos y gastos totales y los del mes en curso.

**Criterio de aceptación:** el dashboard muestra el saldo total, el total de ingresos, el total de gastos, el balance del mes y los movimientos más recientes, calculados exclusivamente con los datos del usuario autenticado.

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
