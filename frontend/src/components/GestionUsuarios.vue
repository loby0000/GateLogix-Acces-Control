<template>
  <div class="app-container">
    <!-- Loading Overlay Profesional -->
    <div v-if="loading" class="loading-overlay-professional">
      <div class="loading-content-professional">
        <div class="loading-logo">
          <div class="pulse-ring"></div>
          <div class="pulse-ring delay-1"></div>
          <div class="pulse-ring delay-2"></div>
          <i class="fas fa-users loading-icon"></i>
        </div>
        <div class="loading-text-professional">
          <h3>Cargando Sistema de Gestión</h3>
          <p>Preparando datos de usuarios...</p>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Application Layout -->
    <div class="main-layout" v-if="!loading">
      <!-- Sidebar Navigation -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo-container">
            <img src="@/assets/logo.png" alt="Logo" class="sidebar-logo">
            <span class="brand-text">GateLogix</span>
          </div>
        </div>
        
        <nav class="sidebar-nav">
          <div class="nav-section">
            <h4 class="nav-title">Gestión</h4>
            <a href="#" class="nav-item active">
              <i class="fas fa-users"></i>
              <span>Usuarios</span>
            </a>
            <a href="#" class="nav-item" @click="goToDashboard">
              <i class="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </a>
          </div>
        </nav>
      </aside>

      <!-- Main Content Area -->
      <main class="main-content">
        <!-- Top Header Bar -->
        <header class="top-header">
          <div class="header-left">
            <h1 class="page-title">
              <i class="fas fa-users title-icon"></i>
              Gestión de Usuarios
            </h1>
            <p class="page-subtitle">Administra y controla el acceso de usuarios al sistema</p>
          </div>
          
          <div class="header-actions">
            <div class="search-container-modern">
              <i class="fas fa-search search-icon-modern"></i>
              <input 
                type="text" 
                v-model="searchQuery" 
                placeholder="Buscar usuarios, documentos, emails..."
                class="search-input-modern"
              >
              <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search-modern">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="filter-container">
              <select v-model="filtroTipo" class="filter-select-modern">
                <option value="">Todos los tipos</option>
                <option value="Estudiante">Estudiantes</option>
                <option value="Docente">Docentes</option>
                <option value="Administrativo">Administrativos</option>
              </select>
            </div>
          </div>
        </header>

        <!-- Stats Dashboard -->
        <section class="stats-dashboard">
          <div class="stats-grid">
            <div class="stat-card" v-for="(stat, index) in statsData" :key="index">
              <div class="stat-icon-container">
                <i :class="stat.icon" class="stat-icon"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ stat.value }}</div>
                <div class="stat-label">{{ stat.label }}</div>
                <div class="stat-change" :class="stat.changeType">
                  <i :class="stat.changeIcon"></i>
                  {{ stat.change }}
                </div>
              </div>
            </div>
          </div>
        </section>
    
    <!-- Mensajes de estado -->
    <div v-if="error" class="status-message error">
      <i class="status-icon">⚠️</i> {{ error }}
    </div>
    <div v-if="successMessage" class="status-message success">
      <i class="status-icon">✅</i> {{ successMessage }}
    </div>

    <!-- Tabla mejorada con cards responsivas -->
    <div class="table-section" v-if="!loading">
      <div class="table-header">
        <h2>Lista de Usuarios</h2>
        <div class="table-controls">
          <select class="filter-select" v-model="filtroTipo">
            <option value="">Todos los tipos</option>
            <option value="Estudiante">Estudiantes</option>
            <option value="Docente">Docentes</option>
            <option value="Administrativo">Administrativos</option>
          </select>
          <button class="export-btn">
            <i class="btn-icon">📥</i>
            Exportar
          </button>
        </div>
      </div>

      <!-- Vista de tabla para desktop -->
      <div class="table-container desktop-view">
        <table class="modern-table">
          <thead>
            <tr>
              <th class="photo-header">Foto</th>
              <th>Usuario</th>
              <th>Documento</th>
              <th>Contacto</th>
              <th>Equipo</th>
              <th>Accesorios</th>
              <th class="actions-header">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(usuario, idx) in usuariosFiltrados" :key="usuario._id || idx" class="table-row">
              <td class="photo-cell">
                <div class="photo-container">
                  <img v-if="usuario.foto" :src="usuario.foto" alt="Foto de usuario" class="user-photo" @click="mostrarImagenAmpliada(usuario.foto)" />
                  <div v-else class="no-photo">
                    <i class="photo-placeholder">👤</i>
                  </div>
                </div>
              </td>
              <td class="user-info-cell">
                <div class="user-info">
                  <h4>{{ usuario.nombre }}</h4>
                  <span class="user-type">{{ usuario.tipoUsuario }}</span>
                </div>
              </td>
              <td class="document-cell">
                <div class="document-info">
                  <span class="doc-type">{{ usuario.tipoDocumento }}</span>
                  <span class="doc-number">{{ usuario.numeroDocumento }}</span>
                </div>
              </td>
              <td class="contact-cell">
                <div class="contact-info">
                  <span class="email">{{ usuario.email }}</span>
                </div>
              </td>
              <td class="equipment-cell">
                <div class="equipment-info" v-if="usuario.marcaEquipo">
                  <span class="brand">{{ usuario.marcaEquipo }}</span>
                  <span class="serial">{{ usuario.serialEquipo }}</span>
                  <span class="specs">{{ usuario.caracteristicas }}</span>
                </div>
                <span v-else class="no-equipment">Sin equipo</span>
              </td>
              <td class="accessories-cell">
                <div class="accessories-grid">
                  <div class="accessory-item" :class="{ active: usuario.mouse }">
                    <i class="accessory-icon">🖱️</i>
                    <span>Mouse</span>
                  </div>
                  <div class="accessory-item" :class="{ active: usuario.cargador }">
                    <i class="accessory-icon">🔌</i>
                    <span>Cargador</span>
                  </div>
                </div>
              </td>
              <td class="actions-cell">
                <button class="edit-btn modern" @click="editItem(idx)">
                  <i class="btn-icon">✏️</i>
                  Editar
                </button>
              </td>
            </tr>
            <tr v-if="usuariosFiltrados.length === 0">
              <td colspan="7" class="no-results">
                <div class="empty-state">
                  <i class="empty-icon">🔍</i>
                  <h3>No se encontraron usuarios</h3>
                  <p>Intenta ajustar los filtros de búsqueda</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Vista de cards para móvil -->
      <div class="cards-container mobile-view">
        <div v-for="(usuario, idx) in usuariosFiltrados" :key="usuario._id || idx" class="user-card">
          <div class="card-header">
            <div class="card-photo">
              <img v-if="usuario.foto" :src="usuario.foto" alt="Foto de usuario" class="user-photo" @click="mostrarImagenAmpliada(usuario.foto)" />
              <div v-else class="no-photo">
                <i class="photo-placeholder">👤</i>
              </div>
            </div>
            <div class="card-user-info">
              <h4>{{ usuario.nombre }}</h4>
              <span class="user-type">{{ usuario.tipoUsuario }}</span>
            </div>
            <button class="card-edit-btn" @click="editItem(idx)">
              <i class="btn-icon">✏️</i>
            </button>
          </div>
          <div class="card-body">
            <div class="card-field">
              <label>Documento:</label>
              <span>{{ usuario.tipoDocumento }} - {{ usuario.numeroDocumento }}</span>
            </div>
            <div class="card-field">
              <label>Email:</label>
              <span>{{ usuario.email }}</span>
            </div>
            <div class="card-field" v-if="usuario.marcaEquipo">
              <label>Equipo:</label>
              <span>{{ usuario.marcaEquipo }} - {{ usuario.serialEquipo }}</span>
            </div>
            <div class="card-accessories">
              <div class="accessory-item" :class="{ active: usuario.mouse }">
                <i class="accessory-icon">🖱️</i>
                <span>Mouse</span>
              </div>
              <div class="accessory-item" :class="{ active: usuario.cargador }">
                <i class="accessory-icon">🔌</i>
                <span>Cargador</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Indicador de carga y botón para cargar más -->
    <div class="load-more-container">
      <div v-if="loading" class="loading-indicator">
        <div class="loading-dot-container">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
        <span>Cargando usuarios...</span>
      </div>
      <div v-if="loadingMore" class="loading-indicator">
        <div class="loading-dot-container">
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
          <div class="loading-dot"></div>
        </div>
        <span>Cargando más usuarios...</span>
      </div>
      <button 
        v-if="!loading && !loadingMore && pagination.page < pagination.pages" 
        @click="cargarMasUsuarios" 
        class="load-more-btn"
      >
        Cargar más usuarios
      </button>
      <div v-if="pagination.total > 0" class="pagination-info">
        Mostrando {{ usuarios.length }} de {{ pagination.total }} usuarios
      </div>
    </div>

    <!-- Modal para mostrar imagen ampliada -->
    <div v-if="imagenAmpliadaVisible" class="modal-overlay" @click="cerrarImagenAmpliada">
      <div class="imagen-ampliada-container" @click.stop>
        <img :src="imagenAmpliada" alt="Imagen ampliada" class="imagen-ampliada" />
        <button class="cerrar-imagen-btn" @click="cerrarImagenAmpliada">✕</button>
      </div>
    </div>
    
    <!-- Modal de edición corregido -->
    <div v-if="modalVisible" class="modal-overlay">
      <div class="modal-content">
        <h3>Editar Usuario</h3>
        <div class="modal-photo">
          <img v-if="usuarioEdit.foto" :src="usuarioEdit.foto" alt="Foto de usuario" class="edit-user-photo" />
          <div v-else class="no-photo-large">Sin foto</div>
          <button class="photo-btn" @click="mostrarOpcionesFoto = true">Cambiar foto</button>
        </div>
        <div class="modal-field">
          <label>Nombre</label>
          <input v-model="usuarioEdit.nombre" />
        </div>
        <div class="modal-field">
          <label>Tipo De Documento</label>
          <select v-model="usuarioEdit.tipoDocumento">
            <option value="Cédula De Ciudadanía">Cédula De Ciudadanía</option>
            <option value="Cédula De Extranjería">Cédula De Extranjería</option>
            <option value="Tarjeta De Identidad">Tarjeta De Identidad</option>
          </select>
        </div>
        <div class="modal-field">
          <label>Número de Documento</label>
          <input v-model="usuarioEdit.numeroDocumento" />
        </div>
        
        <!-- Modal para opciones de foto -->
        <div v-if="mostrarOpcionesFoto" class="foto-modal">
          <div class="foto-modal-content">
            <button @click="abrirCamara">Tomar Foto</button>
            <button @click="subirArchivo">Seleccionar Archivo</button>
            <button class="cerrar" @click="mostrarOpcionesFoto = false">Cancelar</button>
          </div>
        </div>
        
        <!-- Cámara -->
        <div v-if="mostrarCamara" class="camara-container">
          <video ref="video" autoplay></video>
          <button @click="capturarFoto">Capturar</button>
          <button @click="cerrarCamara">Cerrar</button>
        </div>
        <div class="modal-actions">
          <button class="save-btn" @click="guardarUsuario">Guardar</button>
          <button class="close-btn" @click="cerrarModal">Cerrar</button>
        </div>
      </div>
    </div>
      </main>
    </div>
  </div>
