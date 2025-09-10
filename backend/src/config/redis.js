// backend/src/config/redis.js
const redis = require('redis');

// 🔹 Configuración de Redis
const redisConfig = {
  // Configuración local (por defecto)
  local: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB || 0
  },
  
  // Configuración para Redis en la nube (Redis Cloud, AWS ElastiCache, etc.)
  cloud: {
    url: process.env.REDIS_URL || undefined
  },
  
  // Configuraciones generales
  options: {
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 5000,
    commandTimeout: 3000,
    // Limitar reintentos para evitar bucles infinitos
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 5) {
          console.log('⚠️  Redis: Máximo de reintentos alcanzado. Funcionando sin caché.');
          return false; // Detener reintentos
        }
        return Math.min(retries * 50, 3000);
      }
    }
  }
};

// 🔹 Cliente Redis
let redisClient = null;

// 🔹 Función para crear conexión Redis
const createRedisClient = async () => {
  try {
    let clientConfig;
    
    // Si hay URL de Redis (nube), usarla
    if (redisConfig.cloud.url) {
      console.log('🌐 Conectando a Redis en la nube...');
      clientConfig = {
        url: redisConfig.cloud.url,
        socket: {
          tls: true,
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
      // Usar configuración local
      console.log('🏠 Conectando a Redis local...');
      clientConfig = {
        socket: {
          host: redisConfig.local.host,
          port: redisConfig.local.port,
          connectTimeout: redisConfig.options.connectTimeout,
          commandTimeout: redisConfig.options.commandTimeout
        },
        password: redisConfig.local.password,
        database: redisConfig.local.db,
        ...redisConfig.options
      };
    }
    
    // Crear cliente
    redisClient = redis.createClient(clientConfig);
    
    // Eventos de conexión
    redisClient.on('connect', () => {
      console.log('🔗 Redis: Conectando...');
    });
    
    redisClient.on('ready', () => {
      console.log('✅ Redis: Conexión establecida y lista');
    });
    
    redisClient.on('error', (err) => {
      console.error('❌ Redis Error:', err.message);
    });
    
    redisClient.on('end', () => {
      console.log('🔌 Redis: Conexión cerrada');
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
const getRedisClient = () => {
  return redisClient;
};

// 🔹 Función para cerrar conexión
const closeRedisConnection = async () => {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('✅ Redis: Conexión cerrada correctamente');
    } catch (error) {
      console.error('❌ Error cerrando Redis:', error.message);
    }
  }
};

// 🔹 Función para verificar si Redis está disponible
const isRedisAvailable = () => {
  return redisClient && redisClient.isReady;
};

module.exports = {
  createRedisClient,
  getRedisClient,
  closeRedisConnection,
  isRedisAvailable,
  redisConfig
};