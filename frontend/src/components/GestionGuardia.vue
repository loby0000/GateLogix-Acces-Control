<template>
  <div class="container">
    <div class="logo">
      <img :src="logoUrl" alt="GateLogix Logo" />
    </div>
    
    <div class="controls">
      <input 
        v-model="search" 
        type="text" 
        placeholder="Buscar por documento..." 
        class="search-input"
      />
      <div class="filter-actions">
        <label class="activo-label">
          <input 
            v-model="filtroActivo" 
            type="checkbox"
          />
          Solo activos
        </label>
        <button 
          class="btn-reload" 
          @click="recargarTodo" 
          :disabled="cargando"
          title="Recargar toda la información"
        >
          <i class="fas fa-sync-alt" :class="{ 'fa-spin': cargando }" style="color: #333;"></i>
        </button>
        <button 
          class="btn-dashboard" 
          @click="irAlDashboard" 
          title="Ir al Dashboard"
        >
          <i class="fas fa-tachometer-alt" style="color: #333;"></i>
        </button>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Documento</th>
          <th>Nombre</th>
          <th>Jornada</th>
          <th>Registros</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="cargando">
              <td colspan="6" class="text-center estado-mensaje">
                <div class="loading-spinner"></div>
                <p class="mensaje-animado">Cargando guardias...</p>
              </td>
            </tr>
            <tr v-else-if="error">
              <td colspan="6" class="text-center text-danger estado-mensaje">
                <i class="fas fa-exclamation-triangle error-icon"></i>
                <p class="mensaje-animado">{{ error }}</p>
                <button class="btn-retry" @click="cargarGuardias">Reintentar</button>
              </td>
            </tr>
            <tr v-else-if="usuarios.length === 0">
              <td colspan="6" class="text-center estado-mensaje">
                <i class="fas fa-info-circle info-icon"></i>
                <p class="mensaje-animado">No hay guardias registrados</p>
              </td>
            </tr>
        <tr v-for="usuario in usuariosFiltrados" :key="usuario._id || usuario.documento" :class="{ 'fila-inactiva': !usuario.activo }">
          <td>{{ usuario.documento }}</td>
          <td>{{ usuario.nombre }}</td>
          <td>{{ usuario.jornada }}</td>
          <td>
            <span class="registros-container">
              {{ usuario.registros }}
            </span>
          </td>
          <td>
            <span 
              :class="['badge', usuario.activo ? 'activo' : 'inactivo', 
                     (actualizandoEstado && guardiaEnActualizacion === usuario._id) ? 'badge-loading' : '']"
              @click="cambiarEstado(usuario)"
              style="cursor: pointer;"
            >
              <span v-if="actualizandoEstado && guardiaEnActualizacion === usuario._id" class="badge-spinner"></span>
              {{ usuario.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </td>
          <td>
            <button @click="abrirModal(usuario)" class="editar-btn">
              Editar
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Modal de edición -->
    <div v-if="modalVisible" class="modal-overlay" @click="cerrarModal">
      <div class="modal-content" @click.stop>
        <h3>Editar Usuario</h3>
        
        <div class="modal-field">
          <label>Documento:</label>
          <input v-model="usuarioEdit.documento" disabled />
        </div>
        
        <div class="modal-field">
          <label>Nombre:</label>
          <input v-model="usuarioEdit.nombre" />
        </div>
        
        <div class="jornada-field">
          <label>Jornada:</label>
          <select v-model="usuarioEdit.jornada">
            <option value="Mañana">Mañana</option>
            <option value="Tarde">Tarde</option>
            <option value="Noche">Noche</option>
            <option value="Mixta">Mixta</option>
          </select>
        </div>
        
        <div class="modal-actions">
          <button @click="cerrarModal" class="editar-btn" style="background: #ccc; color: #333;">
            Cancelar
          </button>
          <button @click="verificarCambioEstado" class="editar-btn">
            Guardar
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal de confirmación para cambio de estado -->
    <div v-if="confirmacionVisible" class="modal-overlay">
      <div class="modal-content modal-confirmacion" @click.stop>
        <h3>Confirmar cambio de estado</h3>
        
        <p class="mensaje-confirmacion">
          ¿Está seguro que desea cambiar el estado del guardia <strong>{{ usuarioEdit.nombre }}</strong> de
          <strong>{{ estadoOriginal ? 'ACTIVO' : 'INACTIVO' }}</strong> a 
          <strong>{{ usuarioEdit.activo ? 'ACTIVO' : 'INACTIVO' }}</strong>?
        </p>
        
        <div class="modal-actions">
          <button @click="cancelarCambioEstado" class="editar-btn" style="background: #ccc; color: #333;">
            Cancelar
          </button>
          <button @click="mostrarModalAdmin" class="editar-btn">
            Confirmar
          </button>
        </div>
      </div>
    </div>
    
    <!-- Modal de autenticación de administrador -->
    <div v-if="adminModalVisible" class="modal-overlay">
      <div class="modal-content admin-auth-modal" @click.stop>
        <h3>Autenticación de Administrador</h3>
        
        <p class="mensaje-confirmacion">
          Se requieren credenciales de administrador para cambiar el estado del guardia.
        </p>
        
        <div class="modal-field">
          <label>Usuario:</label>
          <input v-model="adminCredentials.username" type="text" placeholder="Usuario administrador" />
        </div>
        
        <div class="modal-field">
          <label>Contraseña:</label>
          <input v-model="adminCredentials.password" type="password" placeholder="Contraseña" />
        </div>
        
        <p v-if="authError" class="auth-error">{{ authError }}</p>
        
        <div class="modal-actions">
          <button @click="cancelarAuthAdmin" class="editar-btn" style="background: #ccc; color: #333;">
            Cancelar
          </button>
          <button @click="verificarCredencialesAdmin" class="editar-btn" :disabled="authLoading">
            <span v-if="authLoading" class="badge-spinner"></span>
            Verificar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import logoUrl from '../assets/logo.png';
import guardiaService from '../services/guardiaService.js';
import adminService from '../services/adminService.js';
import { useToast } from 'vue-toastification';

export default {
  name: "GateLogixTable",
  setup() {
    const toast = useToast();
    return { toast };
  },
  data() {
    return {
      search: "",
      filtroActivo: false,
      usuarios: [],
      cargando: false,
      error: null,
      cargaInicial: true,
      actualizandoEstado: false,
      guardiaEnActualizacion: null,
      paginacion: {
        pagina: 1,
        limite: 10,
        total: 0,
        totalPaginas: 0
      },
      modalVisible: false,
      confirmacionVisible: false,
      adminModalVisible: false,
      authLoading: false,
      authError: null,
      adminCredentials: {
        username: '',
        password: ''
      },
      usuarioEdit: {},
      estadoOriginal: null,
      logoUrl,
    };
  },
  computed: {
    usuariosFiltrados() {
      return this.usuarios.filter((u) => {
        const filtroDocumento = u.documento.includes(this.search);
        const filtroAct = !this.filtroActivo || (u.estado === 'activo');
        return filtroDocumento && filtroAct;
      });
    },
  },
  created() {
    // Cargar guardias cuando el componente se monte
    this.recargarTodo();
    
    // Escuchar evento de actualización de guardias
    document.addEventListener('guardias-actualizados', this.cargarGuardias);
    // También escuchar el evento desde window para compatibilidad con otros componentes
    window.addEventListener('guardias-actualizados', this.cargarGuardias);
    
    // Escuchar evento específico de actualización de registros
    document.addEventListener('registros-actualizados', this.actualizarRegistrosGuardia);
    window.addEventListener('registros-actualizados', this.actualizarRegistrosGuardia);
    
    // Añadir evento para recargar cuando la página se refresca
    window.addEventListener('load', this.recargarTodo);
  },
  
  unmounted() {
    // Eliminar los event listeners cuando el componente se desmonte
    document.removeEventListener('guardias-actualizados', this.cargarGuardias);
    window.removeEventListener('guardias-actualizados', this.cargarGuardias);
    document.removeEventListener('registros-actualizados', this.actualizarRegistrosGuardia);
    window.removeEventListener('registros-actualizados', this.actualizarRegistrosGuardia);
    window.removeEventListener('load', this.recargarTodo);
  },
  methods: {
    async cargarGuardias() {
      this.cargando = true;
      this.error = null;
      try {
        // Forzar refresco desde el servidor sin usar caché
        const timestamp = new Date().getTime();
        const resultado = await guardiaService.listarGuardias(
          this.paginacion.pagina, 
          this.paginacion.limite,
          timestamp
        );
        
        if (!resultado || !resultado.guardias) {
          throw new Error('Formato de respuesta inválido');
        }
        
        console.log('Guardias cargados desde el servidor:', resultado.guardias);
        
        this.usuarios = resultado.guardias.map(guardia => ({
          ...guardia,
          // Mapear estado a activo para mantener compatibilidad con el código existente
          activo: guardia.estado === 'activo',
          // Usar el campo de registros real de la base de datos
          registros: guardia.registros || 0
        }));
        
        console.log('Guardias procesados para la UI:', this.usuarios);
        
        if (resultado.pagination) {
          this.paginacion.total = resultado.pagination.total || 0;
          this.paginacion.totalPaginas = resultado.pagination.pages || 1;
        }
        
        // Mostrar mensaje de éxito solo si es una recarga manual (no al cargar inicialmente)
        if (this.usuarios.length > 0 && !this.cargaInicial) {
          this.toast.success(`${this.usuarios.length} guardias cargados correctamente`);
        }
        
        this.cargaInicial = false;
      } catch (error) {
        let mensajeError = 'Error al cargar guardias';
        
        if (error.response) {
          // Error de respuesta del servidor
          if (error.response.status === 401) {
            mensajeError = 'Sesión expirada. Por favor, inicie sesión nuevamente';
          } else if (error.response.status === 403) {
            mensajeError = 'No tiene permisos para ver esta información';
          } else if (error.response.data && error.response.data.message) {
            mensajeError = error.response.data.message;
          }
        } else if (error.request) {
          // Error de red (no se recibió respuesta)
          mensajeError = 'No se pudo conectar con el servidor. Verifique su conexión';
        }
        
        this.error = mensajeError;
        this.toast.error(mensajeError);
        console.error('Error al cargar guardias:', error);
      } finally {
        this.cargando = false;
      }
    },
    
    // Método para recargar toda la información
    async recargarTodo() {
      // Ya no reiniciamos las variables de estado para mantener los filtros actuales
      // Solo actualizamos la información de la base de datos
      
      // Forzar limpieza de caché en el servidor
      try {
        this.cargando = true;
        // Forzar refresco desde el servidor sin usar caché
        const timestamp = new Date().getTime();
        const resultado = await guardiaService.listarGuardias(
          this.paginacion.pagina, 
          this.paginacion.limite,
          timestamp
        );
        
        if (!resultado || !resultado.guardias) {
          throw new Error('Formato de respuesta inválido');
        }
        
        console.log('Guardias recargados con timestamp:', timestamp);
        
        this.usuarios = resultado.guardias.map(guardia => ({
          ...guardia,
          // Mapear estado a activo para mantener compatibilidad con el código existente
          activo: guardia.estado === 'activo',
          // Usar el campo de registros real de la base de datos
          registros: guardia.registros || 0
        }));
        
        if (resultado.pagination) {
          this.paginacion.total = resultado.pagination.total || 0;
          this.paginacion.totalPaginas = resultado.pagination.pages || 1;
        }
        
        // Mostrar mensaje de éxito
        this.toast.success("Información actualizada correctamente");
      } catch (error) {
        let mensajeError = 'Error al recargar información';
        
        if (error.response && error.response.data && error.response.data.message) {
          mensajeError = error.response.data.message;
        }
        
        this.error = mensajeError;
        this.toast.error(mensajeError);
        console.error('Error al recargar información:', error);
      } finally {
        this.cargando = false;
      }
    },
    
    // Método para ir al dashboard
    irAlDashboard() {
      this.$router.push('/dashboard');
    },
    
    // Método para actualizar solo los registros de un guardia específico
    actualizarRegistrosGuardia(event) {
      // Verificar si el evento tiene los datos necesarios
      if (!event || !event.detail || !event.detail.guardiaId) {
        console.warn('Evento de actualización de registros sin datos necesarios');
        return;
      }
      
      const { guardiaId, registros } = event.detail;
      
      // Buscar el guardia en la lista local
      const idx = this.usuarios.findIndex(u => u._id === guardiaId);
      if (idx !== -1) {
        // Actualizar solo el contador de registros
        this.usuarios[idx].registros = registros;
        // Forzar actualización de la vista
        this.usuarios = [...this.usuarios];
        console.log(`Registros actualizados para guardia ${guardiaId}: ${registros}`);
      } else {
        console.warn(`No se encontró el guardia ${guardiaId} en la lista local`);
      }
    },
    abrirModal(usuario) {
      this.usuarioEdit = { ...usuario };
      this.estadoOriginal = usuario.activo;
      this.modalVisible = true;
    },
    cerrarModal() {
      this.modalVisible = false;
    },
    cambiarEstado(usuario) {
      // Evitar cambios si hay una actualización en curso
      if (this.actualizandoEstado) {
        return;
      }
      
      // Preparar el usuario para cambiar su estado
      this.usuarioEdit = { ...usuario };
      this.usuarioEdit.activo = !usuario.activo; // Invertir el estado
      this.estadoOriginal = usuario.activo;
      this.confirmacionVisible = true; // Mostrar modal de confirmación
      console.log('Cambiando estado de usuario:', this.usuarioEdit);
    },
    verificarCambioEstado() {
      // Ya no verificamos cambios de estado, guardamos directamente
      this.guardarUsuario();
    },
    cancelarCambioEstado() {
      // Restaurar el estado original
      this.usuarioEdit.activo = this.estadoOriginal;
      this.confirmacionVisible = false;
    },
    mostrarModalAdmin() {
      // Ocultar modal de confirmación y mostrar modal de autenticación
      this.confirmacionVisible = false;
      this.adminModalVisible = true;
      this.adminCredentials = { username: '', password: '' };
      this.authError = null;
    },
    cancelarAuthAdmin() {
      // Cancelar autenticación y restaurar estado original
      this.adminModalVisible = false;
      this.usuarioEdit.activo = this.estadoOriginal;
      this.adminCredentials = { username: '', password: '' };
      this.authError = null;
    },
    async verificarCredencialesAdmin() {
      // Validar que se hayan ingresado credenciales
      if (!this.adminCredentials.username || !this.adminCredentials.password) {
        this.authError = 'Por favor ingrese usuario y contraseña';
        return;
      }
      
      this.authLoading = true;
      this.authError = null;
      
      try {
        // Eliminar espacios en blanco
        const username = this.adminCredentials.username.trim();
        const password = this.adminCredentials.password.trim();
        
        console.log('Verificando credenciales con el backend:', username);
        
        // Usar el servicio de administrador para verificar las credenciales
        const resultado = await adminService.verificarCredenciales(username, password);
        
        if (resultado.success) {
          console.log('Credenciales verificadas correctamente');
          // Credenciales correctas, proceder con el cambio de estado
          this.adminModalVisible = false;
          this.guardarUsuario();
          this.adminCredentials = { username: '', password: '' };
        } else {
          console.log('Credenciales incorrectas:', resultado.error);
          // Credenciales incorrectas
          this.authError = resultado.error || 'Credenciales incorrectas. Inténtelo nuevamente.';
        }
      } catch (error) {
        this.authError = 'Error al verificar credenciales. Inténtelo nuevamente.';
        console.error('Error al verificar credenciales:', error);
      } finally {
        this.authLoading = false;
      }
    },
    confirmarCambioEstado() {
      // Este método se mantiene por compatibilidad, pero ahora usamos mostrarModalAdmin
      this.mostrarModalAdmin();
    },
    async guardarUsuario() {
      try {
        // Guardar el nombre del guardia antes de cualquier operación
        const nombreGuardia = this.usuarioEdit.nombre;
        
        // Establecer estado de actualización
        this.actualizandoEstado = true;
        this.guardiaEnActualizacion = this.usuarioEdit._id;
        
        console.log('Guardando usuario:', nombreGuardia);
        
        // Primero actualizamos el estado si ha cambiado
        if (this.usuarioEdit.activo !== this.estadoOriginal) {
          const nuevoEstado = this.usuarioEdit.activo ? 'activo' : 'inactivo';
          console.log(`Actualizando estado a: ${nuevoEstado}`);
          await guardiaService.actualizarEstado(this.usuarioEdit._id, nuevoEstado);
        }
        
        // Luego actualizamos nombre y jornada
        const datosActualizados = {
          nombre: this.usuarioEdit.nombre,
          jornada: this.usuarioEdit.jornada
        };
        
        // Usar el servicio para actualizar nombre y jornada
        const respuesta = await guardiaService.actualizarGuardia(this.usuarioEdit._id, datosActualizados);
        
        console.log('Respuesta del servidor:', respuesta);
        
        // Actualizar el usuario en la lista local
        const idx = this.usuarios.findIndex(u => u._id === this.usuarioEdit._id);
        if (idx !== -1) {
          this.usuarios[idx] = { 
            ...this.usuarios[idx],
            nombre: this.usuarioEdit.nombre,
            jornada: this.usuarioEdit.jornada,
            activo: respuesta.guardia.estado === 'activo',
            estado: respuesta.guardia.estado
          };
          // Forzar actualización de la vista
          this.usuarios = [...this.usuarios];
        }
        
        // Emitir evento para asegurar que otros componentes se actualicen
        const guardiasActualizadosEvent = new CustomEvent('guardias-actualizados');
        document.dispatchEvent(guardiasActualizadosEvent);
        window.dispatchEvent(guardiasActualizadosEvent);
        
        // Mostrar mensaje de éxito
        const mensaje = `Guardia ${nombreGuardia} actualizado correctamente`;
        
        this.toast.success(mensaje);
        
        // Ya no necesitamos recargar toda la lista, el evento registros-actualizados se encarga de actualizar la vista
        // El evento ya contiene la información actualizada del registro
      } catch (error) {
        let mensajeError = 'Error al actualizar el estado del guardia';
        
        if (error.response) {
          if (error.response.status === 401) {
            mensajeError = 'Sesión expirada. Por favor, inicie sesión nuevamente';
          } else if (error.response.status === 403) {
            mensajeError = 'No tiene permisos para actualizar guardias';
          } else if (error.response.data && error.response.data.message) {
            mensajeError = error.response.data.message;
          }
        } else if (error.request) {
          mensajeError = 'No se pudo conectar con el servidor. Verifique su conexión';
        }
        
        this.toast.error(mensajeError);
        console.error('Error al actualizar guardia:', error);
      } finally {
        this.actualizandoEstado = false;
        this.guardiaEnActualizacion = null;
        this.cerrarModal();
        this.confirmacionVisible = false; // Asegurar que el modal de confirmación también se cierre
      }
    },
    async incrementarRegistros(usuario) {
      try {
        // Llamar a la API para incrementar registros
        const respuesta = await guardiaService.incrementarRegistros(usuario._id);
        
        // Actualizar el usuario en la lista local
        const idx = this.usuarios.findIndex(u => u._id === usuario._id);
        if (idx !== -1) {
          this.usuarios[idx].registros = respuesta.guardia.registros;
          // Forzar actualización de la vista
          this.usuarios = [...this.usuarios];
        }
        
        // Mostrar mensaje de éxito
        this.toast.success(`Registro incrementado para ${usuario.nombre}`);
        
        // Emitir evento específico para actualización de registros
        const registrosActualizadosEvent = new CustomEvent('registros-actualizados', {
          detail: { guardiaId: usuario._id, registros: respuesta.guardia.registros }
        });
        document.dispatchEvent(registrosActualizadosEvent);
        window.dispatchEvent(registrosActualizadosEvent);
        
        // También emitir el evento general para compatibilidad
        const guardiasActualizadosEvent = new CustomEvent('guardias-actualizados');
        document.dispatchEvent(guardiasActualizadosEvent);
        window.dispatchEvent(guardiasActualizadosEvent);
        
        // Ya no necesitamos recargar toda la lista, el evento registros-actualizados se encarga de actualizar la vista
        // El evento ya contiene la información actualizada del registro
      } catch (error) {
        let mensajeError = 'Error al incrementar registros';
        
        if (error.response) {
          if (error.response.status === 401) {
            mensajeError = 'Sesión expirada. Por favor, inicie sesión nuevamente';
          } else if (error.response.status === 403) {
            mensajeError = 'No tiene permisos para esta acción';
          } else if (error.response.data && error.response.data.message) {
            mensajeError = error.response.data.message;
          }
        } else if (error.request) {
          mensajeError = 'No se pudo conectar con el servidor. Verifique su conexión';
        }
        
        this.toast.error(mensajeError);
        console.error('Error al incrementar registros:', error);
      }
    },
  },
};
</script>

<style scoped>
.container {
  max-width: 1600px;
  margin: 30px auto;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  padding: 0 20px;
  animation: fadeIn 0.6s ease-out;
  color: #333;
}

.logo {
  text-align: center;
  margin-bottom: 25px;
}

.logo img {
  height: 80px;
  max-width: 380px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
  filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s ease;
}

.logo img:hover {
  transform: scale(1.02);
}

.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.search-input {
  width: 320px;
  max-width: 100%;
  background-color: #333;
  border-radius: 10px;
  border: none;
  height: 45px;
  padding-left: 15px;
  color: #bbb;
  font-size: 1rem;
  margin-right: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.search-input:focus {
  outline: none;
  box-shadow: 0 3px 8px rgba(79, 110, 247, 0.3);
  background-color: #3a3a3a;
}

.search-input::placeholder {
  color: #bbb;
}

.activo-label {
  background: white;
  border-radius: 22px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: 700;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1rem;
  color: #222;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.activo-label:hover {
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.filter-actions {
  display: flex;
  align-items: center;
}

.btn-reload, .btn-dashboard {
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 8px;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  color: #333;
}

.btn-reload:hover, .btn-dashboard:hover {
  background-color: #e9ecef;
}

.btn-reload:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-dashboard {
  background-color: #f0f8ff;
}

.btn-dashboard:hover {
  background-color: #e0f0ff;
}

.fa-spin {
  animation: spin 1s linear infinite;
}

.activo-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

table {
  width: 100%;
  min-width: 1200px;
  border-collapse: separate;
  border-spacing: 0 10px;
  font-weight: 600;
  overflow-x: auto;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
  border-radius: 12px;
}

th, td {
  padding: 16px 12px;
  text-align: center;
  font-weight: 600;
  font-size: 1.05rem;
  transition: background-color 0.2s ease;
}

thead th {
  background: #fff;
  color: #333;
  border-bottom: 2px solid #4f6ef7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

tbody tr {
  background: #fff;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgb(7 7 7 / 0.06);
  vertical-align: middle;
  font-weight: 400;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.3s ease;
  animation: fadeIn 0.5s ease-out;
  color: #333;
}

tbody tr:nth-child(even):not(.fila-inactiva) {
  background-color: #f9fafc;
}

tbody tr:hover:not(.fila-inactiva) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgb(7 7 7 / 0.1);
  background-color: #f0f4ff;
}

.fila-inactiva {
  background: #f5f5f5;
  color: #888;
  opacity: 0.8;
  position: relative;
}

.fila-inactiva::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background-color: #ccc;
  border-top-left-radius: 15px;
  border-bottom-left-radius: 15px;
}

.text-center {
  text-align: center;
}

.text-danger {
  color: #dc3545;
}

.loading-spinner {
  display: inline-block;
  width: 36px;
  height: 36px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #4f6ef7;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.btn-retry {
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  margin-top: 12px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(52, 152, 219, 0.3);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-retry:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(52, 152, 219, 0.4);
}

.btn-retry:active {
  transform: translateY(0);
  box-shadow: 0 2px 3px rgba(52, 152, 219, 0.3);
}

.btn-retry::before {
  content: '\f2f1';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
}

.text-center p {
  margin: 8px 0;
}

.estado-mensaje {
  padding: 30px 0;
  animation: fadeIn 0.5s ease-out;
  color: #333;
}

.mensaje-animado {
  animation: slideInUp 0.5s ease-out;
  color: #333;
}

.error-icon {
  font-size: 2rem;
  color: #dc3545;
  margin-bottom: 10px;
  animation: shake 0.5s ease-in-out;
}

.info-icon {
  font-size: 2rem;
  color: #17a2b8;
  margin-bottom: 10px;
  animation: pulse 2s infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
}

tbody tr td {
  font-weight: 500;
  font-family: monospace;
  color: #333;
}

.badge {
  display: inline-block;
  text-align: center;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 0.9rem;
  color: #222;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  position: relative;
  letter-spacing: 0.5px;
}

.badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0,0,0,0.15);
}

.badge-loading {
  opacity: 0.7;
  pointer-events: none;
}

.badge-spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 5px;
}

