const express = require('express');
const router = express.Router();
const consentController = require('../controllers/consent.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// Registrar consentimiento (Cualquier usuario autenticado o ADMIN asignando)
router.post('/', consentController.recordConsent);

// Obtener consentimiento de un usuario (Admin, Supervisor o el propio usuario)
router.get(
  '/user/:id_user',
  checkRole(['ADMIN', 'SUPERVISOR', 'USER']),
  consentController.getConsentByUser,
);

// Revocar consentimiento (El propio usuario lo revoca)
router.post('/revoke', checkRole(['USER']), consentController.revokeConsent);

module.exports = router;
