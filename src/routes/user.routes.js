const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Middleware para todas las rutas de este fichero: deben estar autenticados.
router.use(verifyToken);

// Rutas con sus respectivos permisos por rol
const canManageUsers = checkRole(['ADMIN', 'SUPERVISOR']);

// POST /api/users -> Crear un nuevo usuario (ADMIN crea cualquier rol, SUPERVISOR crea solo USER)
router.post('/', canManageUsers, userController.createUser);

// GET /api/users -> Obtener todos los usuarios (ADMIN ve todos, SUPERVISOR solo los suyos)
router.get('/', canManageUsers, userController.getAllUsers);

// GET /api/users/:id -> Obtener un usuario por ID (SUPERVISOR solo puede ver los suyos)
router.get('/:id', canManageUsers, userController.getUserById);

// PUT /api/users/:id -> Actualizar un usuario (SUPERVISOR solo puede actualizar los suyos)
router.put('/:id', canManageUsers, userController.updateUser);

// DELETE /api/users/:id -> Eliminar un usuario (SUPERVISOR solo puede eliminar los suyos)
router.delete('/:id', canManageUsers, userController.deleteUser);

module.exports = router;
