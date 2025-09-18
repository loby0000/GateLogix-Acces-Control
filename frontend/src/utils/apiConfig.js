// frontend/src/utils/apiConfig.js

// URL del backend en producción
const PRODUCTION_API_URL = 'https://backend-app-115351146305.us-central1.run.app';

/**
 * Obtiene la URL base de la API según el entorno
 * @returns {string} URL base de la API
 */
export function getApiBaseUrl() {
  return import.meta.env.VITE_API_URL || 
         (window.location.hostname === 'localhost' ? 
          'http://localhost:3000' : 
          PRODUCTION_API_URL);
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