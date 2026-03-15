const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Todas las rutas en este archivo están protegidas y requieren rol de ADMIN
router.use(verifyToken, checkRole(['ADMIN']));

// GET /api/users -> Obtener todos los usuarios
router.get('/', userController.getAllUsers);

// GET /api/users/:id -> Obtener un usuario por ID
router.get('/:id', userController.getUserById);

// PUT /api/users/:id -> Actualizar un usuario
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id -> Eliminar un usuario
router.delete('/:id', userController.deleteUser);

module.exports = router;
