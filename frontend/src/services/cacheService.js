// frontend/src/services/cacheService.js

/**
 * Servicio de caché para el frontend usando localStorage y sessionStorage
 * Proporciona funcionalidades de caché con TTL y gestión automática
 */
class FrontendCacheService {
  constructor() {
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos en milisegundos
    this.prefix = 'gatelogix_';
    this.cleanupInterval = 60 * 1000; // Limpiar cada minuto
    
    // Iniciar limpieza automática
    this.startCleanupTimer();
  }

  /**
   * Generar clave con prefijo
   * @param {string} key - Clave original
   * @returns {string} Clave con prefijo
   */
  _getKey(key) {
    return `${this.prefix}${key}`;
  }

  /**
   * Obtener timestamp actual
   * @returns {number} Timestamp en milisegundos
   */
  _now() {
    return Date.now();
  }

  /**
   * Guardar datos en caché
   * @param {string} key - Clave del caché
   * @param {any} data - Datos a guardar
   * @param {number} ttl - Tiempo de vida en milisegundos (opcional)
   * @param {boolean} useSession - Usar sessionStorage en lugar de localStorage
   * @returns {boolean} True si se guardó correctamente
   */
  set(key, data, ttl = this.defaultTTL, useSession = false) {
    try {
      const cacheKey = this._getKey(key);
      const expiresAt = this._now() + ttl;
      
      const cacheData = {
        data,
        expiresAt,
        createdAt: this._now()
      };
      
      const storage = useSession ? sessionStorage : localStorage;
      storage.setItem(cacheKey, JSON.stringify(cacheData));
      
      console.log(`💾 [FRONTEND CACHE] Guardado: ${key} (TTL: ${ttl}ms)`);
      return true;
      
    } catch (error) {
      console.error(`❌ [FRONTEND CACHE] Error guardando ${key}:`, error);
      return false;
    }
  }

  /**
   * Obtener datos del caché
   * @param {string} key - Clave del caché
   * @param {boolean} useSession - Buscar en sessionStorage
   * @returns {any|null} Datos del caché o null si no existe/expiró
   */
  get(key, useSession = false) {
    try {
      const cacheKey = this._getKey(key);
      const storage = useSession ? sessionStorage : localStorage;
      const cached = storage.getItem(cacheKey);
      
      if (!cached) {
        console.log(`📭 [FRONTEND CACHE] MISS: ${key}`);
        return null;
      }
      
      const cacheData = JSON.parse(cached);
      
      // Verificar si expiró
      if (this._now() > cacheData.expiresAt) {
        console.log(`⏰ [FRONTEND CACHE] EXPIRED: ${key}`);
        this.delete(key, useSession);
        return null;
      }
      
      console.log(`📦 [FRONTEND CACHE] HIT: ${key}`);
      return cacheData.data;
      
    } catch (error) {
      console.error(`❌ [FRONTEND CACHE] Error obteniendo ${key}:`, error);
      return null;
    }
  }

  /**
   * Eliminar entrada del caché
   * @param {string} key - Clave a eliminar
   * @param {boolean} useSession - Eliminar de sessionStorage
   * @returns {boolean} True si se eliminó
   */
  delete(key, useSession = false) {
    try {
      const cacheKey = this._getKey(key);
      const storage = useSession ? sessionStorage : localStorage;
      storage.removeItem(cacheKey);
      
      console.log(`🗑️ [FRONTEND CACHE] Eliminado: ${key}`);
      return true;
      
    } catch (error) {
      console.error(`❌ [FRONTEND CACHE] Error eliminando ${key}:`, error);
      return false;
    }
  }

