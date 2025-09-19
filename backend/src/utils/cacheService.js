// backend/src/utils/cacheService.js
const { getRedisClient, isRedisAvailable } = require('../config/redis');

// 🔹 Servicio de Caché con Redis
class CacheService {
  constructor() {
    this.defaultTTL = 300; // 5 minutos por defecto
    this.prefixes = {
      user: 'user:',
      history: 'history:',
      guard: 'guard:',
      stats: 'stats:',
      session: 'session:'
    };
  }

  // 🔹 Obtener datos del caché
  async get(key) {
    try {
      if (!isRedisAvailable()) {
        return null;
      }

      const client = await getRedisClient();
      if (!client) {
        console.log(`❌ Error obteniendo del caché [${key}]: cliente Redis no disponible`);
        return null;
      }

      const data = await client.get(key);
      
      if (data) {
        console.log(`📦 Cache HIT: ${key}`);
        return JSON.parse(data);
      }
      
      console.log(`📭 Cache MISS: ${key}`);
      return null;
      
    } catch (error) {
      console.error(`❌ Error obteniendo del caché [${key}]:`, error.message);
      return null;
    }
  }

  // 🔹 Guardar datos en el caché
  async set(key, data, ttl = this.defaultTTL) {
    try {
      if (!isRedisAvailable()) {
        console.log(`📭 Cache deshabilitado: no se pudo guardar ${key}`);
        return false;
      }

      const client = await getRedisClient();
      if (!client) {
        console.log(`❌ Cliente Redis no válido o no disponible`);
        return false;
      }

      const serializedData = JSON.stringify(data);
      
      await client.setEx(key, ttl, serializedData);
      console.log(`💾 Cache SET: ${key} (TTL: ${ttl}s)`);
      return true;
      
    } catch (error) {
      console.error(`❌ Error guardando en caché [${key}]:`, error.message);
      return false;
    }
  }

  // 🔹 Eliminar del caché
  async del(key) {
    try {
      if (!isRedisAvailable()) {
        return false;
      }

      const client = await getRedisClient();
      if (!client) {
        console.log(`❌ Error eliminando del caché [${key}]: cliente Redis no disponible`);
        return false;
      }
      
      const result = await client.del(key);
      
      if (result > 0) {
        console.log(`🗑️  Cache DEL: ${key}`);
      }
      
      return result > 0;
      
    } catch (error) {
      console.error(`❌ Error eliminando del caché [${key}]:`, error.message);
      return false;
    }
  }

  // 🔹 Eliminar múltiples claves por patrón
  async delPattern(pattern) {
    try {
      if (!isRedisAvailable()) {
        console.log(`📭 Cache deshabilitado: no se pudo eliminar patrón ${pattern}`);
        return 0;
      }

      const client = await getRedisClient();
      if (!client) {
        console.log(`❌ Error eliminando patrón del caché [${pattern}]: cliente Redis no disponible`);
        return 0;
      }
      
      const keys = await client.keys(pattern);
      
      if (keys && keys.length > 0) {
        if (typeof client.del !== 'function') {
          console.log(`❌ Error eliminando patrón del caché [${pattern}]: client.del is not a function`);
          return 0;
        }
        const result = await client.del(keys);
        console.log(`🗑️  Cache DEL Pattern: ${pattern} (${result} claves eliminadas)`);
        return result;
      }
      
      return 0;
      
    } catch (error) {
      console.error(`❌ Error eliminando patrón del caché [${pattern}]:`, error.message);
      return 0;
    }
  }

  // 🔹 Verificar si existe una clave
  async exists(key) {
    try {
      if (!isRedisAvailable()) {
        return false;
      }

      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
      
    } catch (error) {
      console.error(`❌ Error verificando existencia en caché [${key}]:`, error.message);
      return false;
    }
  }

  // 🔹 Obtener TTL de una clave
  async getTTL(key) {
    try {
      if (!isRedisAvailable()) {
        return -1;
      }

      const client = getRedisClient();
      return await client.ttl(key);
      
    } catch (error) {
      console.error(`❌ Error obteniendo TTL del caché [${key}]:`, error.message);
      return -1;
    }
  }

  // 🔹 Métodos específicos para diferentes tipos de datos

  // Caché de usuarios
  async getUser(userId) {
    return await this.get(`${this.prefixes.user}${userId}`);
  }

  async setUser(userId, userData, ttl = 600) { // 10 minutos
    return await this.set(`${this.prefixes.user}${userId}`, userData, ttl);
  }

  async delUser(userId) {
    return await this.del(`${this.prefixes.user}${userId}`);
  }

  async delUserPattern() {
    return await this.delPattern(`${this.prefixes.user}*`);
  }

  // Caché de historial
  async getHistory(key) {
    return await this.get(`${this.prefixes.history}${key}`);
  }

  async setHistory(key, historyData, ttl = 180) { // 3 minutos
    return await this.set(`${this.prefixes.history}${key}`, historyData, ttl);
  }

  async delHistoryPattern() {
    return await this.delPattern(`${this.prefixes.history}*`);
  }

  // Caché de estadísticas
  async getStats(key) {
    return await this.get(`${this.prefixes.stats}${key}`);
  }

  async setStats(key, statsData, ttl = 300) { // 5 minutos
    return await this.set(`${this.prefixes.stats}${key}`, statsData, ttl);
  }

  // Caché de guardias
  async getGuard(guardId) {
    return await this.get(`${this.prefixes.guard}${guardId}`);
  }

  async setGuard(guardId, guardData, ttl = 900) { // 15 minutos
    return await this.set(`${this.prefixes.guard}${guardId}`, guardData, ttl);
  }

  async delGuard(guardId) {
    return await this.del(`${this.prefixes.guard}${guardId}`);
  }

  async delGuardPattern() {
    return await this.delPattern(`${this.prefixes.guard}*`);
  }

  // 🔹 Limpiar todo el caché
  async flushAll() {
    try {
      if (!isRedisAvailable()) {
        return false;
      }

      const client = getRedisClient();
      await client.flushAll();
      console.log('🧹 Cache: Todos los datos eliminados');
      return true;
      
    } catch (error) {
      console.error('❌ Error limpiando todo el caché:', error.message);
      return false;
    }
  }

  // 🔹 Obtener información del caché
  async getInfo() {
    try {
      if (!isRedisAvailable()) {
        return { available: false, message: 'Redis no disponible' };
      }

      const client = getRedisClient();
      const info = await client.info('memory');
      const dbSize = await client.dbSize();
      
      return {
        available: true,
        keys: dbSize,
        memory: info,
        connected: client.isReady
      };
      
    } catch (error) {
      console.error('❌ Error obteniendo info del caché:', error.message);
      return { available: false, error: error.message };
    }
  }
}

// 🔹 Instancia singleton
const cacheService = new CacheService();

module.exports = cacheService;