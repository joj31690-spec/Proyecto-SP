# SKILL.md — syslab-backend

## Nombre
SysLab 2.0 — Backend API REST

## Descripción
Patrón de referencia para construir la API backend de **Personal Finance Manager**
bajo la arquitectura SysLab 2.0: Express + TypeScript/JS, capas de
ruta-controlador-servicio, autenticación JWT y error handling centralizado.

## Instrucciones

### Rutas
- Todos los endpoints bajo el prefijo `/api`.
- Sustantivos en plural: `/api/movimientos`, `/api/categorias`, `/api/dashboard`.

### Estructura de carpetas recomendada
```text
backend/src/
├── routes/        # Definición de rutas
├── controllers/   # Capa delgada: responde al cliente
├── services/      # Lógica de negocio
├── middlewares/   # auth, validación, errorHandler
├── lib/
│   └── prisma.js  # Cliente Prisma único
└── index.js       # Bootstrap del servidor
```

### Autenticación
```js
// middlewares/auth.js
const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ status: 'error', message: 'No autenticado' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ status: 'error', message: 'Token inválido' });
  }
};
```

### Error handling centralizado
```js
// middlewares/errorHandler.js
module.exports = (err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Error interno del servidor',
  });
};
```

## Ejemplo de uso
```js
// routes/movimientos.js
const router = require('express').Router();
const controller = require('../controllers/movimientos.controller');
const auth = require('../middlewares/auth');

router.use(auth);
router.get('/', controller.listar);
router.post('/', controller.crear);
router.get('/:id', controller.obtener);
router.patch('/:id', controller.actualizar);
router.delete('/:id', controller.eliminar);

module.exports = router;
```

## Verificación
- Levantar el backend y probar `/api/health`.
- Registrar un usuario y validar flujo login → token → CRUD de movimientos.