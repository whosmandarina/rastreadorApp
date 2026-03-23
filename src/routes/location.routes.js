const express = require('express');
const router = express.Router();
const locationController = require('../controllers/location.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Endpoint para que la app móvil envíe su historial guardado cuando recupera conexión (Offline Sync)
// Solo el rol USER (el rastreado) o un ADMIN (para pruebas) deberían usar esto
router.post(
  '/sync',
  verifyToken,
  checkRole(['USER', 'ADMIN']),
  locationController.syncOfflineLocations,
);

module.exports = router;
