<template>
  <button class="btn-volver-dashboard-fixed" @click="goToDashboard">Volver al Dashboard</button>
  <section class="container">
    <!-- Indicador de carga -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando historial...</p>
    </div>

    <!-- Mensaje de error -->
    <div v-if="error" class="error-container">
      <p class="error-message">{{ error }}</p>
      <button @click="recargarHistorial" class="btn primary">Reintentar</button>
    </div>

    <!-- Contenido principal -->
    <div v-if="!loading && !error">
      <div class="top-bar">
        <div class="search-filter">
          <input
            type="search"
            v-model="searchQuery"
            placeholder="Buscar por usuario, documento, serial, guardia..."
            aria-label="Buscar registros"
            @input="filterTable"
          />
          <select v-model="selectedType" @change="filterTable" aria-label="Tipo registro">
            <option value="">Todos los tipos</option>
            <option value="Entrada">Entrada</option>
            <option value="Salida">Salida</option>
          </select>
        </div>
        <div class="actions">
          <button @click="recargarHistorial" class="btn secondary" title="Recargar historial">
            🔄 Recargar
          </button>
          <button @click="exportData('excel')" class="btn primary" :disabled="filteredRecords.length === 0">
            📊 Excel
          </button>
          <button @click="exportData('pdf')" class="btn primary" :disabled="filteredRecords.length === 0">
            📄 PDF
          </button>
        </div>
      </div>

      <!-- Estadísticas -->
      <div class="stats-bar">
        <span class="stat-item">
          👥 Usuarios hoy: <strong>{{ stats.total }}</strong>
          </span>
          <span class="stat-item" v-if="allRecords.length > 0">
            📊 Total histórico: <strong>{{ allRecords.length }}</strong> registros
          </span>
          <span class="stat-item">
            🟢 Adentro: <strong>{{ stats.adentro }}</strong>
          </span>
          <span class="stat-item">
            🔴 Afuera: <strong>{{ stats.afuera }}</strong>
          </span>
          <span class="stat-item" v-if="searchQuery || selectedType">
            🔍 Filtrados: <strong>{{ filteredRecords.length }}</strong> usuarios
        </span>
        <button class="refresh-btn" @click="cargarHistorial" :disabled="loading" title="Actualizar datos">
          <span class="refresh-icon" :class="{ 'spinning': loading }">🔄</span>
          {{ loading ? 'Actualizando...' : 'Actualizar' }}
        </button>
        <span class="stat-item info-text">
          💡 Haz clic en un nombre para ver el historial completo del usuario
        </span>
      </div>

      <!-- Tabla de historial -->
      <div class="table-container">
        <table v-if="!loading && !error" class="records-table">
        <thead>
          <tr>
             <th>Usuario</th>
             <th>Documento</th>
             <th>Serial del equipo</th>
             <th>Última Entrada</th>
             <th>Última Salida</th>
             <th>Guardia</th>
             <th>Estado Actual</th>
           </tr>
        </thead>
        <tbody>
          <tr v-for="(record, index) in filteredRecords" :key="record.id || index">
             <td>
               <span class="usuario-link" @click="showUserModal(record)" :title="record.email">
                 {{ record.usuario }}
               </span>
             </td>
             <td>{{ record.documento }}</td>
             <td>{{ record.serial }}</td>
             <td>{{ record.ultimaEntrada ? formatearFechaSimple(record.ultimaEntrada) : '---' }}</td>
             <td>{{ record.ultimaSalida ? formatearFechaSimple(record.ultimaSalida) : '' }}</td>
             <td>{{ record.nombreGuardia || '' }}</td>
             <td>
                <span :class="{
                  'badge-entrada': record.estadoActual === 'Entrada',
                  'badge-salida': record.estadoActual === 'Salida'
                }">
                  {{ record.estadoActual }}
                </span>
              </td>
           </tr>
           <tr v-if="filteredRecords.length === 0 && !loading">
             <td colspan="6" class="no-results">
               {{ searchQuery || selectedType ? 'No se encontraron registros con los filtros aplicados' : 'No hay registros de historial' }}
             </td>
           </tr>
        </tbody>
      </table>
      </div>
    </div>

    <!-- Modal de historial completo del usuario -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modal-content-large">
        <div class="modal-header">
          <h3>Historial Completo de {{ selectedUser?.usuario }}</h3>
          <div class="modal-user-info">
            <span><strong>Documento:</strong> {{ selectedUser?.documento }}</span>
            <span><strong>Email:</strong> {{ selectedUser?.email }}</span>
            <span><strong>Total registros:</strong> {{ userHistoryRecords.length }}</span>
          </div>
          <button class="modal-close-btn" @click="closeUserModal">✕</button>
        </div>
        
        <div class="modal-table-container">
          <table class="modal-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Guardia</th>
                <th>Estado</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(record, index) in userHistoryRecords" :key="record.id || index">
                <td class="fecha-cell">{{ formatearFechaSolo(record.fechaCreacion) }}</td>
                <td class="fecha-cell">{{ record.entradaFormateada || '---' }}</td>
                <td class="fecha-cell">{{ record.salidaFormateada || '---' }}</td>
                <td>{{ record.nombreGuardia }}</td>
                <td>
                  <span :class="['estado-badge', record.estado.toLowerCase()]">
                    {{ record.estado }}
                  </span>
                </td>
                <td>
                  <span :class="['type-badge', record.tipo.toLowerCase()]">
                    {{ record.tipo }}
                  </span>
                </td>
              </tr>
              <tr v-if="userHistoryRecords.length === 0">
                <td colspan="6" class="no-results">
                  No se encontraron registros históricos para este usuario
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="modal-footer">
          <button class="btn secondary" @click="closeUserModal">Cerrar</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import axios from 'axios';

