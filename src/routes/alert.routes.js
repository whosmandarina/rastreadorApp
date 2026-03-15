const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Solo los supervisores y administradores deberían ver todas las alertas en el dashboard
router.get('/', verifyToken, checkRole(['ADMIN', 'SUPERVISOR']), alertController.getAlerts);
router.put('/:id/read', verifyToken, checkRole(['ADMIN', 'SUPERVISOR']), alertController.markAsRead);

module.exports = router;