</template>

<script>
import { getApiUrl } from '../utils/apiConfig';

export default {
  data() {
    return {
      searchQuery: "",
      usuarios: [],
      modalVisible: false,
      usuarioEdit: {},
      usuarioEditIdx: null,
      loading: false,
      error: null,
      successMessage: null,
      mostrarOpcionesFoto: false,
      mostrarCamara: false,
      imagenAmpliadaVisible: false,
      imagenAmpliada: null,
      filtroTipo: "",
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
      },
      loadingMore: false,
      // Datos para las estadísticas dinámicas
      statsData: [
        {
          icon: 'fas fa-users',
          value: 0,
          label: 'Total Usuarios',
          change: '+12%',
          changeType: 'positive',
          changeIcon: 'fas fa-arrow-up'
        },
        {
          icon: 'fas fa-laptop',
          value: 0,
          label: 'Con Equipos',
          change: '+8%',
          changeType: 'positive',
          changeIcon: 'fas fa-arrow-up'
        },
        {
          icon: 'fas fa-user-graduate',
          value: 0,
          label: 'Estudiantes',
          change: '+15%',
          changeType: 'positive',
          changeIcon: 'fas fa-arrow-up'
        },
        {
          icon: 'fas fa-chalkboard-teacher',
          value: 0,
          label: 'Docentes',
          change: '+3%',
          changeType: 'positive',
          changeIcon: 'fas fa-arrow-up'
        }
      ]
    };
  },
  created() {
    this.cargarUsuariosConCache();
  },
  computed: {
    usuariosFiltrados() {
      let filtrados = this.usuarios;
      
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtrados = filtrados.filter(usuario => 
          (usuario.numeroDocumento && usuario.numeroDocumento.toLowerCase().includes(query)) ||
          (usuario.nombre && usuario.nombre.toLowerCase().includes(query)) ||
          (usuario.email && usuario.email.toLowerCase().includes(query))
        );
      }
      
      if (this.filtroTipo) {
        filtrados = filtrados.filter(usuario => 
          usuario.tipoUsuario === this.filtroTipo
        );
      }
      
      return filtrados;
    },
    
    usuariosConEquipo() {
      return this.usuarios.filter(usuario => usuario.marcaEquipo).length;
    }
  },
  methods: {
    cargarUsuariosConCache() {
      const cachedData = localStorage.getItem('usuariosCache');
      const cachedTimestamp = localStorage.getItem('usuariosCacheTimestamp');
      const currentTime = new Date().getTime();
      
      if (cachedData && cachedTimestamp && (currentTime - cachedTimestamp < 5 * 60 * 1000)) {
        try {
          const parsedData = JSON.parse(cachedData);
          this.usuarios = parsedData.usuarios;
          this.pagination = parsedData.pagination;
          console.log('Datos cargados desde caché');
          
          setTimeout(() => {
            this.cargarUsuarios();
          }, 1000);
        } catch (e) {
          console.error('Error al parsear caché:', e);
          this.cargarUsuarios();
        }
      } else {
        this.cargarUsuarios();
      }
    },
    
    validarFoto(foto) {
      if (foto && typeof foto === 'string' && foto.startsWith('data:image')) {
        console.log('Foto válida detectada en edición');
        return this.comprimirImagen(foto);
      } else if (foto) {
        console.log('Formato de foto no válido en edición:', typeof foto);
      }
      return null;
    },
    
    async comprimirImagen(base64Str) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const maxSize = 500;
          let width = img.width;
          let height = img.height;
          
          if (width > height && width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        
        img.src = base64Str;
      });
    },
    
    async cargarUsuarios(resetPage = true) {
      if (resetPage) {
        this.pagination.page = 1;
        this.loading = true;
      } else {
        this.loadingMore = true;
      }
      
      this.error = null;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        const url = new URL(getApiUrl('api/usuario-equipo/listar'));
        url.searchParams.append('page', this.pagination.page);
        url.searchParams.append('limit', this.pagination.limit);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error al cargar usuarios: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        this.pagination = data.pagination;
        
        if (resetPage) {
          this.usuarios = data.usuarios;
          
          try {
            const cacheData = {
              usuarios: data.usuarios,
              pagination: data.pagination
            };
            localStorage.setItem('usuariosCache', JSON.stringify(cacheData));
            localStorage.setItem('usuariosCacheTimestamp', new Date().getTime());
            console.log('Datos guardados en caché');
          } catch (e) {
            console.error('Error al guardar en caché:', e);
          }
        } else {
          this.usuarios = [...this.usuarios, ...data.usuarios];
        }
        
        // Actualizar estadísticas dinámicamente
        this.actualizarEstadisticas();
        
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        this.error = `Error al cargar usuarios: ${error.message}`;
      } finally {
        this.loading = false;
        this.loadingMore = false;
      }
    },
    
    cargarMasUsuarios() {
      if (this.pagination.page < this.pagination.pages && !this.loadingMore) {
        this.pagination.page += 1;
        this.cargarUsuarios(false);
      }
    },
    
    editItem(idx) {
      this.usuarioEdit = { ...this.usuariosFiltrados[idx] };
      this.usuarioEditIdx = this.usuarios.findIndex(u => u._id === this.usuarioEdit._id);
      this.modalVisible = true;
    },
    
    cerrarModal() {
      this.modalVisible = false;
      this.usuarioEdit = {};
      this.usuarioEditIdx = null;
    },
    
    abrirCamara() {
      this.mostrarCamara = true;
      this.mostrarOpcionesFoto = false;
      this.$nextTick(() => {
        navigator.mediaDevices.getUserMedia({ video: true })
          .then(stream => {
            if (this.$refs.video) {
              this.$refs.video.srcObject = stream;
            }
          })
          .catch(err => {
            console.error('Error al acceder a la cámara:', err);
            this.error = 'No se pudo acceder a la cámara';
            this.mostrarCamara = false;
          });
      });
    },

    async capturarFoto() {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = this.$refs.video.videoWidth;
        canvas.height = this.$refs.video.videoHeight;
        canvas.getContext("2d").drawImage(this.$refs.video, 0, 0);
        const fotoData = canvas.toDataURL("image/png");
        console.log('Foto capturada en edición:', fotoData.substring(0, 50) + '...');
        const fotoComprimida = await this.comprimirImagen(fotoData);
        this.usuarioEdit.foto = fotoComprimida;
        this.cerrarCamara();
      } catch (error) {
        console.error('Error al capturar foto:', error);
      }
    },

    cerrarCamara() {
      this.mostrarCamara = false;
      if (this.$refs.video && this.$refs.video.srcObject) {
        const stream = this.$refs.video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        this.$refs.video.srcObject = null;
      }
    },

    subirArchivo() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (event) => {
            const fotoData = event.target.result;
            console.log('Archivo seleccionado en edición:', fotoData.substring(0, 50) + '...');
            const fotoComprimida = await this.comprimirImagen(fotoData);
            this.usuarioEdit.foto = fotoComprimida;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
      this.mostrarOpcionesFoto = false;
    },

    async guardarUsuario() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }

        const fotoValidada = this.validarFoto(this.usuarioEdit.foto);
        if (fotoValidada) {
          this.usuarioEdit.foto = await fotoValidada;
        }

        const response = await fetch(getApiUrl(`api/usuario-equipo/actualizar/${this.usuarioEdit._id}`), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.usuarioEdit)
        });

        if (!response.ok) {
          throw new Error(`Error al actualizar usuario: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (this.usuarioEditIdx !== null) {
          this.usuarios[this.usuarioEditIdx] = { ...this.usuarioEdit };
        }

        this.successMessage = 'Usuario actualizado correctamente';
        this.cerrarModal();
        
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);

      } catch (error) {
        console.error('Error al guardar usuario:', error);
        this.error = `Error al guardar usuario: ${error.message}`;
        setTimeout(() => {
          this.error = null;
        }, 5000);
      }
    },

    mostrarImagenAmpliada(imagen) {
      this.imagenAmpliada = imagen;
      this.imagenAmpliadaVisible = true;
    },

    cerrarImagenAmpliada() {
      this.imagenAmpliadaVisible = false;
      this.imagenAmpliada = null;
    },

    goToDashboard() {
      this.$router.push('/dashboard');
    },

    // Método para actualizar estadísticas dinámicamente
    actualizarEstadisticas() {
      const totalUsuarios = this.usuarios.length;
      const usuariosConEquipo = this.usuarios.filter(u => u.marcaEquipo).length;
      const estudiantes = this.usuarios.filter(u => u.tipoUsuario === 'Estudiante').length;
      const docentes = this.usuarios.filter(u => u.tipoUsuario === 'Docente').length;

      // Actualizar valores con animación
      this.animarContador(0, totalUsuarios, (val) => {
        this.statsData[0].value = val;
      });
      
      this.animarContador(1, usuariosConEquipo, (val) => {
        this.statsData[1].value = val;
      });
      
      this.animarContador(2, estudiantes, (val) => {
        this.statsData[2].value = val;
      });
      
      this.animarContador(3, docentes, (val) => {
        this.statsData[3].value = val;
      });
    },

    // Método para animar contadores
    animarContador(index, targetValue, callback) {
      const duration = 1500;
      const startValue = this.statsData[index].value;
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Función de easing para suavizar la animación
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.round(startValue + (targetValue - startValue) * easeOutQuart);
        
        callback(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }
};
</script>

<style scoped>
/* Variables CSS Profesionales */
:root {
  --primary-color: #1e3a8a;
  --primary-light: #3b82f6;
  --primary-lighter: #60a5fa;
  --primary-lightest: #dbeafe;
  --accent-color: #1d4ed8;
  --success-color: #059669;
  --warning-color: #d97706;
  --error-color: #dc2626;
  --background-gradient: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  --card-background: rgba(255, 255, 255, 0.95);
  --glass-background: rgba(255, 255, 255, 0.1);
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-blue: 0 4px 14px 0 rgba(30, 58, 138, 0.15);
  --shadow-blue-lg: 0 8px 25px 0 rgba(30, 58, 138, 0.2);
  --border-radius: 12px;
  --border-radius-lg: 16px;
  --border-radius-xl: 20px;
  --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: all 0.15s ease-out;
  --sidebar-width: 280px;
  --header-height: 80px;
}

/* Reset y Base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* App Container - Full Screen */
.app-container {
  min-height: 100vh;
  width: 100vw;
  background: var(--background-gradient);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: var(--text-primary);
  overflow-x: hidden;
}

/* ===== LOADING OVERLAY PROFESIONAL ===== */
.loading-overlay-professional {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-out;
}

.loading-content-professional {
  text-align: center;
  color: white;
}

.loading-logo {
  position: relative;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pulse-ring {
  position: absolute;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  width: 120px;
  height: 120px;
  animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
}

.pulse-ring.delay-1 {
  animation-delay: 0.3s;
  width: 140px;
  height: 140px;
}

.pulse-ring.delay-2 {
  animation-delay: 0.6s;
  width: 160px;
  height: 160px;
}

.loading-icon {
  font-size: 3rem;
  color: white;
  z-index: 10;
  position: relative;
  animation: float 3s ease-in-out infinite;
}

.loading-text-professional h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  opacity: 0;
  animation: slideUp 0.6s ease-out 0.3s forwards;
}

.loading-text-professional p {
  font-size: 1rem;
  opacity: 0.8;
  margin-bottom: 2rem;
  opacity: 0;
  animation: slideUp 0.6s ease-out 0.6s forwards;
}

.progress-bar {
  width: 300px;
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin: 0 auto;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffffff, #dbeafe);
  border-radius: 2px;
  animation: progressFill 2s ease-in-out infinite;
}

/* ===== MAIN LAYOUT ===== */
.main-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* ===== SIDEBAR ===== */
.sidebar {
  width: var(--sidebar-width);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  z-index: 1000;
  transition: var(--transition);
}

.sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.sidebar-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
}

.brand-text {
  font-size: 1.25rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-nav {
  padding: 1.5rem 0;
}

.nav-section {
  margin-bottom: 2rem;
}

.nav-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 1rem;
  padding: 0 1.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: var(--transition);
  position: relative;
  margin: 0.25rem 0.75rem;
  border-radius: var(--border-radius);
}

.nav-item:hover {
  background: var(--primary-lightest);
  color: var(--primary-color);
  transform: translateX(4px);
}

.nav-item.active {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  color: white;
  box-shadow: var(--shadow-blue);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: -0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: var(--primary-color);
  border-radius: 2px;
}

.nav-item i {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

/* ===== MAIN CONTENT ===== */
.main-content {
  flex: 1;
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  background: transparent;
}

/* ===== TOP HEADER ===== */
.top-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--border-color);
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--shadow-sm);
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.title-icon {
  font-size: 1.75rem;
  color: var(--primary-color);
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* ===== SEARCH MODERNO ===== */
.search-container-modern {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-modern {
  width: 400px;
  padding: 0.75rem 1rem 0.75rem 3rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background: white;
  font-size: 0.95rem;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.search-input-modern:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
  transform: translateY(-1px);
}

.search-icon-modern {
  position: absolute;
  left: 1rem;
  color: var(--text-muted);
  font-size: 1rem;
  z-index: 10;
}

.clear-search-modern {
  position: absolute;
  right: 0.75rem;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 50%;
  transition: var(--transition);
}

.clear-search-modern:hover {
  background: var(--primary-lightest);
  color: var(--primary-color);
}

.filter-select-modern {
  padding: 0.75rem 1rem;
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  background: white;
  font-size: 0.95rem;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-sm);
}

.filter-select-modern:focus {
  outline: none;
  border-color: var(--primary-light);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

/* ===== STATS DASHBOARD ===== */
.stats-dashboard {
  padding: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--card-background);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--shadow-md);
  transition: var(--transition);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
}

.stat-icon-container {
  width: 60px;
  height: 60px;
  border-radius: var(--border-radius);
  background: linear-gradient(135deg, var(--primary-color), var(--primary-light));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-blue);
}

.stat-icon {
  font-size: 1.5rem;
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.95rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.stat-change {
  font-size: 0.85rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-change.positive {
  color: var(--success-color);
}

.stat-change.negative {
  color: var(--error-color);
}

.stat-change.neutral {
  color: var(--text-muted);
}

/* ===== MICRO-INTERACCIONES AVANZADAS ===== */

/* Efectos hover para tarjetas de estadísticas */
.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--shadow-blue-lg);
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
  background: linear-gradient(135deg, var(--primary-light), var(--accent-color));
}

.stat-card:hover .stat-number {
  color: var(--primary-color);
  text-shadow: 0 2px 4px rgba(30, 58, 138, 0.1);
}

/* Efectos para botones con micro-interacciones */
.search-input:focus {
  transform: scale(1.02);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1), var(--shadow-blue);
}

.filter-select:focus {
  transform: scale(1.02);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1), var(--shadow-blue);
}

/* Efectos para filas de tabla */
.user-row:hover {
  background: linear-gradient(90deg, rgba(30, 58, 138, 0.03), rgba(59, 130, 246, 0.05));
  transform: translateX(4px);
  box-shadow: 4px 0 0 var(--primary-lighter);
}

.user-row:hover .user-avatar {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
}

/* Efectos para badges */
.user-badge:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-blue);
}

/* Efectos para botones de acción */
.action-btn:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: var(--shadow-blue-lg);
}

.action-btn:active {
  transform: translateY(0) scale(0.98);
}

/* Efectos de carga con micro-interacciones */
.skeleton-item {
  position: relative;
  overflow: hidden;
}

.skeleton-item::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* Efectos de entrada escalonados */
.stat-card:nth-child(1) {
  animation: slideInFromLeft 0.6s ease-out 0.1s both;
}

.stat-card:nth-child(2) {
  animation: slideInFromLeft 0.6s ease-out 0.2s both;
}

.stat-card:nth-child(3) {
  animation: slideInFromLeft 0.6s ease-out 0.3s both;
}

.stat-card:nth-child(4) {
  animation: slideInFromLeft 0.6s ease-out 0.4s both;
}

/* Efectos para elementos de navegación */
.nav-item:hover {
  background: rgba(30, 58, 138, 0.1);
  transform: translateX(8px);
  border-radius: 0 25px 25px 0;
}

.nav-item:hover .nav-icon {
  transform: scale(1.2);
  color: var(--primary-color);
}

/* Efectos de pulsación para elementos interactivos */
.pulse-on-hover:hover {
  animation: pulse 0.6s ease-in-out;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

/* Efectos de rotación suave */
.rotate-on-hover:hover {
  transform: rotate(360deg);
  transition: transform 0.8s ease-in-out;
}

/* Efectos de brillo */
.glow-on-hover:hover {
  box-shadow: 
    0 0 20px rgba(30, 58, 138, 0.3),
    0 0 40px rgba(30, 58, 138, 0.2),
    0 0 60px rgba(30, 58, 138, 0.1);
}

/* ===== ANIMACIONES EXISTENTES ===== */
@keyframes pulse-ring {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes progressFill {
  0% {
    transform: translateX(-100%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounceIn {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Container principal */
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Header mejorado */
.header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius);
  padding: 20px 30px;
  margin-bottom: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: var(--shadow-medium);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo-img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: var(--shadow-light);
}

.header-title h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-dark);
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.header-title p {
  margin: 0;
  font-size: 14px;
  color: var(--text-light);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 15px;
  color: var(--text-light);
  z-index: 1;
}

.search-input {
  padding: 12px 15px 12px 45px;
  border: 2px solid var(--border-color);
  border-radius: 25px;
  font-size: 14px;
  width: 300px;
  transition: var(--transition);
  background: var(--white);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.clear-search {
  position: absolute;
  right: 15px;
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  font-size: 16px;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dashboard-btn {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: var(--white);
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: var(--shadow-blue);
}

.dashboard-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stats-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius);
  padding: 25px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--shadow-light);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: var(--transition);
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-medium);
}

.stats-icon {
  font-size: 32px;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  border-radius: 50%;
  color: var(--white);
  box-shadow: var(--shadow-blue);
}

.stats-content h3 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: var(--text-dark);
}

.stats-content p {
  margin: 5px 0 0 0;
  font-size: 14px;
  color: var(--text-light);
}

/* Loading States */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-content {
  background: var(--white);
  padding: 40px 60px;
  border-radius: var(--border-radius);
  text-align: center;
  box-shadow: var(--shadow-medium);
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid var(--border-color);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  font-size: 18px;
  color: var(--text-dark);
  font-weight: 500;
}

/* Status Messages */
.status-message {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 15px 20px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: var(--shadow-light);
  font-weight: 500;
}

.status-message.error {
  border-left: 4px solid var(--danger-color);
  color: var(--danger-color);
}

.status-message.success {
  border-left: 4px solid var(--success-color);
  color: var(--success-color);
}

/* Table Section */
.table-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--border-radius);
  padding: 30px;
  box-shadow: var(--shadow-medium);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 20px;
  border-bottom: 2px solid var(--border-color);
}

.table-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-dark);
}

.table-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.filter-select {
  padding: 10px 15px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  background: var(--white);
  cursor: pointer;
  transition: var(--transition);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
}

.export-btn {
  background: linear-gradient(135deg, var(--success-color), #229954);
  color: var(--white);
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-light);
}

/* Modern Table */
.table-container {
  overflow-x: auto;
  border-radius: var(--border-radius);
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--white);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--shadow-light);
}

.modern-table thead {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: var(--white);
}

.modern-table th {
  padding: 18px 15px;
  text-align: left;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modern-table tbody tr {
  transition: var(--transition);
  border-bottom: 1px solid var(--border-color);
}

.modern-table tbody tr:hover {
  background: rgba(30, 58, 138, 0.05);
  transform: scale(1.01);
}

.modern-table td {
  padding: 15px;
  vertical-align: middle;
}

/* Table Cell Styles */
.photo-container {
  display: flex;
  justify-content: center;
}

.user-photo {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-light);
}

.user-photo:hover {
  transform: scale(1.1);
}

.no-photo {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--light-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-light);
  font-size: 20px;
}

.user-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-dark);
}

.user-type {
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: var(--white);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: var(--shadow-light);
}

.document-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.doc-type {
  font-size: 12px;
  color: var(--text-light);
  text-transform: uppercase;
}

.doc-number {
  font-weight: 600;
  color: var(--text-dark);
}

.contact-info .email {
  color: var(--primary-color);
  font-weight: 500;
}

.equipment-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.equipment-info .brand {
  font-weight: 600;
  color: var(--text-dark);
}

.equipment-info .serial {
  font-size: 12px;
  color: var(--text-light);
}

.equipment-info .specs {
  font-size: 11px;
  color: var(--text-light);
  font-style: italic;
}

.no-equipment {
  color: var(--text-light);
  font-style: italic;
}

.accessories-grid {
  display: flex;
  gap: 10px;
}

.accessory-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 8px;
  border-radius: 8px;
  background: var(--light-bg);
  transition: var(--transition);
}

.accessory-item.active {
  background: rgba(30, 58, 138, 0.1);
  color: var(--primary-color);
}

.accessory-item span {
  font-size: 10px;
  font-weight: 500;
}

.edit-btn.modern {
  background: linear-gradient(135deg, var(--primary-light), var(--accent-color));
  color: var(--white);
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  box-shadow: var(--shadow-light);
}

.edit-btn.modern:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-light);
}

/* Empty State */
.no-results {
  text-align: center;
  padding: 60px 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.empty-icon {
  font-size: 48px;
  color: var(--text-light);
}

.empty-state h3 {
  margin: 0;
  color: var(--text-dark);
  font-size: 20px;
}

.empty-state p {
  margin: 0;
  color: var(--text-light);
}

/* Mobile Cards */
.mobile-view {
  display: none;
}

.cards-container {
  display: grid;
  gap: 20px;
}

.user-card {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 20px;
  box-shadow: var(--shadow-light);
  transition: var(--transition);
}

.user-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-medium);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color);
}

.card-photo .user-photo {
  width: 60px;
  height: 60px;
}

.card-user-info {
  flex: 1;
}

.card-user-info h4 {
  margin: 0 0 5px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-dark);
}

.card-edit-btn {
  background: var(--primary-color);
  color: var(--white);
  border: none;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  transition: var(--transition);
}

.card-edit-btn:hover {
  background: var(--primary-dark);
  transform: scale(1.1);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-field {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-field label {
  font-weight: 600;
  color: var(--text-light);
  font-size: 14px;
}

.card-field span {
  color: var(--text-dark);
  font-weight: 500;
}

.card-accessories {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

/* Load More Section */
.load-more-container {
  text-align: center;
  margin-top: 30px;
}

.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  color: var(--white);
  font-weight: 500;
}

.loading-dot-container {
  display: flex;
  gap: 5px;
}

.loading-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--white);
  animation: bounce 1.4s ease-in-out infinite both;
}

.loading-dot:nth-child(1) { animation-delay: -0.32s; }
.loading-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  } 40% {
    transform: scale(1);
  }
}

.load-more-btn {
  background: rgba(255, 255, 255, 0.2);
  color: var(--white);
  border: 2px solid var(--white);
  padding: 15px 30px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  backdrop-filter: blur(10px);
}

.load-more-btn:hover {
  background: var(--white);
  color: var(--primary-color);
  transform: translateY(-2px);
}

.pagination-info {
  color: var(--white);
  margin-top: 15px;
  font-weight: 500;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: var(--white);
  border-radius: var(--border-radius);
  padding: 30px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-medium);
}

.modal-content h3 {
  margin: 0 0 25px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-dark);
  text-align: center;
}

.modal-photo {
  text-align: center;
  margin-bottom: 25px;
}

.edit-user-photo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 15px;
  box-shadow: var(--shadow-light);
}

.no-photo-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: var(--light-bg);
  color: var(--text-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin: 0 auto 15px;
  box-shadow: var(--shadow-light);
}

.photo-btn {
  background: var(--primary-color);
  color: var(--white);
  border: none;
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.photo-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.modal-field {
  margin-bottom: 20px;
}

.modal-field label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--text-dark);
}

.modal-field input,
.modal-field select {
  width: 100%;
  padding: 12px 15px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 14px;
  transition: var(--transition);
  box-sizing: border-box;
}

.modal-field input:focus,
.modal-field select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

.save-btn {
  background: var(--primary-color);
  color: var(--white);
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  box-shadow: var(--shadow-blue);
}

.save-btn:hover {
  background: var(--accent-color);
  transform: translateY(-2px);
}

.close-btn {
  background: var(--text-light);
  color: var(--white);
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
}

.close-btn:hover {
  background: #6c757d;
}

/* Image Modal */
.imagen-ampliada-container {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.imagen-ampliada {
  max-width: 100%;
  max-height: 100%;
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-medium);
}

.cerrar-imagen-btn {
  position: absolute;
  top: -15px;
  right: -15px;
  background: var(--danger-color);
  color: var(--white);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  transition: var(--transition);
}

.cerrar-imagen-btn:hover {
  background: #c0392b;
  transform: scale(1.1);
}

/* Photo Options Modal */
.foto-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
}

.foto-modal-content {
  background: var(--white);
  padding: 30px;
  border-radius: var(--border-radius);
  text-align: center;
  box-shadow: var(--shadow-medium);
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-width: 300px;
}

.foto-modal-content button {
  padding: 15px 25px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  font-size: 16px;
}

.foto-modal-content button:first-child {
  background: var(--primary-color);
  color: var(--white);
  box-shadow: var(--shadow-blue);
}

.foto-modal-content button:first-child:hover {
  background: var(--accent-color);
  transform: translateY(-2px);
}

.foto-modal-content button:nth-child(2) {
  background: var(--primary-light);
  color: var(--white);
  box-shadow: var(--shadow-blue);
}

.foto-modal-content button:nth-child(2):hover {
  background: var(--primary-lighter);
  transform: translateY(-2px);
}

.foto-modal-content button.cerrar {
  background: var(--text-light);
  color: var(--white);
}

.foto-modal-content button.cerrar:hover {
  background: #6c757d;
}

/* Camera Container */
.camara-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  gap: 20px;
}

.camara-container video {
  max-width: 90%;
  max-height: 70%;
  border: 3px solid var(--white);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-medium);
}

.camara-container button {
  background: var(--primary-color);
  color: var(--white);
  border: none;
  padding: 15px 30px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  font-size: 16px;
}

.camara-container button:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .desktop-view {
    display: none;
  }
  
  .mobile-view {
    display: block;
  }
  
  .header {
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .search-input {
    width: 250px;
  }
  
  .stats-section {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 15px;
  }
  
  .header {
    padding: 20px;
  }
  
  .header-title h1 {
    font-size: 20px;
  }
  
  .search-input {
    width: 200px;
  }
  
  .dashboard-btn {
    padding: 10px 20px;
    font-size: 14px;
  }
  
  .table-section {
    padding: 20px;
  }
  
  .modal-content {
    padding: 20px;
    margin: 20px;
  }
  
  .stats-card {
    padding: 20px;
  }
  
  .stats-icon {
    font-size: 24px;
    width: 50px;
    height: 50px;
  }
  
  .stats-content h3 {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
    gap: 15px;
  }
  
  .search-input {
    width: 100%;
  }
  
  .table-controls {
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }
  
  .filter-select,
  .export-btn {
    width: 100%;
  }
  
  .user-card {
    padding: 15px;
  }
  
  .card-header {
    flex-direction: column;
    text-align: center;
    gap: 10px;
  }
  
  .card-field {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}

/* ===== MEJORAS DE JERARQUÍA VISUAL Y ESPACIADO PROFESIONAL ===== */

/* Espaciado y tipografía mejorados */
.main-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--primary-lightest);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  font-weight: 400;
  margin-bottom: 0;
}

/* Espaciado consistente para secciones */
.stats-section {
  margin-bottom: 3rem;
}

.controls-section {
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: var(--card-background);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.table-section {
  margin-bottom: 2rem;
}

/* Mejoras en la jerarquía de información */
.stat-card {
  padding: 2rem 1.5rem;
  border-left: 4px solid var(--primary-color);
}

.stat-number {
  font-size: 2.75rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 1rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

/* Espaciado mejorado para controles */
.search-controls {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1.5rem;
  align-items: end;
  margin-bottom: 2rem;
}

/* Mejoras en la tabla */
.users-table {
  border-spacing: 0;
  border-collapse: separate;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.users-table th {
  padding: 1.25rem 1.5rem;
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: linear-gradient(135deg, var(--primary-color), var(--accent-color));
  color: white;
}

.users-table td {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.user-row:last-child td {
  border-bottom: none;
}

/* Espaciado mejorado para elementos de usuario */
.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--primary-lightest);
}

.user-details h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
}

.user-details p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Mejoras en badges */
.user-badge {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 50px;
  border: none;
}

/* Espaciado mejorado para modales */
.modal-content {
  padding: 2.5rem;
  max-width: 600px;
  width: 90vw;
}

.modal-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid var(--border-color);
}

.modal-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.modal-field {
  margin-bottom: 1.5rem;
}

.modal-field label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-primary);
}

.modal-field input,
.modal-field select {
  padding: 1rem 1.25rem;
  font-size: 1rem;
  border-radius: var(--border-radius);
  border: 2px solid var(--border-color);
  transition: var(--transition);
}

.modal-actions {
  margin-top: 2.5rem;
  padding-top: 2rem;
  border-top: 2px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.save-btn,
.close-btn {
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--border-radius);
  border: none;
  cursor: pointer;
  transition: var(--transition);
}
</style>