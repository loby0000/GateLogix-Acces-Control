// backend/src/routes/equiposRoutes.js
const express = require("express");
const router = express.Router();
const equiposCtrl = require("../controllers/equiposController");
const { verifyToken } = require("../middleware/authMiddleware");
const { cacheMiddleware } = require("../middleware/cacheMiddleware");

// POST /api/equipos/registrar - Registrar un nuevo equipo para un usuario existente
router.post('/registrar', verifyToken, equiposCtrl.registrarEquipo);

// GET /api/equipos/listar - Listar todos los equipos
router.get('/listar', verifyToken, cacheMiddleware(300), equiposCtrl.listarEquipos);

// GET /api/equipos/usuario/:documento - Obtener equipos por documento de usuario
router.get('/usuario/:documento', verifyToken, cacheMiddleware(600), equiposCtrl.equiposPorUsuario);

// PUT /api/equipos/:id - Actualizar un equipo
router.put('/:id', verifyToken, equiposCtrl.actualizarEquipo);

// DELETE /api/equipos/:id - Eliminar un equipo
router.delete('/:id', verifyToken, equiposCtrl.eliminarEquipo);

module.exports = router;