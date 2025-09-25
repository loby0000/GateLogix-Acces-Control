// backend/src/middleware/memoryCache.js

/**
 * Sistema de caché en memoria optimizado para 200K usuarios mensuales
 * Reduce la carga en la base de datos para consultas frecuentes
 */

class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    };
    
    // Configuración optimizada
    this.maxSize = 10000; // Máximo 10K entradas
    this.defaultTTL = 15 * 60 * 1000; // 15 minutos por defecto
    
    // Limpiar caché expirado cada 5 minutos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
    
    console.log('🚀 MemoryCache inicializado - Máximo 10K entradas, TTL 15min');
  }

  /**
   * Generar clave única para la consulta
   */
  generateKey(prefix, params) {
    const paramStr = typeof params === 'object' 
      ? JSON.stringify(params) 
      : String(params);
    return `${prefix}:${paramStr}`;
  }

  /**
   * Obtener valor del caché
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // Verificar expiración
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      this.stats.misses++;
      this.stats.evictions++;
      return null;
    }
    
    this.stats.hits++;
    return entry.value;
  }

  /**
   * Guardar valor en caché
   */
  set(key, value, ttl = this.defaultTTL) {
    // Verificar límite de tamaño
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    const entry = {
      value,
      expires: Date.now() + ttl,
      created: Date.now()
    };
    
    this.cache.set(key, entry);
    this.stats.sets++;
  }

  /**
   * Eliminar entrada del caché
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }

  /**
   * Limpiar entradas expiradas
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key);
        cleaned++;
        this.stats.evictions++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cache cleanup: ${cleaned} entradas expiradas eliminadas`);
    }
  }

  /**
   * Eliminar la entrada más antigua
   */
  evictOldest() {
    const oldestKey = this.cache.keys().next().value;
    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Limpiar todo el caché
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️ Cache limpiado: ${size} entradas eliminadas`);
  }

  /**
   * Obtener estadísticas del caché
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(1) : '0';
    
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate}%`,
      memoryUsage: `${(this.cache.size * 0.5).toFixed(1)}KB` // Estimación
    };
  }

  /**
   * Destruir caché y limpiar intervalos
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
    console.log('💥 MemoryCache destruido');
  }
}

// Instancia global del caché
const cache = new MemoryCache();

/**
 * Middleware para caché automático de respuestas
 */
const cacheMiddleware = (prefix, ttl = 15 * 60 * 1000) => {
  return (req, res, next) => {
    // Generar clave basada en la ruta y parámetros
    const key = cache.generateKey(prefix, {
      path: req.path,
      params: req.params,
      query: req.query
    });
    
    // Intentar obtener del caché
    const cachedResponse = cache.get(key);
    if (cachedResponse) {
      console.log(`⚡ Cache HIT: ${key}`);
      return res.json(cachedResponse);
    }
    
    // Interceptar la respuesta para guardarla en caché
    const originalJson = res.json;
    res.json = function(data) {
      // Guardar en caché solo respuestas exitosas
      if (res.statusCode === 200) {
        cache.set(key, data, ttl);
        console.log(`💾 Cache SET: ${key}`);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

/**
 * Funciones específicas para diferentes tipos de consultas
 */
const cacheUsuario = {
  get: (serial) => cache.get(cache.generateKey('usuario', serial)),
  set: (serial, data) => cache.set(cache.generateKey('usuario', serial), data, 30 * 60 * 1000), // 30 min
  delete: (serial) => cache.delete(cache.generateKey('usuario', serial))
};

const cacheEstado = {
  get: (serial) => cache.get(cache.generateKey('estado', serial)),
  set: (serial, data) => cache.set(cache.generateKey('estado', serial), data, 10 * 60 * 1000), // 10 min
  delete: (serial) => cache.delete(cache.generateKey('estado', serial))
};

const cacheBusqueda = {
  get: (documento) => cache.get(cache.generateKey('busqueda', documento)),
  set: (documento, data) => cache.set(cache.generateKey('busqueda', documento), data, 20 * 60 * 1000), // 20 min
  delete: (documento) => cache.delete(cache.generateKey('busqueda', documento))
};

/**
 * Invalidar caché relacionado cuando se actualiza un usuario
 */
const invalidateUserCache = (usuario) => {
  // Invalidar caché para el equipo principal
  if (usuario.equipo?.serial) {
    cacheUsuario.delete(usuario.equipo.serial);
    cacheEstado.delete(usuario.equipo.serial);
  }
  
  // Invalidar caché para todos los equipos en el array
  if (usuario.equipos && Array.isArray(usuario.equipos)) {
    usuario.equipos.forEach(equipo => {
      if (equipo.serial) {
        cacheUsuario.delete(equipo.serial);
        cacheEstado.delete(equipo.serial);
      }
    });
  }
  
  if (usuario.numeroDocumento) {
    cacheBusqueda.delete(usuario.numeroDocumento);
  }
  console.log(`🗑️ Cache invalidado para usuario: ${usuario.nombre}`);
};

/**
 * Middleware para invalidar caché en operaciones de escritura
 */
const cacheInvalidationMiddleware = (req, res, next) => {
  const originalJson = res.json;
  
  res.json = function(data) {
    // Invalidar caché en operaciones exitosas de escritura
    if (res.statusCode === 200 || res.statusCode === 201) {
      const method = req.method.toUpperCase();
      
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        // Invalidar caché relacionado basado en la ruta
        if (req.path.includes('usuario-equipo')) {
          const serial = req.body?.equipo?.serial || req.body?.serialEquipo || req.params?.serial;
          const documento = req.body?.numeroDocumento || req.params?.numeroDocumento;
          
          // También invalidar para equipos en el array
          if (req.body?.equipos && Array.isArray(req.body.equipos)) {
            req.body.equipos.forEach(equipo => {
              if (equipo.serial) {
                cacheUsuario.delete(equipo.serial);
                cacheEstado.delete(equipo.serial);
              }
            });
          }
          
          if (serial) {
            cacheUsuario.delete(serial);
            cacheEstado.delete(serial);
          }
          if (documento) {
            cacheBusqueda.delete(documento);
          }
        }
        
        if (req.path.includes('historial')) {
          const serial = req.body?.serial;
          if (serial) {
            cacheEstado.delete(serial);
          }
        }
      }
    }
    
    return originalJson.call(this, data);
  };
  
  next();
};

/**
 * Endpoint para estadísticas del caché
 */
const getCacheStats = (req, res) => {
  const stats = cache.getStats();
  res.json({
    cache: stats,
    recommendations: {
      hitRate: parseFloat(stats.hitRate) > 70 ? 'Excelente' : 'Necesita optimización',
      size: stats.size > stats.maxSize * 0.8 ? 'Considerar aumentar maxSize' : 'OK',
      evictions: stats.evictions > 100 ? 'Muchas evictions, considerar aumentar TTL' : 'OK'
    }
  });
};

module.exports = {
  cache,
  cacheMiddleware,
  cacheUsuario,
  cacheEstado,
  cacheBusqueda,
  invalidateUserCache,
  cacheInvalidationMiddleware,
  getCacheStats
};