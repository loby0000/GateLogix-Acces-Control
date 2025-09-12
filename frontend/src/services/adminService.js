// frontend/src/services/adminService.js
import axios from 'axios';

/**
 * Servicio para la gestión de administradores
 * Proporciona métodos para interactuar con la API de administradores
 */
class AdminService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    this.apiUrl = `${this.baseUrl}/api/admin`;
  }

  /**
   * Verificar credenciales de administrador
   * @param {string} usuario - Usuario del administrador
   * @param {string} clave - Clave del administrador
   * @returns {Promise} Promesa con el resultado de la verificación
   */
  async verificarCredenciales(usuario, clave) {
    try {
      const response = await axios.post(`${this.apiUrl}/login`, { usuario, clave });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error al verificar credenciales de admin:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Error al verificar credenciales'
      };
    }
  }
}

// Exportar una instancia única del servicio
const adminService = new AdminService();
export default adminService;