// backend/src/config/redis.js
const { createClient } = require('redis');
require('dotenv').config();

// 🔹 Configuración de Redis
const redisConfig = {
  // Configuración local (por defecto)
  local: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
  },
  
  // Configuración para Redis en la nube (Redis Cloud, AWS ElastiCache, etc.)
  cloud: {
    url: process.env.REDIS_URL || '',
    username: 'default',
    password: process.env.REDIS_PASSWORD || 'Ic5G2TX9afohQ14VNkYALBjlXgrty0CE',
    host: 'redis-18535.c124.us-central1-1.gce.redns.redis-cloud.com',
    port: 18535
  },
  
  // Configuraciones generales
  options: {
    retryDelayOnFailover: 100,
    connectTimeout: 10000,
    commandTimeout: 5000,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  },
};

// 🔹 Cliente Redis
let redisClient = null;

/**
 * Crea y devuelve un cliente Redis
 * @returns {Promise<Object>} Cliente Redis
 */
async function createRedisClient() {
  try {
    // Si ya existe un cliente y está conectado, devolverlo
    if (redisClient && redisClient.isOpen) {
      return redisClient;
    }

    // Configuración del cliente
    let clientConfig = {};

    // Priorizar conexión a Redis en la nube si está configurada
    if (redisConfig.cloud.url) {
      console.log('🌐 Conectando a Redis en la nube...');
      clientConfig = {
        url: redisConfig.cloud.url,
        socket: {
          // Si la URL comienza con rediss://, habilitar TLS
          tls: redisConfig.cloud.url.startsWith('rediss://'),
          rejectUnauthorized: false,
          keepAlive: true,
          connectTimeout: 10000,
          commandTimeout: 5000,
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              console.log('⚠️  Redis: Máximo de reintentos alcanzado. Funcionando sin caché.');
              return false;
            }
            return Math.min(retries * 1000, 5000);
          }
        },
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: false
      };
    } else {
      console.log('🏠 Conectando a Redis local...');
      // Usar la configuración directa proporcionada
      clientConfig = { 
        username: redisConfig.cloud.username, 
        password: redisConfig.cloud.password, 
        socket: { 
          host: redisConfig.cloud.host, 
          port: redisConfig.cloud.port,
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              console.log('⚠️  Redis: Máximo de reintentos alcanzado. Funcionando sin caché.');
              return false;
            }
            return Math.min(retries * 1000, 5000);
          }
        },
        ...redisConfig.options
      };
    }

    // Crear cliente
    redisClient = createClient(clientConfig);

    // Eventos
    redisClient.on('error', (err) => {
      console.log(`❌ Redis Error: ${err}`);
    });

    redisClient.on('connect', () => {
      console.log('🔗 Redis: Conectando...');
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis: Conexión establecida y lista');
    });

    redisClient.on('reconnecting', () => {
      console.log('🔄 Redis: Reconectando...');
    });

    // Conectar
    await redisClient.connect();
    return redisClient;
    
  } catch (error) {
    console.error('❌ Error conectando a Redis:', error.message);
    console.log('⚠️  Redis no disponible - funcionando sin caché');
    return null;
  }
};

// 🔹 Función para obtener cliente Redis
async function getRedisClient() {
  try {
    if (!redisClient || !redisClient.isOpen) {
      redisClient = await createRedisClient();
    }
    return redisClient;
  } catch (error) {
    console.error('❌ Error al obtener cliente Redis:', error.message);
    return null;
  }
}

/**
 * Cierra la conexión con Redis
 */
async function closeRedisConnection() {
  try {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
      console.log('👋 Conexión a Redis cerrada');
    }
  } catch (error) {
    console.error('❌ Error al cerrar conexión Redis:', error.message);
  }
}

/**
 * Verifica si Redis está disponible
 * @returns {boolean} true si Redis está disponible, false en caso contrario
 */
function isRedisAvailable() {
  return redisClient !== null && redisClient.isOpen === true;
}

module.exports = {
  createClient: getRedisClient,
  getRedisClient,
  closeRedisConnection,
  isRedisAvailable,
  redisConfig
};