  /**
   * Eliminar entradas por patrón
   * @param {string} pattern - Patrón a buscar
   * @param {boolean} useSession - Buscar en sessionStorage
   * @returns {number} Número de entradas eliminadas
   */
  deletePattern(pattern, useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage;
      const keys = Object.keys(storage);
      let deleted = 0;
      
      keys.forEach(key => {
        if (key.startsWith(this.prefix) && key.includes(pattern)) {
          storage.removeItem(key);
          deleted++;
        }
      });
      
      console.log(`🗑️ [FRONTEND CACHE] Eliminadas ${deleted} entradas con patrón: ${pattern}`);
      return deleted;
      
    } catch (error) {
      console.error(`❌ [FRONTEND CACHE] Error eliminando patrón ${pattern}:`, error);
      return 0;
    }
  }

  /**
   * Limpiar caché expirado
   * @param {boolean} useSession - Limpiar sessionStorage
   * @returns {number} Número de entradas eliminadas
   */
  cleanup(useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage;
      const keys = Object.keys(storage);
      let cleaned = 0;
      const now = this._now();
      
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          try {
            const cached = JSON.parse(storage.getItem(key));
            if (now > cached.expiresAt) {
              storage.removeItem(key);
              cleaned++;
            }
          } catch (e) {
            // Entrada corrupta, eliminar
            storage.removeItem(key);
            cleaned++;
          }
        }
      });
      
      if (cleaned > 0) {
        console.log(`🧹 [FRONTEND CACHE] Limpiadas ${cleaned} entradas expiradas`);
      }
      
      return cleaned;
      
    } catch (error) {
      console.error('❌ [FRONTEND CACHE] Error en limpieza:', error);
      return 0;
    }
  }

  /**
   * Limpiar todo el caché
   * @param {boolean} useSession - Limpiar sessionStorage
   * @returns {number} Número de entradas eliminadas
   */
  clear(useSession = false) {
    try {
      const storage = useSession ? sessionStorage : localStorage;
      const keys = Object.keys(storage);
      let cleared = 0;
      
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          storage.removeItem(key);
          cleared++;
        }
      });
      
      console.log(`🧹 [FRONTEND CACHE] Limpiado todo el caché: ${cleared} entradas`);
      return cleared;
      
    } catch (error) {
      console.error('❌ [FRONTEND CACHE] Error limpiando caché:', error);
      return 0;
    }
  }

  /**
   * Obtener información del caché
   * @returns {object} Estadísticas del caché
   */
  getStats() {
    try {
      const localKeys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
      const sessionKeys = Object.keys(sessionStorage).filter(key => key.startsWith(this.prefix));
      
      let localSize = 0;
      let sessionSize = 0;
      let expired = 0;
      const now = this._now();
      
      // Calcular tamaño y entradas expiradas
      localKeys.forEach(key => {
        const value = localStorage.getItem(key);
        localSize += value.length;
        
        try {
          const cached = JSON.parse(value);
          if (now > cached.expiresAt) expired++;
        } catch (e) {
          expired++;
        }
      });
      
      sessionKeys.forEach(key => {
        const value = sessionStorage.getItem(key);
        sessionSize += value.length;
      });
      
      return {
        localStorage: {
          entries: localKeys.length,
          sizeBytes: localSize,
          expired
        },
        sessionStorage: {
          entries: sessionKeys.length,
          sizeBytes: sessionSize
        },
        total: {
          entries: localKeys.length + sessionKeys.length,
          sizeBytes: localSize + sessionSize
        }
      };
      
    } catch (error) {
      console.error('❌ [FRONTEND CACHE] Error obteniendo estadísticas:', error);
      return null;
    }
  }

  /**
   * Iniciar timer de limpieza automática
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanup(); // localStorage
      this.cleanup(true); // sessionStorage
    }, this.cleanupInterval);
    
    console.log('🔄 [FRONTEND CACHE] Timer de limpieza iniciado');
  }

  /**
   * Métodos de conveniencia para diferentes tipos de datos
   */
  
  // Caché para usuarios
  setUser(userId, userData, ttl = 10 * 60 * 1000) {
    return this.set(`user:${userId}`, userData, ttl);
  }
  
  getUser(userId) {
    return this.get(`user:${userId}`);
  }
  
  deleteUser(userId) {
    return this.delete(`user:${userId}`);
  }
  
  // Caché para guardias
  setGuard(guardId, guardData, ttl = 15 * 60 * 1000) {
    return this.set(`guard:${guardId}`, guardData, ttl);
  }
  
  getGuard(guardId) {
    return this.get(`guard:${guardId}`);
  }
  
  deleteGuard(guardId) {
    return this.delete(`guard:${guardId}`);
  }
  
  // Caché para estadísticas
  setStats(statsKey, statsData, ttl = 3 * 60 * 1000) {
    return this.set(`stats:${statsKey}`, statsData, ttl);
  }
  
  getStats(statsKey) {
    return this.get(`stats:${statsKey}`);
  }
  
  deleteStats(statsKey) {
    return this.delete(`stats:${statsKey}`);
  }
  
  // Invalidar caché relacionado
  invalidateUserCache() {
    return this.deletePattern('user:');
  }
  
  invalidateGuardCache() {
    return this.deletePattern('guard:');
  }
  
  invalidateStatsCache() {
    return this.deletePattern('stats:');
  }
}

// Crear instancia singleton
const frontendCacheService = new FrontendCacheService();

export default frontendCacheService;