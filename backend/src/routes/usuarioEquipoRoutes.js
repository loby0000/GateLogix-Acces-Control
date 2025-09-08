// backend/src/routes/usuarioEquipoRoutes.js
const express = require("express");
const router = express.Router();

const usuarioCtrl = require("../controllers/usuarioEquipoController");
const { verifyToken } = require("../middleware/authMiddleware");

// POST /api/usuario-equipo/registrar
router.post('/registrar', verifyToken, usuarioCtrl.registrar);

// GET /api/usuario-equipo/buscar/:serial
router.get('/buscar/:serial', verifyToken, usuarioCtrl.buscarPorSerial);

// GET /api/usuario-equipo/buscar-documento/:numeroDocumento  
router.get('/buscar-documento/:numeroDocumento', verifyToken, usuarioCtrl.buscarPorDocumento);

// GET /api/usuario-equipo/listar
router.get('/listar', verifyToken, usuarioCtrl.listarTodos);

// PUT /api/usuario-equipo/:id
router.put('/:id', verifyToken, usuarioCtrl.actualizar);


module.exports = router;
