const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Rutas accesibles para Admin y Supervisor
router.get('/route/:userId', verifyToken, checkRole(['ADMIN', 'SUPERVISOR']), reportController.getRoute);
router.get('/stats/:userId', verifyToken, checkRole(['ADMIN', 'SUPERVISOR']), reportController.getStats);

// Exportación
router.get('/export/pdf/:userId', verifyToken, checkRole(['ADMIN', 'SUPERVISOR']), reportController.exportPDF);
router.get('/export/excel/:userId', verifyToken, checkRole(['ADMIN', 'SUPERVISOR']), reportController.exportExcel);

module.exports = router;
