// frontend/src/composables/useCache.js
import { ref, computed } from 'vue';
import frontendCacheService from '../services/cacheService.js';
import { inject } from 'vue';

/**
 * Composable para manejo de caché en componentes Vue
 * Proporciona funcionalidades reactivas para el caché del frontend
 */
export function useCache() {
  const http = inject('$http');
  
  // Estado reactivo para estadísticas de caché
  const cacheStats = ref(null);
  const isLoading = ref(false);
  
  /**
   * Actualizar estadísticas de caché
   */
  const updateCacheStats = () => {
    cacheStats.value = frontendCacheService.getStats();
  };
  
  /**
   * Computed para información formateada del caché
   */
  const formattedCacheStats = computed(() => {
    if (!cacheStats.value) return null;
    
    const stats = cacheStats.value;
    return {
      ...stats,
      localStorage: {
        ...stats.localStorage,
        sizeKB: Math.round(stats.localStorage.sizeBytes / 1024 * 100) / 100,
        sizeMB: Math.round(stats.localStorage.sizeBytes / (1024 * 1024) * 100) / 100
      },
      sessionStorage: {
        ...stats.sessionStorage,
        sizeKB: Math.round(stats.sessionStorage.sizeBytes / 1024 * 100) / 100,
        sizeMB: Math.round(stats.sessionStorage.sizeBytes / (1024 * 1024) * 100) / 100
      },
      total: {
        ...stats.total,
        sizeKB: Math.round(stats.total.sizeBytes / 1024 * 100) / 100,
        sizeMB: Math.round(stats.total.sizeBytes / (1024 * 1024) * 100) / 100
      }
    };
  });
  
  /**
   * Petición HTTP con caché automático
   * @param {string} url - URL de la petición
   * @param {object} options - Opciones de la petición
   * @returns {Promise} Promesa con la respuesta
   */
  const cachedRequest = async (url, options = {}) => {
    isLoading.value = true;
    
    try {
      const response = await http.get(url, options);
      return response.data;
    } catch (error) {
      console.error('Error en petición con caché:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };
  
  /**
   * Obtener datos de usuario con caché
   * @param {string} userId - ID del usuario
   * @returns {object|null} Datos del usuario
   */
  const getCachedUser = (userId) => {
    return frontendCacheService.getUser(userId);
  };
  
  /**
   * Guardar datos de usuario en caché
   * @param {string} userId - ID del usuario
   * @param {object} userData - Datos del usuario
   * @param {number} ttl - Tiempo de vida (opcional)
   * @returns {boolean} True si se guardó correctamente
   */
  const setCachedUser = (userId, userData, ttl) => {
    return frontendCacheService.setUser(userId, userData, ttl);
  };
  
  /**
   * Obtener datos de guardia con caché
   * @param {string} guardId - ID del guardia
   * @returns {object|null} Datos del guardia
   */
  const getCachedGuard = (guardId) => {
    return frontendCacheService.getGuard(guardId);
  };
  
  /**
   * Guardar datos de guardia en caché
   * @param {string} guardId - ID del guardia
   * @param {object} guardData - Datos del guardia
   * @param {number} ttl - Tiempo de vida (opcional)
   * @returns {boolean} True si se guardó correctamente
   */
  const setCachedGuard = (guardId, guardData, ttl) => {
    return frontendCacheService.setGuard(guardId, guardData, ttl);
  };
  
  /**
   * Obtener estadísticas con caché
   * @param {string} statsKey - Clave de las estadísticas
   * @returns {object|null} Datos de estadísticas
   */
  const getCachedStats = (statsKey) => {
    return frontendCacheService.getStats(statsKey);
  };
  
  /**
   * Guardar estadísticas en caché
   * @param {string} statsKey - Clave de las estadísticas
   * @param {object} statsData - Datos de estadísticas
   * @param {number} ttl - Tiempo de vida (opcional)
   * @returns {boolean} True si se guardó correctamente
   */
  const setCachedStats = (statsKey, statsData, ttl) => {
    return frontendCacheService.setStats(statsKey, statsData, ttl);
  };
  
  /**
   * Invalidar caché de usuarios
   * @returns {number} Número de entradas eliminadas
   */
  const invalidateUserCache = () => {
    const deleted = frontendCacheService.invalidateUserCache();
    updateCacheStats();
    return deleted;
  };
  
  /**
   * Invalidar caché de guardias
   * @returns {number} Número de entradas eliminadas
   */
  const invalidateGuardCache = () => {
    const deleted = frontendCacheService.invalidateGuardCache();
    updateCacheStats();
    return deleted;
  };
  
  /**
   * Invalidar caché de estadísticas
   * @returns {number} Número de entradas eliminadas
   */
  const invalidateStatsCache = () => {
    const deleted = frontendCacheService.invalidateStatsCache();
    updateCacheStats();
    return deleted;
  };
  
  /**
   * Limpiar todo el caché
   * @returns {number} Número de entradas eliminadas
   */
  const clearAllCache = () => {
    const deleted = frontendCacheService.clear();
    updateCacheStats();
    return deleted;
  };
  
  /**
   * Limpiar caché HTTP (usando el interceptor)
   * @returns {number} Número de entradas eliminadas
   */
  const clearHttpCache = () => {
    if (http && http.clearCache) {
      const deleted = http.clearCache();
      updateCacheStats();
      return deleted;
    }
    return 0;
  };
  
  /**
   * Obtener estadísticas del caché HTTP
   * @returns {object|null} Estadísticas del caché HTTP
   */
  const getHttpCacheStats = () => {
    if (http && http.getCacheStats) {
      return http.getCacheStats();
    }
    return null;
  };
  
  /**
   * Limpiar caché expirado
   * @returns {number} Número de entradas eliminadas
   */
  const cleanupExpiredCache = () => {
    const deleted = frontendCacheService.cleanup();
    updateCacheStats();
    return deleted;
  };
  
  /**
   * Hook para peticiones con invalidación automática
   * @param {Function} requestFn - Función que hace la petición
   * @param {string[]} invalidationPatterns - Patrones a invalidar después de la petición
   * @returns {Function} Función wrapper
   */
  const useInvalidatingRequest = (requestFn, invalidationPatterns = []) => {
    return async (...args) => {
      try {
        const result = await requestFn(...args);
        
        // Invalidar caché después de operaciones exitosas
        invalidationPatterns.forEach(pattern => {
          frontendCacheService.deletePattern(pattern);
        });
        
        updateCacheStats();
        return result;
        
      } catch (error) {
        throw error;
      }
    };
  };
  
  /**
   * Hook para datos con caché automático
   * @param {string} cacheKey - Clave del caché
   * @param {Function} fetchFn - Función para obtener datos
   * @param {number} ttl - Tiempo de vida del caché
   * @returns {object} Estado reactivo con datos y funciones
   */
  const useCachedData = (cacheKey, fetchFn, ttl = 5 * 60 * 1000) => {
    const data = ref(null);
    const loading = ref(false);
    const error = ref(null);
    
    const fetchData = async (forceRefresh = false) => {
      loading.value = true;
      error.value = null;
      
      try {
        // Intentar obtener del caché primero
        if (!forceRefresh) {
          const cachedData = frontendCacheService.get(cacheKey);
          if (cachedData) {
            data.value = cachedData;
            loading.value = false;
            return cachedData;
          }
        }
        
        // Obtener datos frescos
        const freshData = await fetchFn();
        
        // Guardar en caché
        frontendCacheService.set(cacheKey, freshData, ttl);
        data.value = freshData;
        
        return freshData;
        
      } catch (err) {
        error.value = err;
        throw err;
      } finally {
        loading.value = false;
      }
    };
    
    const refresh = () => fetchData(true);
    
    const invalidate = () => {
      frontendCacheService.delete(cacheKey);
      data.value = null;
    };
    
    return {
      data,
      loading,
      error,
      fetchData,
      refresh,
      invalidate
    };
  };
  
  // Inicializar estadísticas
  updateCacheStats();
  
  return {
    // Estado reactivo
    cacheStats,
    formattedCacheStats,
    isLoading,
    
    // Funciones de caché básicas
    updateCacheStats,
    cachedRequest,
    
    // Funciones específicas por tipo
    getCachedUser,
    setCachedUser,
    getCachedGuard,
    setCachedGuard,
    getCachedStats,
    setCachedStats,
    
    // Funciones de invalidación
    invalidateUserCache,
    invalidateGuardCache,
    invalidateStatsCache,
    clearAllCache,
    clearHttpCache,
    cleanupExpiredCache,
    
    // Funciones de estadísticas
    getHttpCacheStats,
    
    // Hooks avanzados
    useInvalidatingRequest,
    useCachedData
  };
}

export default useCache;