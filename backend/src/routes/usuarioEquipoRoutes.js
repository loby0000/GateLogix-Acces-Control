// backend/src/routes/usuarioEquipoRoutes.js
const express = require("express");
const router = express.Router();

const usuarioCtrl = require("../controllers/usuarioEquipoController");
const { verifyToken } = require("../middleware/authMiddleware");
const { usuarioCacheMiddleware } = require("../middleware/cacheMiddleware");

// POST /api/usuario-equipo/registrar
router.post('/registrar', verifyToken, usuarioCtrl.registrar);

// GET /api/usuario-equipo/buscar/:serial - Con caché de 10 minutos
router.get('/buscar/:serial', verifyToken, usuarioCacheMiddleware(600), usuarioCtrl.buscarPorSerial);

// GET /api/usuario-equipo/buscar-documento/:numeroDocumento - Con caché de 10 minutos
router.get('/buscar-documento/:numeroDocumento', verifyToken, usuarioCacheMiddleware(600), usuarioCtrl.buscarPorDocumento);

// GET /api/usuario-equipo/listar - Con caché de 5 minutos
router.get('/listar', verifyToken, usuarioCacheMiddleware(300), usuarioCtrl.listarTodos);

// PUT /api/usuario-equipo/:id
router.put('/:id', verifyToken, usuarioCtrl.actualizar);


module.exports = router;
