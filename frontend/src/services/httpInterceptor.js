// frontend/src/services/httpInterceptor.js
import axios from 'axios';
import frontendCacheService from './cacheService.js';

/**
 * Configuración de interceptores HTTP con caché para optimizar peticiones
 */
class HttpCacheInterceptor {
  constructor() {
    this.cacheableRoutes = {
      // Rutas que se pueden cachear con sus TTL específicos
      '/api/usuario-equipo/listar': 5 * 60 * 1000, // 5 minutos
      '/api/usuario-equipo/buscar/': 10 * 60 * 1000, // 10 minutos
      '/api/usuario-equipo/buscar-documento/': 10 * 60 * 1000, // 10 minutos
      '/api/guardia/listar': 5 * 60 * 1000, // 5 minutos
      '/api/guardia/buscar/': 10 * 60 * 1000, // 10 minutos
      '/api/estadisticas/dashboard': 3 * 60 * 1000, // 3 minutos
      '/api/estadisticas/mensuales': 10 * 60 * 1000, // 10 minutos
      '/api/estadisticas/guardias': 5 * 60 * 1000, // 5 minutos
      '/api/estadisticas/actividad-reciente': 2 * 60 * 1000, // 2 minutos
      '/api/historial/listar': 3 * 60 * 1000, // 3 minutos
    };
    
    this.invalidationRoutes = {
      // Rutas que invalidan caché cuando se ejecutan
      'POST': {
        '/api/usuario-equipo/registrar': ['user:', 'stats:'],
        '/api/guardia/registrar': ['guard:', 'stats:'],
        '/api/historial/entrada': ['stats:', 'history:'],
        '/api/historial/salida': ['stats:', 'history:']
      },
      'PUT': {
        '/api/usuario-equipo/': ['user:', 'stats:'],
        '/api/guardia/estado/': ['guard:', 'stats:']
      },
      'DELETE': {
        '/api/usuario-equipo/': ['user:', 'stats:'],
        '/api/guardia/': ['guard:', 'stats:']
      }
    };
  }

  /**
   * Generar clave de caché para una petición
   * @param {object} config - Configuración de Axios
   * @returns {string} Clave de caché
   */
  generateCacheKey(config) {
    const { method, url, params, data } = config;
    
    // Incluir parámetros de query en la clave
    const queryString = params ? JSON.stringify(params) : '';
    
    // Para POST/PUT, incluir algunos datos relevantes (sin datos sensibles)
    let dataKey = '';
    if (data && (method === 'POST' || method === 'PUT')) {
      // Solo incluir campos no sensibles para la clave
      const safeData = {};
      if (data.page) safeData.page = data.page;
      if (data.limit) safeData.limit = data.limit;
      if (data.search) safeData.search = data.search;
      dataKey = Object.keys(safeData).length > 0 ? JSON.stringify(safeData) : '';
    }
    
    return `http:${method}:${url}:${queryString}:${dataKey}`;
  }

  /**
   * Verificar si una ruta es cacheable
   * @param {string} url - URL de la petición
   * @param {string} method - Método HTTP
   * @returns {number|false} TTL en milisegundos o false si no es cacheable
   */
  isCacheable(url, method) {
    if (method !== 'GET') return false;
    
    // Buscar coincidencia exacta o por prefijo
    for (const [route, ttl] of Object.entries(this.cacheableRoutes)) {
      if (url === route || (route.endsWith('/') && url.startsWith(route))) {
        return ttl;
      }
    }
    
    return false;
  }

  /**
   * Obtener patrones de invalidación para una ruta
   * @param {string} url - URL de la petición
   * @param {string} method - Método HTTP
   * @returns {string[]} Patrones a invalidar
   */
  getInvalidationPatterns(url, method) {
    const methodRoutes = this.invalidationRoutes[method];
    if (!methodRoutes) return [];
    
    for (const [route, patterns] of Object.entries(methodRoutes)) {
      if (url === route || (route.endsWith('/') && url.startsWith(route))) {
        return patterns;
      }
    }
    
    return [];
  }

