const express = require("express");
const router = express.Router();
const historialCtrl = require("../controllers/historialController");
const { verifyToken } = require("../middleware/authMiddleware");

// Registrar entrada/salida - Ruta principal
router.post("/registrar", verifyToken, historialCtrl.registrarMovimiento);

// Rutas alternativas para compatibilidad con el frontend
// Estas rutas son necesarias porque el frontend está haciendo solicitudes a estas URLs
router.post("/entrada", verifyToken, historialCtrl.registrarMovimiento);
router.post("/salida", verifyToken, historialCtrl.registrarMovimiento);

// Listar historial
router.get("/listar", verifyToken, historialCtrl.listarHistorial);

// Obtener estado actual por serial
router.get("/estado/:serial", verifyToken, historialCtrl.obtenerEstadoPorSerial);

// Buscar historial por documento de usuario
router.get("/buscar/:documento", verifyToken, historialCtrl.buscarPorDocumento);

module.exports = router;
