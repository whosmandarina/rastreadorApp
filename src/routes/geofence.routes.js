const express = require('express');
const router = express.Router();
const geofenceController = require('../controllers/geofence.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// --- Rutas protegidas para Administradores ---
const adminOnly = [verifyToken, checkRole(['ADMIN'])];

// Creación, actualización y eliminación reservada a Administradores
router.post('/', adminOnly, geofenceController.createGeofence);
router.put('/:id', adminOnly, geofenceController.updateGeofence);
router.delete('/:id', adminOnly, geofenceController.deleteGeofence);

// --- Rutas para Supervisores y Administradores ---

// Visualización para Administradores y Supervisores (para el Dashboard)
router.get(
  '/',
  verifyToken,
  checkRole(['ADMIN', 'SUPERVISOR']),
  geofenceController.getGeofences,
);

module.exports = router;