.registros-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.incrementar-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.incrementar-btn:hover {
  background-color: #45a049;
  transform: scale(1.1);
}

.activo {
  background-color: #c2f0dc;
  color: #116a3b;
  background-image: linear-gradient(135deg, #c2f0dc, #a8e6c9);
}

.inactivo {
  background-color: #f6c4c4;
  color: #831212;
  background-image: linear-gradient(135deg, #f6c4c4, #f0b5b5);
}

.editar-input {
  border-radius: 15px;
  border: 1px solid #a9b1ff;
  height: 35px;
  width: 70px;
}

.editar-btn {
  background: #4f6ef7;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 10px 20px;
  font-weight: 700;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(79, 110, 247, 0.3);
}

.editar-btn:hover {
  background: #3550b2;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(79, 110, 247, 0.4);
}

.editar-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 3px rgba(79, 110, 247, 0.3);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 18px;
  padding: 28px 26px;
  min-width: 280px;
  max-width: 340px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
  animation: modalFadeIn 0.3s ease;
  color: #333;
}

@keyframes modalFadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
.modal-field {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1rem;
  justify-content: center;
  width: 100%;
  margin-bottom: 5px;
  color: #333;
}
.jornada-field {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  margin-bottom: 5px;
  color: #333;
}
.modal-field input[disabled] {
  background: #333;
  color: #bbb;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  width: 100%;
  font-family: monospace;
  letter-spacing: 0.5px;
}
.modal-field select,
.jornada-field select {
  border-radius: 8px;
  border: 1px solid #ccc;
  padding: 8px 14px;
  font-size: 1rem;
  width: 100%;
  background-color: #f9f9f9;
  transition: border-color 0.3s, box-shadow 0.3s;
  cursor: pointer;
}

.modal-field select:focus,
.jornada-field select:focus {
  outline: none;
  border-color: #4f6ef7;
  box-shadow: 0 0 0 2px rgba(79, 110, 247, 0.2);
}

.modal-field input:not([disabled]) {
  border-radius: 8px;
  border: 1px solid #ccc;
  padding: 8px 14px;
  font-size: 1rem;
  width: 100%;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.modal-field input:not([disabled]):focus {
  outline: none;
  border-color: #4f6ef7;
  box-shadow: 0 0 0 2px rgba(79, 110, 247, 0.2);
}
.modal-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  width: 100%;
  margin-top: 10px;
}

.modal-confirmacion {
  text-align: center;
  max-width: 380px;
  color: #333;
}

.mensaje-confirmacion {
  margin: 15px 0;
  font-size: 1.1rem;
}

.admin-auth-modal {
  max-width: 400px;
}

.auth-error {
  color: #dc3545;
  font-size: 0.9rem;
  margin-top: 10px;
  text-align: center;
  font-weight: 500;
  line-height: 1.6;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #4f6ef7;
}

.mensaje-confirmacion strong {
  font-weight: 700;
  color: #3550b2;
  padding: 0 3px;
}

h3 {
  font-weight: 700;
  color: #3550b2;
  margin-bottom: 10px;
}
</style>