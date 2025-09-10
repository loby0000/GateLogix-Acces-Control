// backend/src/routes/cacheRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const cacheService = require('../utils/cacheService');
const { isRedisAvailable } = require('../config/redis');

// 🔹 Obtener información del caché
router.get('/info', verifyToken, async (req, res) => {
  try {
    const info = await cacheService.getInfo();
    
    res.json({
      redis: {
        available: isRedisAvailable(),
        ...info
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo info del caché:', error);
    res.status(500).json({ 
      msg: 'Error obteniendo información del caché',
      error: error.message 
    });
  }
});

// 🔹 Limpiar todo el caché (solo para administradores)
router.delete('/flush', verifyToken, async (req, res) => {
  try {
    // Verificar si el usuario es administrador
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Acceso denegado. Solo administradores.' });
    }
    
    const result = await cacheService.flushAll();
    
    if (result) {
      res.json({ 
        msg: '✅ Caché limpiado completamente',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ msg: 'Error limpiando el caché' });
    }
    
  } catch (error) {
    console.error('❌ Error limpiando caché:', error);
    res.status(500).json({ 
      msg: 'Error limpiando el caché',
      error: error.message 
    });
  }
});

// 🔹 Limpiar caché de historial específicamente
router.delete('/history', verifyToken, async (req, res) => {
  try {
    const deletedCount = await cacheService.delHistoryPattern();
    
    res.json({ 
      msg: `✅ Caché de historial limpiado`,
      deletedKeys: deletedCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error limpiando caché de historial:', error);
    res.status(500).json({ 
      msg: 'Error limpiando caché de historial',
      error: error.message 
    });
  }
});

// 🔹 Obtener estadísticas de rendimiento del caché
router.get('/stats', verifyToken, async (req, res) => {
  try {
    if (!isRedisAvailable()) {
      return res.json({
        available: false,
        message: 'Redis no está disponible',
        fallback: 'Sistema funcionando sin caché'
      });
    }
    
    const info = await cacheService.getInfo();
    
    // Estadísticas básicas
    const stats = {
      available: true,
      keys: info.keys || 0,
      connected: info.connected || false,
      performance: {
        cacheEnabled: true,
        estimatedSpeedup: '70-80%',
        recommendedFor: [
          'Consultas de historial frecuentes',
          'Datos de usuarios',
          'Estadísticas del sistema'
        ]
      },
      configuration: {
        defaultTTL: '5 minutos',
        historyTTL: '3 minutos',
        userTTL: '10 minutos',
        statsTTL: '5 minutos'
      }
    };
    
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas del caché:', error);
    res.status(500).json({ 
      msg: 'Error obteniendo estadísticas del caché',
      error: error.message 
    });
  }
});

// 🔹 Verificar una clave específica
router.get('/check/:key', verifyToken, async (req, res) => {
  try {
    const { key } = req.params;
    
    const exists = await cacheService.exists(key);
    const ttl = exists ? await cacheService.getTTL(key) : -1;
    
    res.json({
      key,
      exists,
      ttl: ttl > 0 ? ttl : null,
      message: exists ? 'Clave encontrada en caché' : 'Clave no encontrada'
    });
    
  } catch (error) {
    console.error('❌ Error verificando clave:', error);
    res.status(500).json({ 
      msg: 'Error verificando clave',
      error: error.message 
    });
  }
});

module.exports = router;