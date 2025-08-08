const express = require('express');
const router = express.Router();
const usuarioCtrl = require('../controllers/usuarioEquipoController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/usuario-equipo/registrar
router.post('/registrar', verifyToken, usuarioCtrl.registrar);

module.exports = router;
