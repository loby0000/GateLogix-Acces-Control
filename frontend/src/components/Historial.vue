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

        <!-- Información del equipo principal -->
        <div v-if="equipoPrincipal" class="equipo-principal-info">
          <h4>Equipo Principal</h4>
          <div class="equipo-details">
            <div class="equipo-detail-item">
              <strong>Marca:</strong> {{ equipoPrincipal.marca || 'No especificada' }}
            </div>
            <div class="equipo-detail-item">
              <strong>Serial:</strong> {{ equipoPrincipal.serial || 'No especificado' }}
            </div>
            <div v-if="equipoPrincipal.caracteristicas" class="equipo-detail-item">
              <strong>Características:</strong> {{ equipoPrincipal.caracteristicas }}
            </div>
            <div v-if="equipoPrincipal.accesorios" class="equipo-detail-item">
              <strong>Accesorios:</strong>
              <span v-if="equipoPrincipal.accesorios.mouse" class="accesorio-badge">Mouse</span>
              <span v-if="equipoPrincipal.accesorios.cargador" class="accesorio-badge">Cargador</span>
              <span v-if="!equipoPrincipal.accesorios.mouse && !equipoPrincipal.accesorios.cargador">Ninguno</span>
            </div>
          </div>
          
          <!-- Botón "Otros equipos" - solo si hay equipos adicionales -->
          <div v-if="otrosEquipos && otrosEquipos.length > 0" class="otros-equipos-section">
            <button class="btn-otros-equipos" @click="abrirModalOtrosEquipos">
              Otros equipos ({{ otrosEquipos.length }})
            </button>
          </div>
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
            <tbody class="modal-table-body">
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

    <!-- Modal de otros equipos -->
    <div v-if="showOtrosEquiposModal" class="modal-overlay" @click.self="cerrarModalOtrosEquipos">
      <div class="modal-content-medium">
        <div class="modal-header">
          <h3>Otros Equipos de {{ selectedUser?.usuario }}</h3>
          <button class="modal-close-btn" @click="cerrarModalOtrosEquipos">✕</button>
        </div>
        
        <div class="otros-equipos-list">
          <div v-for="(equipo, index) in otrosEquipos" :key="equipo._id || index" 
               class="equipo-item" @click="abrirHistorialEquipo(equipo)">
            <div class="equipo-info">
              <h4>{{ equipo.marca || 'Equipo sin marca' }}</h4>
              <p><strong>Serial:</strong> {{ equipo.serial || 'No especificado' }}</p>
              <p v-if="equipo.caracteristicas"><strong>Características:</strong> {{ equipo.caracteristicas }}</p>
              <div v-if="equipo.accesorios" class="accesorios">
                <span v-if="equipo.accesorios.mouse" class="accesorio-badge">Mouse</span>
                <span v-if="equipo.accesorios.cargador" class="accesorio-badge">Cargador</span>
              </div>
            </div>
            <div class="equipo-action">
              <span class="ver-historial">Ver historial →</span>
            </div>
          </div>
          
          <div v-if="otrosEquipos.length === 0" class="no-otros-equipos">
            Este usuario no tiene otros equipos registrados
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn secondary" @click="cerrarModalOtrosEquipos">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal de historial individual por equipo -->
    <div v-if="showHistorialEquipoModal" class="modal-overlay" @click.self="cerrarHistorialEquipoModal">
      <div class="modal-content-large">
        <div class="modal-header">
          <h3>Historial de {{ equipoSeleccionado?.marca || 'Equipo' }}</h3>
          <div class="modal-user-info">
            <span><strong>Usuario:</strong> {{ selectedUser?.usuario }}</span>
            <span><strong>Serial:</strong> {{ equipoSeleccionado?.serial }}</span>
            <span><strong>Total registros:</strong> {{ historialEquipoSeleccionado.length }}</span>
          </div>
          <button class="modal-close-btn" @click="cerrarHistorialEquipoModal">✕</button>
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
            <tbody class="modal-table-body">
              <tr v-for="(record, index) in historialEquipoSeleccionado" :key="record.id || index">
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
              <tr v-if="historialEquipoSeleccionado.length === 0">
                <td colspan="6" class="no-results">
                  No se encontraron registros históricos para este equipo
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="modal-footer">
          <button class="btn secondary" @click="cerrarHistorialEquipoModal">Cerrar</button>
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
      },
      // Nuevas propiedades para equipos
      equipoPrincipal: null,
      otrosEquipos: [],
      showOtrosEquiposModal: false,
      showHistorialEquipoModal: false,
      equipoSeleccionado: null,
      historialEquipoSeleccionado: []
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

        // Verificar si la respuesta es correcta
        if (!response.ok) {
          console.error('Error en la respuesta del servidor:', response.status);
          this.error = `Error al cargar historial: ${response.statusText}`;
          this.loading = false;
          return;
        }

        // Convertir la respuesta a JSON
        const data = await response.json();
        
        // Verificar si hay datos
        if (!data || !Array.isArray(data)) {
          console.error('Formato de respuesta incorrecto:', data);
          this.error = 'Formato de respuesta incorrecto';
          this.loading = false;
          return;
        }

        // Procesar y formatear los datos
        const allRecords = data.map(record => ({
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
          let ultimoSerialEntrada = null; // ✅ guardar el serial del último ingreso
          
          for (const registro of usuario.registros) {
            // Si encontramos una entrada y aún no tenemos una última entrada
            if (registro.entrada && (!ultimaEntrada || new Date(registro.entrada) > new Date(ultimaEntrada))) {
              ultimaEntrada = registro.entrada;
              nombreGuardia = registro.nombreGuardia;
              ultimoSerialEntrada = registro.serial; // ✅ actualizar serial al del último ingreso
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
          
          // 🔹 Mantener serial original; se actualizará con el equipo principal más adelante
          
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
        
        // ✅ Actualizar el serial mostrado en la tabla al del equipo principal
        await this.actualizarSerialPrincipalTabla(this.records);
        
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

    // 🔹 Actualizar serial en la tabla según equipo principal
    async actualizarSerialPrincipalTabla(records) {
      try {
        const token = localStorage.getItem('token');
        const timestamp = new Date().getTime();
        // Procesar en serie para evitar saturar backend
        for (let r of records) {
          const documento = r.documento;
          if (!documento || documento === 'N/A') continue;
          const resp = await fetch(
            getApiUrl(`api/equipos/usuario/${documento}?t=${timestamp}`),
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (!resp.ok) continue;
          const data = await resp.json();
          const principal = (data.equipo && data.equipo.serial) ? data.equipo : (Array.isArray(data.equipos) && data.equipos.length > 0 ? data.equipos[0] : null);
          if (principal && principal.serial) {
            r.serial = principal.serial;
          }
        }
      } catch (e) {
        console.warn('No se pudo actualizar seriales de equipo principal en la tabla:', e);
      }
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

    // 🔹 Modal de usuario - Mostrar historial completo (solo equipo principal)
    async showUserModal(record) {
      this.selectedUser = record;
      
      // Filtrar todos los registros históricos del usuario (incluye todo su histórico)
      this.userHistoryRecords = this.allRecords
        .filter(r => r.usuarioId === record.usuarioId || (r.documento === record.documento && r.documento !== 'N/A'))
        .sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
      
      // Detectar el serial del último ingreso del usuario (por si no hay equipo principal definido)
      const ultimoIngreso = this.userHistoryRecords.find(r => r.entrada);
      const serialUltimoIngreso = ultimoIngreso ? ultimoIngreso.serial : null;
      
      // Obtener información completa del usuario y sus equipos
      await this.obtenerEquiposUsuario(record.documento);
      
      // ✅ Mostrar únicamente el historial del equipo principal en el modal
      const serialPrincipal = (this.equipoPrincipal && this.equipoPrincipal.serial) ? this.equipoPrincipal.serial : serialUltimoIngreso;
      if (serialPrincipal) {
        this.userHistoryRecords = this.userHistoryRecords.filter(r => r.serial === serialPrincipal);
      }
      
      console.log(`📋 Mostrando historial (equipo principal) de ${record.usuario}: ${this.userHistoryRecords.length} registros`);
      this.showModal = true;
    },

    // 🔹 Obtener equipos del usuario
    async obtenerEquiposUsuario(documento) {
      try {
        const token = localStorage.getItem('token');
        const timestamp = new Date().getTime();
        const response = await fetch(
          getApiUrl(`api/equipos/usuario/${documento}?t=${timestamp}`),
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          // Determinar equipo principal y otros equipos (prioriza 'data.equipo' si existe)
          if (data.equipo && data.equipo.serial) {
            this.equipoPrincipal = data.equipo;
            this.otrosEquipos = Array.isArray(data.equipos)
              ? data.equipos.filter(e => e && e.serial !== data.equipo.serial)
              : [];
          } else if (Array.isArray(data.equipos) && data.equipos.length > 0) {
            // Usar el primer elemento del array como principal y el resto como otros
            this.equipoPrincipal = data.equipos[0];
            this.otrosEquipos = data.equipos.slice(1);
          } else {
            this.equipoPrincipal = null;
            this.otrosEquipos = [];
          }
          
          console.log(`📱 Equipo principal:`, this.equipoPrincipal);
          console.log(`📱 Otros equipos (${this.otrosEquipos.length}):`, this.otrosEquipos);
        } else {
          console.error('Error obteniendo equipos del usuario');
          this.equipoPrincipal = null;
          this.otrosEquipos = [];
        }
      } catch (error) {
        console.error('Error obteniendo equipos:', error);
        this.equipoPrincipal = null;
        this.otrosEquipos = [];
      }
    },

    // 🔹 Abrir modal de otros equipos
    abrirModalOtrosEquipos() {
      this.showOtrosEquiposModal = true;
    },

    // 🔹 Cerrar modal de otros equipos
    cerrarModalOtrosEquipos() {
      this.showOtrosEquiposModal = false;
    },

    // 🔹 Abrir historial de equipo específico
    async abrirHistorialEquipo(equipo) {
      this.equipoSeleccionado = equipo;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(
          getApiUrl(`api/historial/equipo/${equipo.serial}`),
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          // Formatear los datos del historial del equipo
          this.historialEquipoSeleccionado = data.map(record => ({
            id: record._id,
            entrada: record.entrada,
            entradaFormateada: this.formatearFecha(record.entrada),
            salida: record.salida,
            salidaFormateada: record.salida ? this.formatearFecha(record.salida) : null,
            nombreGuardia: record.guardia?.nombre || 'N/A',
            estado: record.estado || 'N/A',
            tipo: this.determinarTipo(record),
            fechaCreacion: record.createdAt
          })).sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion));
          
          console.log(`📋 Historial del equipo ${equipo.serial}: ${this.historialEquipoSeleccionado.length} registros`);
        } else {
          console.error('Error obteniendo historial del equipo');
          this.historialEquipoSeleccionado = [];
        }
      } catch (error) {
        console.error('Error obteniendo historial del equipo:', error);
        this.historialEquipoSeleccionado = [];
      }
      
      this.cerrarModalOtrosEquipos();
      this.showHistorialEquipoModal = true;
    },

    // 🔹 Cerrar modal de historial de equipo
    cerrarHistorialEquipoModal() {
      this.showHistorialEquipoModal = false;
      this.equipoSeleccionado = null;
      this.historialEquipoSeleccionado = [];
    },

    closeUserModal() {
      this.showModal = false;
      this.selectedUser = null;
      this.userHistoryRecords = [];
      this.equipoPrincipal = null;
      this.otrosEquipos = [];
      this.cerrarModalOtrosEquipos();
      this.cerrarHistorialEquipoModal();
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
  max-height: 60vh; /* Altura máxima para asegurar scroll */
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

/* 🔹 Estilos mejorados para información del equipo principal */
.equipo-principal-info {
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-bottom: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 16px 16px 0 0;
  position: relative;
  overflow: hidden;
}

.equipo-principal-info::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
}

.equipo-principal-info h4 {
  margin: 0 0 1.5rem 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.equipo-principal-info h4::before {
  content: '🖥️';
  font-size: 1.5rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.equipo-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.equipo-detail-item {
  font-size: 0.95rem;
  color: #475569;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.equipo-detail-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: linear-gradient(180deg, #3b82f6, #8b5cf6);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.equipo-detail-item:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(59, 130, 246, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.15);
}

.equipo-detail-item:hover::before {
  opacity: 1;
}

.equipo-detail-item strong {
  color: #1e293b;
  margin-right: 0.75rem;
  font-weight: 600;
  display: inline-block;
}

.accesorio-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1d4ed8;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-right: 0.75rem;
  margin-top: 0.25rem;
  border: 1px solid rgba(29, 78, 216, 0.2);
  box-shadow: 0 2px 8px rgba(29, 78, 216, 0.1);
  transition: all 0.3s ease;
}

.accesorio-badge:hover {
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
  color: white;
  transform: scale(1.05);
}

.otros-equipos-section {
  margin-top: 1.5rem;
  text-align: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.btn-otros-equipos {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 12px;
  padding: 1rem 2rem;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  position: relative;
  overflow: hidden;
}

.btn-otros-equipos::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.btn-otros-equipos:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
}

.btn-otros-equipos:hover::before {
  left: 100%;
}

/* 🔹 Modal de tamaño medio mejorado */
.modal-content-medium {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  width: 90vw;
  max-width: 750px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);
}

/* 🔹 Lista de otros equipos mejorada con efectos avanzados */
.otros-equipos-list {
  padding: 2rem;
  max-height: 65vh;
  overflow-y: auto;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  position: relative;
}

.otros-equipos-list::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

.otros-equipos-list::-webkit-scrollbar {
  width: 10px;
}

.otros-equipos-list::-webkit-scrollbar-track {
  background: rgba(148, 163, 184, 0.1);
  border-radius: 6px;
  margin: 0.5rem 0;
}

.otros-equipos-list::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #3b82f6, #8b5cf6);
  border-radius: 6px;
  border: 2px solid transparent;
  background-clip: content-box;
  transition: all 0.3s ease;
}

.otros-equipos-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #2563eb, #7c3aed);
}

.equipo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.equipo-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
}

.equipo-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.equipo-item:hover {
  border-color: rgba(59, 130, 246, 0.4);
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.25);
  transform: translateY(-6px) scale(1.02);
}

