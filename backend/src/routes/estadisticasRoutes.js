const express = require('express');
const router = express.Router();
const estadisticasCtrl = require('../controllers/estadisticasController');
const { verifyToken } = require('../middleware/authMiddleware');
const { statsCacheMiddleware } = require('../middleware/cacheMiddleware');

// GET /api/estadisticas/dashboard - Estadísticas principales del dashboard (caché 3 min)
router.get('/dashboard', verifyToken, statsCacheMiddleware(180), estadisticasCtrl.obtenerEstadisticasDashboard);

// GET /api/estadisticas/mensuales - Estadísticas mensuales por año (caché 10 min)
router.get('/mensuales', verifyToken, statsCacheMiddleware(600), estadisticasCtrl.obtenerEstadisticasMensuales);

// GET /api/estadisticas/guardias - Estadísticas de guardias (caché 5 min)
router.get('/guardias', verifyToken, statsCacheMiddleware(300), estadisticasCtrl.obtenerEstadisticasGuardias);

// GET /api/estadisticas/actividad-reciente - Actividad reciente del sistema (caché 2 min)
router.get('/actividad-reciente', verifyToken, statsCacheMiddleware(120), estadisticasCtrl.obtenerActividadReciente);

module.exports = router;