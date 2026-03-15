const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Rutas protegidas, solo accesibles por ADMIN
router.use(verifyToken);
router.use(checkRole(['ADMIN']));

router.get('/', clientController.getAllClients);
router.get('/:id', clientController.getClientById);
router.post('/', clientController.createClient);
router.put('/:id', clientController.updateClient);
router.delete('/:id', clientController.deleteClient);

module.exports = router;