.equipo-item:hover::before {
  opacity: 1;
}

.equipo-item:hover::after {
  opacity: 1;
}

.equipo-info {
  position: relative;
  z-index: 2;
  flex: 1;
}

.equipo-info h4 {
  margin: 0 0 1rem 0;
  color: #1e293b;
  font-size: 1.2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

.equipo-info h4::before {
  content: '💻';
  font-size: 1.4rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
  transition: transform 0.3s ease;
}

.equipo-item:hover .equipo-info h4::before {
  transform: scale(1.1) rotate(5deg);
}

.equipo-info p {
  margin: 0.6rem 0;
  font-size: 0.95rem;
  color: #64748b;
  font-weight: 500;
  padding: 0.4rem 0.8rem;
  background: rgba(248, 250, 252, 0.8);
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  transition: all 0.3s ease;
}

.equipo-info p:hover {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
}

.equipo-info p strong {
  color: #374151;
  font-weight: 600;
  margin-right: 0.5rem;
}

.accesorios {
  margin-top: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.equipo-action {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
}

.ver-historial {
  color: #3b82f6;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 1rem 2rem;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15);
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.ver-historial::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  transition: left 0.6s ease;
}

.equipo-item:hover .ver-historial {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  transform: scale(1.08);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.4);
}

.equipo-item:hover .ver-historial::before {
  left: 100%;
}

.no-otros-equipos {
  text-align: center;
  color: #64748b;
  font-style: italic;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 20px;
  border: 2px dashed rgba(148, 163, 184, 0.3);
  font-size: 1.1rem;
  font-weight: 500;
  position: relative;
  overflow: hidden;
}

.no-otros-equipos::before {
  content: '📦';
  display: block;
  font-size: 4rem;
  margin-bottom: 1.5rem;
  opacity: 0.6;
  filter: grayscale(0.3);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* 🔹 Modal de historial individual mejorado con efectos avanzados */
.modal-content-large {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 24px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
  width: 95vw;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(20px);
  position: relative;
}

.modal-content-large::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.02) 0%, rgba(139, 92, 246, 0.02) 100%);
  pointer-events: none;
}