import { getApiUrl } from '../utils/apiConfig';

export default {
  data() {
    return {
      searchQuery: "",
      selectedType: "",
      records: [], // Registros del día actual
      allRecords: [], // Todos los registros históricos
      filteredRecords: [],
      showModal: false,
      selectedUser: null,
      userHistoryRecords: [], // Registros históricos del usuario seleccionado
      loading: false,
      error: null,
      // Paginación
      currentPage: 1,
      recordsPerPage: 50,
      totalRecords: 0,
      intervalId: null, // Para la actualización automática
      stats: {
        total: 0,
        adentro: 0,
        afuera: 0
      }
    };
  },
  async mounted() {
    await this.cargarHistorial();
    // 🔹 Actualización automática cada 30 segundos
    this.intervalId = setInterval(() => {
      this.cargarHistorial();
    }, 30000);
  },

  beforeUnmount() {
    // 🔹 Limpiar intervalo al destruir el componente
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  },
  methods: {
    // 🔹 Cargar historial desde el backend
    async cargarHistorial() {
      this.loading = true;
      this.error = null;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }

        // Forzar refresco desde el servidor sin usar caché
        const timestamp = new Date().getTime();
        const response = await fetch(
        getApiUrl(`api/historial/listar?t=${timestamp}`),
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          }
        );

        // Procesar y formatear los datos
        const allRecords = response.data.map(record => ({
          id: record._id,
          usuario: record.usuario?.nombre || 'N/A',
          documento: record.usuario?.numeroDocumento || 'N/A',
          email: record.usuario?.email || 'N/A',
          serial: record.serial || 'N/A',
          entrada: record.entrada,
          entradaFormateada: this.formatearFecha(record.entrada),
          salida: record.salida,
          salidaFormateada: record.salida ? this.formatearFecha(record.salida) : null,
          docGuardia: record.docGuardia || record.guardia?.documento || 'N/A',
          nombreGuardia: record.guardia?.nombre || 'N/A',
          estado: record.estado || 'N/A',
          tipo: this.determinarTipo(record),
          fechaCreacion: record.createdAt,
          fechaEntrada: new Date(record.entrada),
          fechaSalida: record.salida ? new Date(record.salida) : null,
          usuarioId: record.usuario?._id,
          raw: record // Datos originales para referencia
        }));

        // 🔹 Guardar TODOS los registros históricos para el modal
        this.allRecords = allRecords;
        
        // 🔹 Agrupar por usuario para mostrar solo el último estado de cada uno
        const usuariosMap = new Map();
        
        // Agrupar todos los registros por usuario
        allRecords.forEach(record => {
          const usuarioKey = record.usuarioId || record.documento;
          
          if (!usuariosMap.has(usuarioKey)) {
            // Inicializar el usuario con datos básicos
            usuariosMap.set(usuarioKey, {
              id: record.id,
              usuario: record.usuario,
              documento: record.documento,
              email: record.email,
              serial: record.serial,
              ultimaEntrada: null,
              ultimaSalida: null,
              nombreGuardia: null,
              estadoActual: null,
              registros: [] // Todos los registros de este usuario
            });
          }
          
          // Añadir este registro a la lista de registros del usuario
          const usuarioData = usuariosMap.get(usuarioKey);
          usuarioData.registros.push(record);
        });
        
        // Procesar cada usuario para determinar su último estado
        usuariosMap.forEach(usuario => {
          // Ordenar registros por fecha (más reciente primero)
          usuario.registros.sort((a, b) => {
            const fechaA = a.fechaEntrada;
            const fechaB = b.fechaEntrada;
            return fechaB - fechaA;
          });
          
          // Encontrar la última entrada y salida
          let ultimaEntrada = null;
          let ultimaSalida = null;
          let nombreGuardia = null;
          
          for (const registro of usuario.registros) {
            // Si encontramos una entrada y aún no tenemos una última entrada
            if (registro.entrada && (!ultimaEntrada || new Date(registro.entrada) > new Date(ultimaEntrada))) {
              ultimaEntrada = registro.entrada;
              nombreGuardia = registro.nombreGuardia;
            }
            
            // Si encontramos una salida y aún no tenemos una última salida
            if (registro.salida && (!ultimaSalida || new Date(registro.salida) > new Date(ultimaSalida))) {
              ultimaSalida = registro.salida;
              nombreGuardia = registro.nombreGuardia;
            }
          }
          
          usuario.ultimaEntrada = ultimaEntrada;
          usuario.ultimaSalida = ultimaSalida;
          usuario.nombreGuardia = nombreGuardia;
          
          // Determinar estado actual basado en la última acción
          if (ultimaEntrada && ultimaSalida) {
            // Si hay entrada y salida, comparar fechas
            if (new Date(ultimaEntrada) > new Date(ultimaSalida)) {
              usuario.estadoActual = 'Entrada';
            } else {
              usuario.estadoActual = 'Salida';
            }
          } else if (ultimaEntrada) {
            usuario.estadoActual = 'Entrada';
          } else {
            usuario.estadoActual = 'Desconocido';
          }
        });

        // Convertir a array y ordenar por entrada más reciente
        this.records = Array.from(usuariosMap.values())
          .sort((a, b) => {
            const fechaA = a.ultimaEntrada ? new Date(a.ultimaEntrada) : new Date(0);
            const fechaB = b.ultimaEntrada ? new Date(b.ultimaEntrada) : new Date(0);
            return fechaB - fechaA;
          });
        
        this.totalRecords = this.records.length;
        this.filteredRecords = [...this.records];
        
        // 🔹 Calcular estadísticas
        const totalUsuarios = this.records.length;
        const usuariosAdentro = this.records.filter(r => r.estadoActual === 'Entrada').length;
        const usuariosAfuera = this.records.filter(r => r.estadoActual === 'Salida').length;
        
        this.stats = {
          total: totalUsuarios,
          adentro: usuariosAdentro,
          afuera: usuariosAfuera
        };
       
        console.log(`✅ Usuarios registrados: ${this.records.length} (${usuariosAdentro} adentro, ${usuariosAfuera} afuera)`);
        console.log(`📊 Total histórico: ${allRecords.length} registros`);
        
      } catch (err) {
        console.error('❌ Error cargando historial:', err);
        this.error = 'Error al cargar el historial. Verifique su conexión.';
        
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          this.$router.push('/login');
        }
      } finally {
        this.loading = false;
      }
    },

    // 🔹 Determinar tipo de movimiento basado en los datos
    determinarTipo(record) {
      if (record.salida) {
        return 'Salida';
      } else if (record.entrada) {
        return 'Entrada';
      }
      return 'Desconocido';
    },

    // 🔹 Formatear fechas de manera legible
    formatearFecha(fecha) {
      if (!fecha) return null;
      
      try {
        const date = new Date(fecha);
        return date.toLocaleString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (err) {
        console.error('Error formateando fecha:', err);
        return fecha;
      }
    },

    // 🔹 Formatear solo fecha (sin hora) para el modal
    formatearFechaSolo(fecha) {
      if (!fecha) return null;
      
      try {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      } catch (err) {
        console.error('Error formateando fecha:', err);
        return fecha;
      }
    },
    
    // 🔹 Formatear fecha simplificada para la tabla principal
    formatearFechaSimple(fecha) {
      if (!fecha) return 'N/A';
      
      try {
        const date = new Date(fecha);
        return date.toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (err) {
        console.error('Error formateando fecha:', err);
        return fecha;
      }
    },

    // 🔹 Filtrar tabla con búsqueda mejorada
    filterTable() {
      const query = this.searchQuery.trim().toLowerCase();
      
      this.filteredRecords = this.records.filter(record => {
        // Búsqueda por texto
        const matchesSearch = !query || [
          record.usuario,
          record.documento,
          record.serial,
          record.email,
          record.ultimaEntrada ? this.formatearFechaSimple(record.ultimaEntrada) : '',
          record.ultimaSalida ? this.formatearFechaSimple(record.ultimaSalida) : '',
          record.estadoActual
        ].some(field => 
          field && field.toString().toLowerCase().includes(query)
        );
        
        // Filtro por tipo
        const matchesType = !this.selectedType || 
          (this.selectedType === 'Entrada' && record.estadoActual === 'Entrada') ||
          (this.selectedType === 'Salida' && record.estadoActual === 'Salida');
        
        return matchesSearch && matchesType;
      });
      
      console.log(`🔍 Filtros aplicados: ${this.filteredRecords.length}/${this.records.length} usuarios`);
    },

    // 🔹 Recargar historial
    async recargarHistorial() {
      await this.cargarHistorial();
    },

    // 🔹 Exportar datos (placeholder)
    exportData(type) {
      if (this.filteredRecords.length === 0) {
        alert('No hay registros para exportar.');
        return;
      }
      
      // TODO: Implementar exportación real
      alert(`Función para exportar ${this.filteredRecords.length} registros como ${type.toUpperCase()} será implementada próximamente.`);
    },

    // 🔹 Navegación
    goToDashboard() {
      this.$router.push({ path: '/dashboard' });
    },

    // 🔹 Modal de usuario - Mostrar historial completo
    showUserModal(record) {
      this.selectedUser = record;
      
      // Filtrar todos los registros históricos del usuario
      // Incluir todos los registros del usuario, no solo los del día actual
      this.userHistoryRecords = this.allRecords.filter(r => 
        r.usuarioId === record.usuarioId || 
        (r.documento === record.documento && r.documento !== 'N/A')
      ).sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
      
      console.log(`📋 Mostrando historial completo de ${record.usuario}: ${this.userHistoryRecords.length} registros`);
      this.showModal = true;
    },

    closeUserModal() {
      this.showModal = false;
      this.selectedUser = null;
      this.userHistoryRecords = [];
    },
  }
}
</script>

