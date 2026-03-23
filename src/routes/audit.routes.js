const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

router.use(verifyToken);

// GET /api/audit -> Solo ADMIN puede ver los logs
router.get('/', checkRole(['ADMIN']), auditController.getAuditLogs);

module.exports = router;