.modal-header {
  padding: 2.5rem;
  background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  color: white;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.modal-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
  background-size: 200% 100%;
  animation: shimmer 3s ease-in-out infinite;
}

.modal-header::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.modal-header:hover::after {
  opacity: 1;
}

.modal-header h3 {
  margin: 0 0 1.5rem 0;
  font-size: 1.6rem;
  font-weight: 700;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 2;
}

.modal-header h3::before {
  content: '📊';
  font-size: 1.8rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.modal-user-info {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1.5rem;
  font-size: 0.95rem;
  opacity: 0.95;
  position: relative;
  z-index: 2;
}

.modal-user-info span {
  background: rgba(255, 255, 255, 0.15);
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.modal-user-info span::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s ease;
}

.modal-user-info span:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.modal-user-info span:hover::before {
  left: 100%;
}

/* 🔹 Responsive mejorado para equipos */
@media (max-width: 768px) {
  .equipo-details {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .equipo-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
    padding: 1.25rem;
  }
  
  .equipo-action {
    align-self: stretch;
    justify-content: center;
  }
  
  .modal-content-medium,
  .modal-content-large {
    width: 95vw;
    margin: 1rem;
  }
  
  .modal-header {
    padding: 1.5rem;
  }
  
  .modal-user-info {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .otros-equipos-list {
    padding: 1.5rem;
  }
  
  .equipo-principal-info {
    padding: 1.5rem;
  }
  
  .btn-otros-equipos {
    padding: 0.875rem 1.5rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .equipo-principal-info h4 {
    font-size: 1.1rem;
  }
  
  .equipo-info h4 {
    font-size: 1rem;
  }
  
  .modal-header h3 {
    font-size: 1.25rem;
  }
  
  .equipo-detail-item {
    padding: 0.625rem 0.875rem;
    font-size: 0.875rem;
  }
}

.equipo-detail-item {
  padding: 0.625rem 0.875rem;
  font-size: 0.875rem;
}

.equipo-principal-info h4 {
  margin: 0 0 1rem 0;
  color: #1565c0;
  font-size: 1.1rem;
  font-weight: 600;
}

.equipo-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.equipo-detail-item {
  font-size: 0.9rem;
  color: #555;
}

.equipo-detail-item strong {
  color: #333;
  margin-right: 0.5rem;
}

.accesorio-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-right: 0.5rem;
}

.otros-equipos-section {
  margin-top: 1rem;
  text-align: center;
}

.btn-otros-equipos {
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(40, 167, 69, 0.3);
}

.btn-otros-equipos:hover {
  background: linear-gradient(135deg, #218838 0%, #1e7e34 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
}

.equipo-item:hover {
  border-color: #1565c0;
  box-shadow: 0 4px 12px rgba(21, 101, 192, 0.15);
  transform: translateY(-2px);
}

.equipo-info h4 {
  margin: 0 0 0.5rem 0;
  color: #1565c0;
  font-size: 1rem;
  font-weight: 600;
}

.equipo-info p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: #666;
}

.accesorios {
  margin-top: 0.5rem;
}

.equipo-action {
  display: flex;
  align-items: center;
}

.ver-historial {
  color: #1565c0;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 1rem;
  background: #e3f2fd;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.equipo-item:hover .ver-historial {
  background: #1565c0;
  color: white;
}