<style scoped>
.container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 2rem auto;
  color: #222;
  background: #fff;
  width: 90vw;
  min-height: 80vh;
  max-width: 1200px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  border-radius: 16px;
  padding: 2.5rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  width: 100%;
}

.search-filter {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

input[type="search"] {
  padding: 0.5rem 1rem;
  border: 1px solid #bbb;
  border-radius: 6px;
  min-width: 280px;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
}

input[type="search"]:focus {
  outline: none;
  border-color: #1565c0;
  box-shadow: 0 0 6px #90caf9;
}

select {
  padding: 0.4rem 0.8rem;
  border: 1px solid #bbb;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

select:focus {
  outline: none;
  border-color: #1565c0;
  box-shadow: 0 0 6px #90caf9;
}

.actions {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.35rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  color: white;
  user-select: none;
}

.btn.primary {
  background-color: #1565c0;
}

.btn.primary:hover {
  background-color: #0d3c78;
}

.btn.primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn.secondary {
  background-color: #6c757d;
}

.btn.secondary:hover {
  background-color: #545b62;
}

.table-container {
  width: 100%;
  max-height: 600px;
  overflow-y: auto;
  margin-top: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.05rem;
}

.records-table thead tr {
  background-color: #f0f4f8;
  position: sticky;
  top: 0;
  z-index: 10;
}

.records-table th,
.records-table td {
  padding: 1rem 1.5rem;
  border: 1px solid #ddd;
  text-align: left;
  vertical-align: middle;
}

.type-badge {
  display: inline-block;
  padding: 0.2rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  user-select: none;
}

.type-badge.entrada {
  background-color: #fff3e0;
  color: #f57c00;
}

.type-badge.completo {
  background-color: #e8f5e8;
  color: #2e7d32;
}

.type-badge.salida {
  background-color: #fceaea;
  color: #d32f2f;
}

.no-results {
  text-align: center;
  color: #888;
  font-style: italic;
  padding: 2rem 0;
}

.dashboard-btn-wrapper {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  margin-top: 2.5rem;
}

.btn-volver-dashboard {
  background: #1565c0;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 1rem 2.2rem;
  font-size: 1.1rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  cursor: pointer;
  transition: background 0.2s;
}
.btn-volver-dashboard:hover {
  background: #0d3c78;
}

.btn-volver-dashboard-fixed {
  position: fixed;
  top: 1.2rem;
  right: 1.5rem;
  background: #1565c0;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.45rem 1.1rem;
  font-size: 0.95rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  cursor: pointer;
  z-index: 9999;
  transition: background 0.2s;
}
.btn-volver-dashboard-fixed:hover {
  background: #0d3c78;
}

.usuario-link {
  color: #1565c0;
  text-decoration: underline;
  cursor: pointer;
  font-weight: 500;
}

.usuario-link:hover {
  color: #0d47a1;
  text-decoration: none;
}

/* 🔹 Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}

.modal-content-large {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 48px rgba(0,0,0,0.25);
  width: 90vw;
  max-width: 1000px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #1565c0;
  font-size: 1.4rem;
  font-weight: 600;
}

.modal-user-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: #666;
}

.modal-user-info span {
  display: block;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #999;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.modal-close-btn:hover {
  background: #f0f0f0;
  color: #666;
}

.modal-table-container {
  flex: 1;
  overflow-y: auto;
  padding: 0;
}

.modal-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.modal-table thead {
  background: #f8f9fa;
  position: sticky;
  top: 0;
  z-index: 10;
}

.modal-table th,
.modal-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #eee;
  text-align: left;
  vertical-align: middle;
}

.modal-table th {
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #ddd;
}

.modal-table tbody tr:hover {
  background: #f8f9fa;
}

.modal-footer {
  padding: 1rem 2rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  background: #f8f9fa;
}

/* 🔹 Estilos para loading y errores */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #1565c0;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  background: #ffeaea;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
  margin: 2rem 0;
}

.error-message {
  color: #d32f2f;
  font-size: 1.1rem;
  margin-bottom: 1rem;
  text-align: center;
}

/* 🔹 Barra de estadísticas */
.stats-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0,123,255,0.3);
}

