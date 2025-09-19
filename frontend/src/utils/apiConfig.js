// frontend/src/utils/apiConfig.js

// URL del backend en producción
const PRODUCTION_API_URL = 'https://backend-app-115351146305.us-central1.run.app';

// URLs para entorno local
const LOCAL_API_URL_DEV = 'http://localhost:3000';  // Para desarrollo local
const LOCAL_API_URL_CLOUD = 'http://localhost:8080'; // Para pruebas de nube local

/**
 * Obtiene la URL base de la API según el entorno
 * @returns {string} URL base de la API
 */
export function getApiBaseUrl() {
  // Primero intentamos usar la variable de entorno
  if (import.meta.env.VITE_API_URL) {
    console.log('🌐 Usando API URL desde variables de entorno:', import.meta.env.VITE_API_URL);
    return import.meta.env.VITE_API_URL;
  }
  
  // Si estamos en localhost, intentamos conectar primero al puerto 3000 (desarrollo)
  // y si falla, automáticamente intentará con el puerto 8080 (nube local)
  if (window.location.hostname === 'localhost') {
    // Verificamos si el puerto 3000 está disponible
    const testPort3000 = async () => {
      try {
        const response = await fetch(`${LOCAL_API_URL_DEV}/api/health`, { 
          method: 'HEAD',
          timeout: 1000
        });
        return response.ok;
      } catch (e) {
        return false;
      }
    };
    
    // Si el puerto 3000 no responde, usamos el 8080
    if (!testPort3000()) {
      console.log('🔄 Cambiando a puerto 8080 para backend local');
      return LOCAL_API_URL_CLOUD;
    }
    
    console.log('✅ Usando puerto 3000 para backend local');
    return LOCAL_API_URL_DEV;
  }
  
  // En producción usamos la URL de Cloud Run
  console.log('☁️ Usando URL de producción para backend');
  return PRODUCTION_API_URL;
}

/**
 * Construye una URL completa para la API
 * @param {string} endpoint - Endpoint de la API (sin / inicial)
 * @returns {string} URL completa
 */
export function getApiUrl(endpoint) {
  const baseUrl = getApiBaseUrl();
  // Asegurarse de que el endpoint no comience con / para evitar doble slash
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
}

// Exportar la URL de producción para uso directo
export const BACKEND_URL = PRODUCTION_API_URL;

export default {
  getApiBaseUrl,
  getApiUrl,
  BACKEND_URL
};