const express = require('express');
const router = express.Router();
const supervisorUserController = require('../controllers/supervisor_user.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// ADMIN puede asignar y remover
router.post(
  '/',
  checkRole(['ADMIN']),
  supervisorUserController.assignSupervisorToUser,
);
router.delete(
  '/:id_supervisor/:id_user',
  checkRole(['ADMIN']),
  supervisorUserController.removeAssignment,
);

// Obtener asignaciones
router.get(
  '/supervisor/:id_supervisor/users',
  checkRole(['ADMIN', 'SUPERVISOR']),
  supervisorUserController.getUsersBySupervisor,
);
router.get(
  '/user/:id_user/supervisors',
  checkRole(['ADMIN', 'CLIENTE', 'USUARIO']),
  supervisorUserController.getSupervisorsByUser,
);

module.exports = router;
