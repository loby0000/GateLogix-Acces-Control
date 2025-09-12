// frontend/src/services/guardiaService.js
import axios from 'axios';

/**
 * Servicio para la gestión de guardias
 * Proporciona métodos para interactuar con la API de guardias
 */
class GuardiaService {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    this.apiUrl = `${this.baseUrl}/api/guardia`;
  }

  /**
   * Obtener el token de autenticación
   * @returns {string|null} Token JWT o null si no hay sesión
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Obtener headers de autenticación
   * @returns {object} Headers con token de autenticación
   */
  getAuthHeaders() {
    const token = this.getToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  /**
   * Listar todos los guardias
   * @param {number} page - Número de página
   * @param {number} limit - Límite de resultados por página
   * @param {number} timestamp - Timestamp para evitar caché
   * @returns {Promise} Promesa con la lista de guardias
   */
  async listarGuardias(page = 1, limit = 10, timestamp = null) {
    try {
      // Añadir timestamp para evitar caché si se proporciona
      const cacheParam = timestamp ? `&_t=${timestamp}` : '';
      const response = await axios.get(
        `${this.apiUrl}/listar?page=${page}&limit=${limit}${cacheParam}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error al listar guardias:', error);
      throw error;
    }
  }

  /**
   * Buscar guardia por documento
   * @param {string} documento - Documento del guardia
   * @returns {Promise} Promesa con los datos del guardia
   */
  async buscarPorDocumento(documento) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/buscar/${documento}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error al buscar guardia con documento ${documento}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar estado de un guardia
   * @param {string} id - ID del guardia
   * @param {string} estado - Nuevo estado ('activo' o 'inactivo')
   * @returns {Promise} Promesa con el resultado de la actualización
   */
  async actualizarEstado(id, estado) {
    try {
      const response = await axios.put(
        `${this.apiUrl}/estado/${id}`,
        { estado },
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar estado del guardia ${id}:`, error);
      throw error;
    }
  }

  /**
   * Registrar un nuevo guardia (requiere credenciales de admin)
   * @param {object} datosGuardia - Datos del guardia a registrar
   * @returns {Promise} Promesa con el resultado del registro
   */
  async registrarGuardia(datosGuardia) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/registrar`,
        datosGuardia
      );
      return response.data;
    } catch (error) {
      console.error('Error al registrar guardia:', error);
      throw error;
    }
  }

  /**
   * Incrementar el contador de registros de un guardia
   * @param {string} id - ID del guardia
   * @returns {Promise} Promesa con el resultado de la actualización
   */
  async incrementarRegistros(id) {
    try {
      const response = await axios.put(
        `${this.apiUrl}/registros/${id}`,
        {},
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error al incrementar registros del guardia ${id}:`, error);
      throw error;
    }
  }

  /**
   * Actualizar datos de un guardia (nombre y jornada)
   * @param {string} id - ID del guardia
   * @param {object} datosGuardia - Datos a actualizar (nombre, jornada)
   * @returns {Promise} Promesa con el resultado de la actualización
   */
  async actualizarGuardia(id, datosGuardia) {
    try {
      const response = await axios.put(
        `${this.apiUrl}/actualizar/${id}`,
        datosGuardia,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar datos del guardia ${id}:`, error);
      throw error;
    }
  }
}

// Exportar una instancia única del servicio
const guardiaService = new GuardiaService();
export default guardiaService;