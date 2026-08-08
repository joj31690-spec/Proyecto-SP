# Proyecto-SP

Sistema web para la **gestión y control de finanzas personales**, diseñado para permitir a un usuario registrar, organizar y analizar sus ingresos y gastos con el objetivo de obtener una visión clara de sus hábitos financieros y facilitar la toma de decisiones sobre el uso de su dinero.

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

## ⚙️ Funcionalidades principales

### 🔐 Autenticación

El usuario podrá crear una cuenta e iniciar sesión para acceder a su información financiera.

Las cuentas estarán protegidas mediante autenticación basada en **JWT** y contraseñas almacenadas de forma segura mediante **Bcrypt**.

### 💰 Gestión de ingresos y gastos

El usuario podrá registrar movimientos financieros indicando información como:

* Tipo de movimiento: ingreso o gasto.
* Monto.
* Categoría.
* Descripción.
* Fecha.
* Método de pago.

También podrá modificar y eliminar los movimientos registrados.

### 🏷️ Categorías

Los movimientos financieros podrán organizarse mediante categorías.

Algunos ejemplos:

* Alimentación
* Transporte
* Vivienda
* Servicios
* Entretenimiento
* Salud
* Educación
* Compras
* Salario
* Otros

### 📊 Dashboard financiero

El sistema contará con un panel principal que mostrará un resumen de la situación financiera del usuario.

Entre los datos que podrán visualizarse:

* Saldo actual.
* Total de ingresos.
* Total de gastos.
* Ingresos del periodo.
* Gastos del periodo.
* Distribución de gastos por categoría.

### 🔎 Historial y filtros

El usuario podrá consultar todos sus movimientos registrados y utilizar filtros para encontrar información específica.

Los filtros podrán incluir:

* Fecha.
* Tipo de movimiento.
* Categoría.
* Método de pago.
* Rango de montos.

## 🛠️ Tecnologías

### Frontend

* **React.js 19** — Biblioteca principal para construir la interfaz de usuario mediante componentes reutilizables.
* **Vite** — Herramienta utilizada para el entorno de desarrollo y la construcción del proyecto.
* **React Router DOM** — Gestión de las rutas y navegación de la aplicación como Single Page Application (SPA).
* **SWR** — Obtención, caché y revalidación de los datos provenientes de la API.
* **Axios** — Cliente HTTP utilizado para la comunicación entre el frontend y el backend.
* **CSS Vanilla** — Desarrollo de estilos utilizando CSS nativo y variables CSS para la implementación de temas como modo claro y oscuro.

### Backend

* **Node.js** — Entorno de ejecución utilizado para el servidor.
* **Express** — Framework utilizado para construir la API RESTful.
* **Prisma ORM** — ORM utilizado para interactuar con la base de datos y gestionar modelos, relaciones y migraciones.
* **PostgreSQL** — Sistema gestor de base de datos relacional.
* **Neon** — Plataforma utilizada para alojar la base de datos PostgreSQL.
* **JWT (JSON Web Tokens)** — Sistema utilizado para la autenticación y gestión de sesiones.
* **Bcrypt** — Biblioteca utilizada para realizar el hash seguro de las contraseñas.

### Gestor de paquetes

* **pnpm** — Gestor de paquetes utilizado para administrar las dependencias del proyecto.

## 🏗️ Arquitectura

El proyecto seguirá una arquitectura cliente-servidor, separando la aplicación en un frontend encargado de la interfaz de usuario y un backend encargado de la lógica de negocio y acceso a los datos.

```text
┌─────────────────────────────┐
│           FRONTEND          │
│                             │
│ React + Vite                │
│ React Router                │
│ SWR + Axios                 │
│ CSS Vanilla                 │
└──────────────┬──────────────┘
               │
               │ HTTP / REST API
               │
┌──────────────▼──────────────┐
│           BACKEND           │
│                             │
│ Node.js + Express           │
│ JWT + Bcrypt                │
│ Prisma ORM                  │
└──────────────┬──────────────┘
               │
               │
┌──────────────▼──────────────┐
│          DATABASE           │
│                             │
│ PostgreSQL + Neon           │
└─────────────────────────────┘
```

## 📂 Estructura inicial

```text
personal-finance-manager/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── prisma/
│   └── package.json
│
├── README.md
└── package.json
```

La estructura podrá modificarse conforme avance el desarrollo y se incorporen nuevos módulos.

## 📈 Alcance inicial

La primera versión del proyecto estará enfocada en las funcionalidades fundamentales:

1. Registro de usuarios.
2. Inicio de sesión.
3. Gestión de ingresos.
4. Gestión de gastos.
5. Gestión de categorías.
6. Consulta del historial financiero.
7. Filtros de movimientos.
8. Dashboard financiero.
9. Cálculo del balance personal.
10. Modo claro y oscuro.

El objetivo de esta primera versión será construir una base funcional sobre la cual puedan incorporarse posteriormente nuevas características.

## 🚀 Posibles funcionalidades futuras

Una vez implementada la versión inicial, el sistema podrá ampliarse con funcionalidades como:

* Presupuestos mensuales.
* Límites de gasto por categoría.
* Metas de ahorro.
* Gastos e ingresos recurrentes.
* Recordatorios de pagos.
* Gestión de deudas personales.
* Comparación de gastos entre diferentes meses.
* Estadísticas y gráficos avanzados.
* Exportación de información a Excel o PDF.
* Importación de movimientos.
* Notificaciones.

Estas funcionalidades no forman parte necesariamente de la primera versión y podrán incorporarse posteriormente según las necesidades del proyecto.

## 👤 Usuario objetivo

El sistema está dirigido a **personas que desean llevar un control organizado de sus finanzas personales**, permitiéndoles registrar sus movimientos financieros y consultar información que les ayude a comprender mejor sus hábitos de gasto.

El proyecto estará orientado inicialmente al **uso personal**, no a la administración contable de empresas.