  /**
   * Configurar interceptores de petición
   * @param {object} axiosInstance - Instancia de Axios
   */
  setupRequestInterceptor(axiosInstance) {
    axiosInstance.interceptors.request.use(
      async (config) => {
        const { method, url } = config;
        const cacheKey = this.generateCacheKey(config);
        
        // Solo intentar caché para peticiones GET
        if (method === 'get') {
          const ttl = this.isCacheable(url, method.toUpperCase());
          
          if (ttl) {
            const cachedData = frontendCacheService.get(cacheKey);
            
            if (cachedData) {
              console.log(`⚡ [HTTP CACHE] Usando caché para: ${url}`);
              
              // Crear respuesta simulada desde caché
              const cachedResponse = {
                data: cachedData,
                status: 200,
                statusText: 'OK (from cache)',
                headers: {},
                config,
                fromCache: true
              };
              
              // Cancelar la petición HTTP real
              config.cancelToken = new axios.CancelToken((cancel) => {
                cancel(cachedResponse);
              });
            }
          }
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Configurar interceptores de respuesta
   * @param {object} axiosInstance - Instancia de Axios
   */
  setupResponseInterceptor(axiosInstance) {
    axiosInstance.interceptors.response.use(
      (response) => {
        const { config, data } = response;
        const { method, url } = config;
        
        // Guardar en caché respuestas GET exitosas
        if (method === 'get' && response.status === 200) {
          const ttl = this.isCacheable(url, method.toUpperCase());
          
          if (ttl && data) {
            const cacheKey = this.generateCacheKey(config);
            frontendCacheService.set(cacheKey, data, ttl);
            console.log(`💾 [HTTP CACHE] Guardado en caché: ${url}`);
          }
        }
        
        // Invalidar caché para operaciones de escritura
        if (['post', 'put', 'delete'].includes(method)) {
          const patterns = this.getInvalidationPatterns(url, method.toUpperCase());
          
          if (patterns.length > 0) {
            patterns.forEach(pattern => {
              const deleted = frontendCacheService.deletePattern(pattern);
              if (deleted > 0) {
                console.log(`🗑️ [HTTP CACHE] Invalidado caché: ${pattern} (${deleted} entradas)`);
              }
            });
          }
        }
        
        return response;
      },
      (error) => {
        // Manejar respuestas desde caché
        if (axios.isCancel(error) && error.message && typeof error.message === 'object') {
          return Promise.resolve(error.message);
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Configurar todos los interceptores
   * @param {object} axiosInstance - Instancia de Axios (opcional)
   * @returns {object} Instancia de Axios configurada
   */
  setup(axiosInstance = axios) {
    console.log('🔧 [HTTP CACHE] Configurando interceptores HTTP con caché');
    
    this.setupRequestInterceptor(axiosInstance);
    this.setupResponseInterceptor(axiosInstance);
    
    // Agregar método para limpiar caché manualmente
    axiosInstance.clearCache = () => {
      const cleared = frontendCacheService.clear();
      console.log(`🧹 [HTTP CACHE] Caché limpiado manualmente: ${cleared} entradas`);
      return cleared;
    };
    
    // Agregar método para obtener estadísticas de caché
    axiosInstance.getCacheStats = () => {
      return frontendCacheService.getStats();
    };
    
    console.log('✅ [HTTP CACHE] Interceptores configurados correctamente');
    return axiosInstance;
  }

  /**
   * Invalidar caché específico
   * @param {string} pattern - Patrón a invalidar
   * @returns {number} Número de entradas eliminadas
   */
  invalidateCache(pattern) {
    return frontendCacheService.deletePattern(pattern);
  }

  /**
   * Limpiar todo el caché HTTP
   * @returns {number} Número de entradas eliminadas
   */
  clearAllCache() {
    return frontendCacheService.clear();
  }
}

// Crear instancia singleton
const httpCacheInterceptor = new HttpCacheInterceptor();

export default httpCacheInterceptor;