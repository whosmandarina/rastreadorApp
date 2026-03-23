const express = require('express');
const router = express.Router();
const userClientController = require('../controllers/user_client.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// ADMIN puede asignar y remover
router.post('/', checkRole(['ADMIN']), userClientController.assignUserToClient);
router.delete(
  '/:id_user/:id_client',
  checkRole(['ADMIN']),
  userClientController.removeAssignment,
);

// Obtener asignaciones (ADMIN y también un usuario puede ver a qué cliente pertenece)
router.get('/user/:id_user/clients', userClientController.getClientsByUser);
router.get(
  '/client/:id_client/users',
  checkRole(['ADMIN', 'SUPERVISOR']),
  userClientController.getUsersByClient,
);

module.exports = router;
