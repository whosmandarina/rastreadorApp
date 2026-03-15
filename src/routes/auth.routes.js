const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// Rutas públicas
router.post('/register', authController.register); // Idealmente debería estar protegida solo para ADMIN, pero la dejamos abierta para facilitar pruebas
router.post('/login', authController.login);

// Rutas protegidas (requieren token válido)
router.post('/logout', verifyToken, authController.logout);

module.exports = router;
