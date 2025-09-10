// backend/src/middleware/cacheMiddleware.js
const cacheService = require('../utils/cacheService');

// 🔹 Middleware de caché para respuestas HTTP
const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    try {
      // Generar clave de caché
      let cacheKey;
      if (keyGenerator && typeof keyGenerator === 'function') {
        cacheKey = keyGenerator(req);
      } else {
        // Clave por defecto basada en la ruta y parámetros
        const baseKey = req.originalUrl || req.url;
        const userId = req.user?.id || 'anonymous';
        cacheKey = `api:${userId}:${baseKey}`;
      }
      
      // Intentar obtener del caché
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        console.log(`⚡ Cache HIT para: ${cacheKey}`);
        return res.json(cachedData);
      }
      
      // Si no está en caché, continuar con la petición
      console.log(`🔍 Cache MISS para: ${cacheKey}`);
      
      // Interceptar la respuesta para guardarla en caché
      const originalJson = res.json;
      res.json = function(data) {
        // Guardar en caché solo si la respuesta es exitosa
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, data, ttl)
            .then(() => {
              console.log(`💾 Datos guardados en caché: ${cacheKey}`);
            })
            .catch(err => {
              console.error(`❌ Error guardando en caché: ${err.message}`);
            });
        }
        
        // Llamar al método original
        return originalJson.call(this, data);
      };
      
      next();
      
    } catch (error) {
      console.error('❌ Error en middleware de caché:', error.message);
      // Continuar sin caché si hay error
      next();
    }
  };
};

// 🔹 Middleware específico para historial
const historialCacheMiddleware = (ttl = 180) => {
  return cacheMiddleware(ttl, (req) => {
    const userId = req.user?.id || 'anonymous';
    const endpoint = req.route?.path || req.path;
    const params = JSON.stringify(req.params);
    const query = JSON.stringify(req.query);
    return `historial:${userId}:${endpoint}:${params}:${query}`;
  });
};

// 🔹 Middleware específico para usuarios
const usuarioCacheMiddleware = (ttl = 600) => {
  return cacheMiddleware(ttl, (req) => {
    const userId = req.user?.id || 'anonymous';
    const endpoint = req.route?.path || req.path;
    const params = JSON.stringify(req.params);
    return `usuario:${userId}:${endpoint}:${params}`;
  });
};

// 🔹 Middleware específico para estadísticas
const statsCacheMiddleware = (ttl = 300) => {
  return cacheMiddleware(ttl, (req) => {
    const endpoint = req.route?.path || req.path;
    const query = JSON.stringify(req.query);
    return `stats:${endpoint}:${query}`;
  });
};

// 🔹 Middleware para invalidar caché
const invalidateCacheMiddleware = (patterns = []) => {
  return async (req, res, next) => {
    // Ejecutar la operación primero
    const originalJson = res.json;
    res.json = async function(data) {
      // Si la operación fue exitosa, invalidar caché
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          for (const pattern of patterns) {
            let cachePattern;
            if (typeof pattern === 'function') {
              cachePattern = pattern(req, data);
            } else {
              cachePattern = pattern;
            }
            
            if (cachePattern) {
              await cacheService.delPattern(cachePattern);
              console.log(`🗑️  Caché invalidado: ${cachePattern}`);
            }
          }
        } catch (error) {
          console.error('❌ Error invalidando caché:', error.message);
        }
      }
      
      // Llamar al método original
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// 🔹 Patrones de invalidación comunes
const invalidationPatterns = {
  // Invalidar todo el historial cuando se registra un movimiento
  historialMovimiento: (req) => 'historial:*',
  
  // Invalidar usuario específico
  usuario: (req) => `usuario:*:*${req.params.id || req.body.id}*`,
  
  // Invalidar estadísticas
  stats: () => 'stats:*'
};

module.exports = {
  cacheMiddleware,
  historialCacheMiddleware,
  usuarioCacheMiddleware,
  statsCacheMiddleware,
  invalidateCacheMiddleware,
  invalidationPatterns
};