// frontend/src/utils/apiConfig.js

// URL del backend en producción
const PRODUCTION_API_URL = 'https://backend-736887951555.europe-west1.run.app';

// URLs para entorno local

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
  
  // Si estamos en localhost, usamos directamente el puerto 8080
  // ya que sabemos que el 3000 está fallando
  if (window.location.hostname === 'localhost') {
    console.log('🔄 Usando puerto 8080 para backend local');
    return LOCAL_API_URL_CLOUD;
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