.refresh-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0,123,255,0.4);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.refresh-icon {
  display: inline-block;
  transition: transform 0.3s ease;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stat-item {
  color: #666;
  font-size: 0.95rem;
}

.stat-item strong {
  color: #1565c0;
  font-weight: 600;
}

.stat-item.info-text {
  color: #888;
  font-style: italic;
  font-size: 0.85rem;
}

/* 🔹 Estilos mejorados para la tabla */
.serial-cell {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fecha-cell {
  font-size: 0.9rem;
  color: #555;
  min-width: 140px;
}

.estado-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.estado-badge.adentro {
  background-color: #e3f2fd;
  color: #1565c0;
}

.estado-badge.afuera {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.estado-badge.n\/a {
  background-color: #f5f5f5;
  color: #757575;
}

/* 🔹 Responsive design */
@media (max-width: 768px) {
  .container {
    width: 95vw;
    padding: 1.5rem;
  }
  
  .top-bar {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .search-filter {
    flex-direction: column;
    gap: 1rem;
  }
  
  .actions {
    justify-content: center;
  }
  
  .records-table {
    font-size: 0.9rem;
  }
  
  .records-table th,
  .records-table td {
    padding: 0.75rem 0.5rem;
  }
  
  .stats-bar {
    justify-content: center;
    text-align: center;
  }
}
</style>