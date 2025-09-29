<template>
  <div class="dashboard-container">
    <!-- Logo y título -->
    <div class="header-container">
      <div class="logo">
        <img src="/logo-gatelogix.svg" alt="Logo GateLogix" />
      </div>
      <h1>Control de Equipos</h1>
    </div>

    <!-- Barra de búsqueda -->
    <div class="search-bar">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Buscar por documento o nombre"
        @input="onSearch"
      />
      <button>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" fill="none"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    </div>

    <!-- Estado de carga mejorado y moderno -->
    <div v-if="loading" class="loading-container">
      <div class="loading-hero">
        <div class="loading-animation">
          <div class="pulse-ring"></div>
          <div class="pulse-ring delay-1"></div>
          <div class="pulse-ring delay-2"></div>
          <div class="loading-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="#1565c0"/>
              <path d="M19 15L19.91 18.26L23 19L19.91 19.74L19 23L18.09 19.74L15 19L18.09 18.26L19 15Z" fill="#42a5f5"/>
              <path d="M5 6L5.91 9.26L9 10L5.91 10.74L5 14L4.09 10.74L1 10L4.09 9.26L5 6Z" fill="#64b5f6"/>
            </svg>
          </div>
        </div>
        
        <div class="loading-content">
          <h3 class="loading-title">Cargando Control de Equipos</h3>
          <p class="loading-subtitle">Procesando usuarios y equipos del sistema...</p>
          
          <div class="loading-stats">
            <div class="stat-item">
              <div class="stat-icon">👥</div>
              <span>Usuarios</span>
            </div>
            <div class="stat-item">
              <div class="stat-icon">💻</div>
              <span>Equipos</span>
            </div>
            <div class="stat-item">
              <div class="stat-icon">🔄</div>
              <span>Sincronizando</span>
            </div>
          </div>
          
          <div class="loading-progress-modern">
            <div class="progress-track">
              <div class="progress-fill-modern"></div>
            </div>
            <div class="progress-dots">
              <div class="dot active"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Skeleton loader mejorado para la tabla -->
      <div class="skeleton-preview">
        <div class="skeleton-header-modern">
          <div class="skeleton-title">Vista previa de la tabla</div>
        </div>
        <div class="skeleton-table-modern">
          <div class="skeleton-table-header">
            <div class="skeleton-cell-modern header" v-for="n in 5" :key="'header-' + n">
              <div class="skeleton-shimmer"></div>
            </div>
          </div>
          <div class="skeleton-table-body">
            <div class="skeleton-row-modern" v-for="n in 4" :key="'row-' + n">
              <div class="skeleton-cell-modern" v-for="m in 5" :key="'cell-' + n + '-' + m">
                <div class="skeleton-shimmer" :style="{ animationDelay: (n * 0.1 + m * 0.05) + 's' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mensaje de error -->
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="cargarUsuarios" class="btn primary">Reintentar</button>
    </div>

    <!-- Tabla de usuarios -->
    <div v-else class="table-container">
      <div class="table-scroll-container">
        <table class="user-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Nombre</th>
              <th>Documento</th>
              <th>Equipos asociados</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user._id">
              <td class="table-cell">{{ user.tipoUsuario || 'Usuario' }}</td>
              <td class="table-cell">{{ user.nombre }}</td>
              <td class="table-cell">{{ user.numeroDocumento || user.documento || 'Sin documento' }}</td>
              <td class="table-cell">
                <div class="equipos-list">
                  <span v-if="(!user.equipos || user.equipos.length === 0)" class="no-equipos">
                    Sin equipos
                  </span>
                  <div v-else class="equipo-item">
                    <span v-if="user.equipos && user.equipos.length > 0" class="equipo-principal">
                      <span class="equipo-info">{{ user.equipos[0].marca || user.equipos[0].nombre || 'Sin marca' }} ({{ user.equipos[0].serial || 'Sin serial' }})</span>
                      <span class="badge-principal">Principal</span>
                    </span>
                    <span v-if="user.equipos && user.equipos.length > 1" class="equipos-adicionales">
                      {{ user.equipos.length - 1 }} equipo(s) adicional(es)
                    </span>
                  </div>
                </div>
              </td>
              <td class="table-cell">
                <button @click="abrirModalEquipos(user)" class="btn-action">
                  <span class="icon">🖥️</span> Ver equipos
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredUsers.length === 0" class="no-results">
        {{ searchQuery ? 'No se encontraron usuarios con los filtros aplicados' : 'No hay usuarios registrados' }}
      </div>

      <!-- Botón para cargar más usuarios -->
      <div v-if="usuarios.length < totalUsuarios && !loading" class="load-more-container">
        <button @click="cargarMasUsuarios" class="btn-load-more">
          Cargar más usuarios ({{ usuarios.length }}/{{ totalUsuarios }})
        </button>
      </div>
    </div>

    <!-- Modal para gestionar equipos -->
    <div v-if="modalEquiposAbierto" class="modal-overlay" @click.self="cerrarModalEquipos">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Equipos de {{ usuarioSeleccionado?.nombre }}</h3>
          <button class="modal-close-btn" @click="cerrarModalEquipos">✕</button>
        </div>
        
        <div class="equipos-container">
          <div v-if="!usuarioSeleccionado?.equipos || usuarioSeleccionado.equipos.length === 0" class="no-equipos-message">
            Este usuario no tiene equipos registrados
          </div>
          
          <div v-else class="equipos-grid">
            <div v-for="(equipo, index) in usuarioSeleccionado.equipos" :key="equipo._id || index" class="equipo-card">
              <div class="equipo-header">
                <h4>
                  <span v-if="index === 0" class="equipo-numero">Principal</span>
                  <span v-else class="equipo-numero">#{{ index + 1 }}</span>
                  {{ equipo.nombre || equipo.marca }}
                </h4>
                <span v-if="index === 0" class="badge-principal">Principal</span>
              </div>
              <div class="equipo-foto">
                <img :src="obtenerImagenEquipo(equipo)" alt="Foto del equipo" class="equipo-imagen">
              </div>
              <div class="equipo-details">
                <p><strong>Serial:</strong> {{ equipo.serial }}</p>
                <p><strong>Características:</strong> {{ equipo.caracteristicas || 'No especificadas' }}</p>
                <p v-if="equipo.fechaIngreso"><strong>Fecha de ingreso:</strong> {{ formatearFecha(equipo.fechaIngreso) }}</p>
                <p v-else><strong>Fecha de ingreso:</strong> {{ obtenerFechaIngreso(usuarioSeleccionado._id, equipo.serial) }}</p>
                <div class="equipo-accesorios">
                  <span :class="['accesorio', equipo.mouse || equipo.accesorios?.mouse ? 'active' : '']">Mouse</span>
                  <span :class="['accesorio', equipo.cargador || equipo.accesorios?.cargador ? 'active' : '']">Cargador</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <!-- Botón de agregar nuevo equipo eliminado -->
        </div>
      </div>
    </div>

    <!-- Modal para agregar nuevo equipo -->
    <div v-if="modalNuevoEquipoAbierto" class="modal-overlay" @click.self="cerrarFormularioEquipo">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Registrar Nuevo Equipo</h3>
          <button class="modal-close-btn" @click="cerrarFormularioEquipo">✕</button>
        </div>
        
        <div class="form-container">
          <div class="form-group">
            <label>Marca/Nombre del equipo</label>
            <input type="text" v-model="nuevoEquipo.nombre" placeholder="Ej: Lenovo ThinkPad" />
          </div>
          
          <div class="form-group">
            <label>Serial del equipo</label>
            <input type="text" v-model="nuevoEquipo.serial" placeholder="Ej: ABC123XYZ" />
          </div>
          
          <div class="form-group">
            <label>Características</label>
            <textarea v-model="nuevoEquipo.caracteristicas" placeholder="Ej: 8GB RAM, 256GB SSD, i5"></textarea>
          </div>
          
          <div class="form-group checkbox-group">
            <label class="checkbox-container">
              <input type="checkbox" v-model="nuevoEquipo.mouse" />
              <span class="checkbox-text">Mouse</span>
            </label>
            
            <label class="checkbox-container">
              <input type="checkbox" v-model="nuevoEquipo.cargador" />
              <span class="checkbox-text">Cargador</span>
            </label>
          </div>
          
          <!-- Sección para cargar imagen del equipo -->
          <div class="form-group">
            <label>Imagen del equipo</label>
            <div class="file-section">
              <button type="button" class="file-upload-btn" @click="mostrarOpciones = true">📎 Agregar Foto del Equipo</button>
            </div>
            
            <!-- Vista previa de la imagen -->
            <div v-if="nuevoEquipo.foto" class="image-preview">
              <img :src="nuevoEquipo.foto" alt="Vista previa" style="max-width: 200px; max-height: 150px; margin-top: 10px; border-radius: 4px;" />
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="guardarNuevoEquipo" class="btn primary" :disabled="!nuevoEquipo.nombre || !nuevoEquipo.serial">
            Guardar equipo
          </button>
          <button @click="cerrarFormularioEquipo" class="btn secondary">
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal para opciones de foto/archivo -->
    <div v-if="mostrarOpciones" class="modal-overlay">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>Agregar imagen</h3>
          <button class="modal-close-btn" @click="mostrarOpciones = false">✕</button>
        </div>
        <div class="modal-body">
          <button @click="abrirCamara" class="btn primary">Tomar Foto</button>
          <button @click="subirArchivo" class="btn primary">Seleccionar Archivo</button>
        </div>
      </div>
    </div>

    <!-- Cámara -->
    <div v-if="mostrarCamara" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Tomar foto</h3>
          <button class="modal-close-btn" @click="cerrarCamara">✕</button>
        </div>
        <div class="modal-body">
          <video ref="video" autoplay style="width: 100%; max-width: 500px;"></video>
          <div class="modal-footer">
            <button @click="capturarFoto" class="btn primary">Capturar</button>
            <button @click="cerrarCamara" class="btn secondary">Cancelar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Botón para volver al dashboard -->
    <div class="dashboard-btn-wrapper">
      <button @click="volverDashboard" class="btn-volver-dashboard">
        Volver al Dashboard
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { getApiUrl } from '../utils/apiConfig';

export default {
  name: 'ControlEquipos',
  data() {
    return {
      searchQuery: '',
      loading: true,
      error: null,
      usuarios: [],
      modalEquiposAbierto: false,
      modalNuevoEquipoAbierto: false,
      mostrarOpciones: false,
      mostrarCamara: false,
      usuarioSeleccionado: null,
      nuevoEquipo: {
        nombre: '',
        serial: '',
        caracteristicas: '',
        mouse: false,
        cargador: false,
        foto: null
      },
      // Paginación escalable para grandes volúmenes de datos
      paginaActual: 1,
      usuariosPorPagina: 100,  // Carga inicial
      totalUsuarios: 0,
      // Paginación para equipos
      paginaEquipos: 1,
      equiposPorPagina: 1000,  // Carga más equipos por lote
      totalEquipos: 0,
      equiposCargados: false,
      // Caché para fechas de ingreso
      fechasIngresoCache: {},
      // Caché para datos de API
      usuariosCache: null,
      equiposCache: null,
      cacheTimestamp: null,
      cacheExpiry: 5 * 60 * 1000, // 5 minutos en milisegundos
      // URL de la API
      apiUrl: getApiUrl('')
    };
  },
  computed: {
    filteredUsers() {
      if (!this.searchQuery) return this.usuarios;
      const query = this.searchQuery.toLowerCase();
      return this.usuarios.filter(user => {
        return (
          (user.nombre && user.nombre.toLowerCase().includes(query)) ||
          (user.documento && user.documento.toLowerCase().includes(query))
        );
      });
    },
  },
  mounted() {
    this.cargarUsuariosYEquipos();
  },
  methods: {
    // Método para buscar
    onSearch() {
      // La búsqueda se maneja automáticamente a través de la propiedad computada filteredUsers
      console.log('Buscando:', this.searchQuery);
    },
    formatearFecha(fecha) {
      if (!fecha) return 'No disponible';
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    },
    
    // Métodos para manejo de fotos
    abrirCamara() {
      this.mostrarOpciones = false;
      this.mostrarCamara = true;
      
      // Acceder a la cámara
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          this.$refs.video.srcObject = stream;
          this.cameraStream = stream;
        })
        .catch(error => {
          console.error('Error al acceder a la cámara:', error);
          alert('No se pudo acceder a la cámara. Por favor, verifica los permisos.');
          this.mostrarCamara = false;
        });
    },
    
    cerrarCamara() {
      this.mostrarCamara = false;
      
      // Detener el stream de la cámara
      if (this.cameraStream) {
        this.cameraStream.getTracks().forEach(track => track.stop());
        this.cameraStream = null;
      }
    },
    
    capturarFoto() {
      const video = this.$refs.video;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dibujar el frame actual del video en el canvas
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convertir a base64
      const fotoBase64 = canvas.toDataURL('image/jpeg');
      this.nuevoEquipo.foto = fotoBase64;
      
      console.log('Foto capturada:', fotoBase64.substring(0, 50) + '...');
      
      // Cerrar la cámara
      this.cerrarCamara();
    },
    
    subirArchivo() {
      this.mostrarOpciones = false;
      
      // Crear un input de archivo invisible
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'image/*';
      
      // Manejar la selección de archivo
      fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validar que sea una imagen
        if (!file.type.startsWith('image/')) {
          alert('Por favor, selecciona una imagen válida.');
          return;
        }
        
        // Leer el archivo como base64
        const reader = new FileReader();
        reader.onload = (event) => {
          this.nuevoEquipo.foto = event.target.result;
          console.log('Archivo cargado:', this.nuevoEquipo.foto.substring(0, 50) + '...');
        };
        reader.readAsDataURL(file);
      };
      
      // Simular clic en el input
      fileInput.click();
    },
    obtenerImagenEquipo(equipo) {
      // Si el equipo tiene una foto, la usamos
      if (equipo.foto) {
        return equipo.foto;
      }
      
      // Si no tiene foto, usamos una imagen por defecto
      return '/logo-gatelogix.svg'; // Imagen por defecto en la carpeta public
    },
    
    async obtenerFechaIngreso(usuarioId, serial) {
      try {
        if (!usuarioId || !serial) return 'No disponible';
        
        // Buscar en el historial local primero
        const historialLocal = await this.obtenerHistorialLocal(usuarioId);
        const primerIngreso = historialLocal.find(h => h.serial === serial && h.entrada);
        
        if (primerIngreso && primerIngreso.entrada) {
          return this.formatearFecha(primerIngreso.entrada);
        }
        
        return 'No disponible';
      } catch (error) {
        console.error('Error al obtener fecha de ingreso:', error);
        return 'No disponible';
      }
    },
    
    async obtenerHistorialLocal(usuarioId) {
      try {
        // Verificar si ya tenemos el historial en caché
        const cacheKey = `historial_${usuarioId}`;
        if (this.fechasIngresoCache[cacheKey]) {
          return this.fechasIngresoCache[cacheKey];
        }
        
        // Obtener el token de autenticación
        const token = localStorage.getItem('token');
        if (!token) return [];
        
        // Consultar el historial para este usuario
        const response = await fetch(getApiUrl('api/historial/listar'), {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.error('Error al obtener historial:', response.status);
          return [];
        }
        
        // Verificar que la respuesta es JSON válido
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('La respuesta no es JSON válido');
          return [];
        }
        
        const data = await response.json();
        
        // Obtener todo el historial y no filtrar por usuario
        const historialUsuario = Array.isArray(data) ? data : [];
        
        // Guardar en caché
        this.fechasIngresoCache[cacheKey] = historialUsuario;
        return historialUsuario;
      } catch (error) {
        console.error('Error al obtener historial local:', error);
        return [];
      }
    },
    abrirCamara() {
      this.mostrarOpciones = false;
      this.mostrarCamara = true;
      
      // Acceder a la cámara
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          this.$refs.video.srcObject = stream;
        })
        .catch(err => {
          console.error('Error al acceder a la cámara:', err);
          alert('No se pudo acceder a la cámara. Verifica los permisos.');
          this.mostrarCamara = false;
        });
    },
    
    cerrarCamara() {
      this.mostrarCamara = false;
      
      // Detener la transmisión de video
      if (this.$refs.video && this.$refs.video.srcObject) {
        this.$refs.video.srcObject.getTracks().forEach(track => track.stop());
        this.$refs.video.srcObject = null;
      }
    },
    
    capturarFoto() {
      // Crear un canvas para capturar la imagen
      const canvas = document.createElement('canvas');
      const video = this.$refs.video;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dibujar el frame actual del video en el canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convertir a base64
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      // Guardar la imagen
      this.nuevoEquipo.foto = dataUrl;
      
      // Cerrar la cámara
      this.cerrarCamara();
    },
    
    subirArchivo() {
      // Crear un input de archivo oculto
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      // Manejar la selección de archivo
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validar que sea una imagen
        if (!file.type.match('image.*')) {
          alert('Por favor selecciona una imagen.');
          return;
        }
        
        // Leer el archivo como base64
        const reader = new FileReader();
        reader.onload = (e) => {
          // Optimizar la imagen antes de guardarla
          this.optimizarImagen(e.target.result, (imagenOptimizada) => {
            this.nuevoEquipo.foto = imagenOptimizada;
            this.mostrarOpciones = false;
          });
        };
        reader.readAsDataURL(file);
      };
      
      // Simular clic en el input
      input.click();
    },
    
    optimizarImagen(dataUrl, callback) {
      const img = new Image();
      img.onload = () => {
        // Crear un canvas para redimensionar
        const canvas = document.createElement('canvas');
        
        // Calcular dimensiones manteniendo proporción
        let width = img.width;
        let height = img.height;
        
        // Limitar tamaño máximo a 800px
        const maxSize = 800;
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen redimensionada
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a base64 con calidad reducida
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        callback(optimizedDataUrl);
      };
      
      img.src = dataUrl;
    },
    // Cargar usuarios desde el backend - OPTIMIZADO CON CACHÉ
    async cargarUsuariosYEquipos() {
      this.loading = true;
      this.error = null;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.error = 'No hay sesión activa. Por favor inicie sesión.';
          this.loading = false;
          return;
        }
        
        // 🚀 OPTIMIZACIÓN: Verificar caché antes de hacer llamadas API
        const ahora = Date.now();
        if (this.usuariosCache && this.equiposCache && this.cacheTimestamp && 
            (ahora - this.cacheTimestamp) < this.cacheExpiry) {
          console.log('📦 Usando datos del caché');
          this.usuarios = this.usuariosCache;
          this.loading = false;
          return;
        }
        
        console.log('🔄 Cargando datos desde API...');
        
        // 🚀 OPTIMIZACIÓN: Cargar usuarios y equipos en paralelo
        const [usuariosResponse, equiposResponse] = await Promise.all([
          axios.get(getApiUrl(`api/usuario-equipo/listar?page=${this.paginaActual}&limit=${this.usuariosPorPagina}`), {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(getApiUrl(`api/equipos/listar?page=1&limit=1000`), {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        // 🚀 OPTIMIZACIÓN: Procesar usuarios de forma más eficiente
        const usuariosData = Array.isArray(usuariosResponse.data) ? usuariosResponse.data : 
                            (usuariosResponse.data?.usuarios || []);
        
        // Actualizar total de usuarios si está disponible
        if (usuariosResponse.data?.total) {
          this.totalUsuarios = usuariosResponse.data.total;
        }
        
        // 🚀 OPTIMIZACIÓN: Crear mapa de usuarios por documento para acceso O(1)
        const usuariosPorDocumento = new Map();
        
        // Procesar usuarios en lotes para evitar bloqueo del hilo principal
        const procesarUsuariosEnLotes = (usuarios, tamanioLote = 50) => {
          const usuariosProcesados = [];
          
          for (let i = 0; i < usuarios.length; i += tamanioLote) {
            const lote = usuarios.slice(i, i + tamanioLote);
            
            lote.forEach(usuario => {
              // Inicializar array de equipos de forma más eficiente
              usuario.equipos = usuario.equipos || [];
              
              // Procesar equipo principal solo si existe
              if (usuario.equipo?.serial) {
                const equipoPrincipal = {
                  nombre: usuario.equipo.marca || usuario.equipo.nombre || 'Equipo',
                  serial: usuario.equipo.serial,
                  caracteristicas: usuario.equipo.caracteristicas || '',
                  mouse: usuario.equipo.accesorios?.mouse || usuario.mouse || false,
                  cargador: usuario.equipo.accesorios?.cargador || usuario.cargador || false,
                  foto: usuario.equipo.foto || null,
                  _id: usuario.equipo._id || `temp-${Date.now()}-${i}`
                };
                
                // Verificar duplicados de forma más eficiente
                if (!usuario.equipos.some(e => e.serial === usuario.equipo.serial)) {
                  usuario.equipos.unshift(equipoPrincipal);
                }
              }
              
              // Agregar al mapa para acceso rápido
              const documento = usuario.numeroDocumento || usuario.documento;
              if (documento) {
                usuariosPorDocumento.set(documento, usuario);
              }
              
              usuariosProcesados.push(usuario);
            });
          }
          
          return usuariosProcesados;
        };
        
        this.usuarios = procesarUsuariosEnLotes(usuariosData);
        
        // 🚀 OPTIMIZACIÓN: Declarar equipos en el scope correcto para evitar ReferenceError
        let equipos = [];
        let equiposProcesados = 0;
        
        try {
          // Validar y extraer equipos de forma segura DENTRO del try-catch
          equipos = equiposResponse?.data?.equipos || [];
          
          if (Array.isArray(equipos) && equipos.length > 0) {
            const serialsVistos = new Set(); // Evitar duplicados globalmente
            
            // 🚀 OPTIMIZACIÓN: Procesar equipos en lotes para mejor rendimiento
            const procesarEquiposEnLotes = (equiposArray, tamanioLote = 100) => {
              let procesados = 0;
              
              if (!Array.isArray(equiposArray)) {
                console.warn('⚠️ equiposArray no es un array válido');
                return 0;
              }
              
              for (let i = 0; i < equiposArray.length; i += tamanioLote) {
                const lote = equiposArray.slice(i, i + tamanioLote);
                
                lote.forEach(equipo => {
                  try {
                    const documento = equipo?.usuario?.documento;
                    if (documento && usuariosPorDocumento.has(documento) && !serialsVistos.has(equipo.serial)) {
                      serialsVistos.add(equipo.serial);
                      const usuario = usuariosPorDocumento.get(documento);
                      
                      // Verificar duplicados de forma más eficiente usando Set
                      if (!usuario.equipos.some(e => e.serial === equipo.serial)) {
                        usuario.equipos.push({
                          nombre: equipo.marca || 'Sin marca',
                          serial: equipo.serial || 'Sin serial',
                          caracteristicas: equipo.caracteristicas || '',
                          mouse: equipo.accesorios?.mouse || false,
                          cargador: equipo.accesorios?.cargador || false,
                          foto: equipo.foto || null,
                          _id: equipo._id
                        });
                        procesados++;
                      }
                    }
                  } catch (equipoError) {
                    console.warn('⚠️ Error procesando equipo individual:', equipoError);
                  }
                });
              }
              
              return procesados;
            };
            
            equiposProcesados = procesarEquiposEnLotes(equipos);
            console.log(`✅ ${equiposProcesados} equipos procesados en paralelo (de ${equipos.length} totales)`);
          } else {
            console.log('ℹ️ No hay equipos para procesar');
          }
        } catch (equiposError) {
          console.error('❌ Error procesando equipos:', equiposError);
          equipos = []; // Asegurar que equipos sea un array vacío en caso de error
        }
        
        console.log('✅ Usuarios y equipos cargados:', this.usuarios.length);
        
        // 🚀 OPTIMIZACIÓN: Guardar en caché de forma más eficiente y segura
        try {
          this.usuariosCache = this.usuarios.map(u => ({ ...u, equipos: [...u.equipos] })); // Copia optimizada
          this.equiposCache = Array.isArray(equipos) ? equipos : [];
          this.cacheTimestamp = Date.now();
          console.log('💾 Datos guardados en caché');
        } catch (cacheError) {
          console.error('❌ Error guardando en caché:', cacheError);
        }
        
      } catch (err) {
        console.error('❌ Error cargando usuarios y equipos:', err);
        this.error = 'Error al cargar los datos. Verifique su conexión.';
      } finally {
        this.loading = false;
      }
    },

    // Método optimizado para cargar más usuarios cuando sea necesario
    async cargarMasUsuarios() {
      if (this.loading || this.usuarios.length >= this.totalUsuarios) return;
      
      this.loading = true;
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        this.paginaActual++;
        
        const usuariosResponse = await axios.get(
          getApiUrl(`api/usuario-equipo/listar?page=${this.paginaActual}&limit=${this.usuariosPorPagina}`), 
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const nuevosUsuarios = Array.isArray(usuariosResponse.data) ? usuariosResponse.data : 
                              (usuariosResponse.data && Array.isArray(usuariosResponse.data.usuarios) ? 
                               usuariosResponse.data.usuarios : []);
        
        // Procesar nuevos usuarios y agregar al array existente
        if (nuevosUsuarios.length > 0) {
          nuevosUsuarios.forEach(usuario => {
            if (!usuario.equipos) {
              usuario.equipos = [];
            }
            
            // Procesar equipo principal si existe
            if (usuario.equipo && typeof usuario.equipo === 'object' && usuario.equipo.serial) {
              const equipoPrincipal = {
                nombre: usuario.equipo.marca || usuario.equipo.nombre || 'Equipo',
                serial: usuario.equipo.serial || '',
                caracteristicas: usuario.equipo.caracteristicas || '',
                mouse: usuario.equipo.accesorios?.mouse || usuario.mouse || false,
                cargador: usuario.equipo.accesorios?.cargador || usuario.cargador || false,
                foto: usuario.equipo.foto || null,
                _id: usuario.equipo._id || `temp-${Date.now()}`
              };
              
              const equipoExistente = usuario.equipos.find(e => e.serial === usuario.equipo.serial);
              if (!equipoExistente) {
                usuario.equipos.unshift(equipoPrincipal);
              }
            }
          });
          
          // Agregar nuevos usuarios al array existente
          this.usuarios.push(...nuevosUsuarios);
          
          console.log(`✅ ${nuevosUsuarios.length} usuarios adicionales cargados`);
        }
        
      } catch (error) {
        console.error('❌ Error cargando más usuarios:', error);
      } finally {
        this.loading = false;
      }
    },

    abrirModalEquipos(usuario) {
      // Copia profunda del usuario
      this.usuarioSeleccionado = JSON.parse(JSON.stringify(usuario));
      console.log('Usuario seleccionado:', this.usuarioSeleccionado);
      
      // Asegurarse de que equipos sea un array
      if (!Array.isArray(this.usuarioSeleccionado.equipos)) {
        this.usuarioSeleccionado.equipos = [];
      }
      
      // Si el usuario tiene un objeto equipo pero no está en el array, agregarlo
      if (this.usuarioSeleccionado.equipo && this.usuarioSeleccionado.equipo.serial) {
        const equipoExistente = this.usuarioSeleccionado.equipos.find(e => e.serial === this.usuarioSeleccionado.equipo.serial);
        if (!equipoExistente) {
          const equipoPrincipal = {
            nombre: this.usuarioSeleccionado.equipo.marca || 'Equipo',
            serial: this.usuarioSeleccionado.equipo.serial || '',
            caracteristicas: this.usuarioSeleccionado.equipo.caracteristicas || '',
            mouse: this.usuarioSeleccionado.equipo.accesorios?.mouse || false,
            cargador: this.usuarioSeleccionado.equipo.accesorios?.cargador || false,
            foto: this.usuarioSeleccionado.equipo.foto || null
          };
          this.usuarioSeleccionado.equipos.unshift(equipoPrincipal);
        }
      }
      
      console.log('Equipos actualizados:', this.usuarioSeleccionado.equipos);
      this.modalEquiposAbierto = true;
    },
    
    // Cerrar modal de equipos
    cerrarModalEquipos() {
      this.modalEquiposAbierto = false;
      this.usuarioSeleccionado = null;
    },
    
    // Abrir formulario para nuevo equipo
    abrirFormularioEquipo() {
      this.nuevoEquipo = {
        nombre: '',
        serial: '',
        caracteristicas: '',
        mouse: false,
        cargador: false
      };
      this.modalNuevoEquipoAbierto = true;
    },
    
    // Cerrar formulario de equipo
    cerrarFormularioEquipo() {
      this.modalNuevoEquipoAbierto = false;
      // Reiniciar el formulario
      this.nuevoEquipo = {
        nombre: '',
        serial: '',
        caracteristicas: '',
        mouse: false,
        cargador: false,
        foto: null
      };
      this.mostrarOpciones = false;
      this.cerrarCamara(); // Asegurar que la cámara se cierre si está abierta
    },
    
    // Guardar nuevo equipo
    async guardarNuevoEquipo() {
      if (!this.nuevoEquipo.nombre || !this.nuevoEquipo.serial) {
        alert('Por favor complete los campos obligatorios: Nombre y Serial del equipo');
        return;
      }
      
      try {
        // Preparar la foto si existe
        let foto = null;
        if (this.nuevoEquipo.foto) {
          // Usar la foto capturada o cargada
          foto = this.nuevoEquipo.foto;
          console.log('Foto preparada para enviar:', foto ? 'Foto presente (base64)' : 'Foto null');
        } else {
          console.log('No hay fotos para enviar');
        }

        // Asegurarse de que la foto sea una cadena base64 válida
        let fotoFinal = null;
        if (foto && typeof foto === 'string' && foto.startsWith('data:image')) {
          fotoFinal = foto;
          console.log('Foto válida detectada');
        } else if (foto) {
          console.log('Formato de foto no válido:', typeof foto);
        }
        
        // Preparar datos del equipo
        const equipoData = {
          marca: this.nuevoEquipo.nombre,
          serial: this.nuevoEquipo.serial,
          caracteristicas: this.nuevoEquipo.caracteristicas,
          accesorios: {
            mouse: this.nuevoEquipo.mouse || false,
            cargador: this.nuevoEquipo.cargador || false
          },
          documento: this.usuarioSeleccionado.numeroDocumento || this.usuarioSeleccionado.documento,
          foto: fotoFinal, // Incluir la foto validada en el payload
          fechaIngreso: new Date().toISOString(), // Agregar fecha de ingreso
          fechaRegistro: new Date().toISOString() // Agregar fecha de registro
        };
        
        // Guardar en el backend usando la nueva API
        const token = localStorage.getItem('token');
        const response = await axios.post(
          getApiUrl('api/equipos/registrar'),
          equipoData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Agregar equipo al usuario seleccionado en la UI
        if (!this.usuarioSeleccionado.equipos) {
          this.usuarioSeleccionado.equipos = [];
        }
        
        this.usuarioSeleccionado.equipos.push({
          nombre: this.nuevoEquipo.nombre,
          serial: this.nuevoEquipo.serial,
          caracteristicas: this.nuevoEquipo.caracteristicas,
          mouse: this.nuevoEquipo.mouse,
          cargador: this.nuevoEquipo.cargador,
          foto: this.nuevoEquipo.foto,
          fechaRegistro: new Date().toISOString() // Agregar fecha de registro al objeto local
        });
        
        // Actualizar la lista de usuarios
        const index = this.usuarios.findIndex(u => 
          u._id === this.usuarioSeleccionado._id || 
          u.numeroDocumento === this.usuarioSeleccionado.numeroDocumento || 
          u.documento === this.usuarioSeleccionado.documento
        );
        if (index !== -1) {
          // Asegurarse de que el array de equipos exista
          if (!this.usuarios[index].equipos) {
            this.usuarios[index].equipos = [];
          }
          // Agregar el nuevo equipo al array de equipos del usuario
          this.usuarios[index].equipos.push({
            nombre: this.nuevoEquipo.nombre,
            serial: this.nuevoEquipo.serial,
            caracteristicas: this.nuevoEquipo.caracteristicas,
            mouse: this.nuevoEquipo.mouse,
            cargador: this.nuevoEquipo.cargador,
            foto: this.nuevoEquipo.foto,
            fechaRegistro: new Date().toISOString()
          });
        }
        
        this.cerrarFormularioEquipo();
        
        // 🚀 OPTIMIZACIÓN: Invalidar caché después de agregar equipo
        this.invalidarCache();
        
        console.log('✅ Equipo agregado correctamente:', response.data);
      } catch (err) {
        console.error('❌ Error al guardar equipo:', err);
        alert('Error al guardar el equipo: ' + (err.response?.data?.message || 'Intente nuevamente.'));
      }
    },
    
    // Eliminar equipo
    async eliminarEquipo(index) {
      if (!confirm('¿Está seguro de eliminar este equipo?')) return;
      
      try {
        // Eliminar equipo del array
        this.usuarioSeleccionado.equipos.splice(index, 1);
        
        // Guardar en el backend
        const token = localStorage.getItem('token');
        await axios.put(
          getApiUrl(`api/usuarios/${this.usuarioSeleccionado._id}`),
          { equipos: this.usuarioSeleccionado.equipos },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Actualizar la lista de usuarios
        const userIndex = this.usuarios.findIndex(u => u._id === this.usuarioSeleccionado._id);
        if (userIndex !== -1) {
          this.usuarios[userIndex].equipos = [...this.usuarioSeleccionado.equipos];
        }
        
        // 🚀 OPTIMIZACIÓN: Invalidar caché después de eliminar equipo
        this.invalidarCache();
        
        console.log('✅ Equipo eliminado correctamente');
      } catch (err) {
        console.error('❌ Error al eliminar equipo:', err);
        alert('Error al eliminar el equipo. Intente nuevamente.');
      }
    },
    
    // Volver al dashboard
    volverDashboard() {
      this.$router.push({ path: '/dashboard' });
    },
    
    // 🚀 OPTIMIZACIÓN: Método para invalidar caché
    invalidarCache() {
      this.usuariosCache = null;
      this.equiposCache = null;
      this.cacheTimestamp = null;
      console.log('🗑️ Caché invalidado');
    }
  },
};
</script>

<style scoped>
.dashboard-container {
  padding: 40px 32px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.10);
  max-width: 1100px;
  margin: 40px auto;
  min-height: 80vh;
  position: relative;
}

.header-container {
  display: flex;
  align-items: center;
  margin-bottom: 2rem;
}

.logo {
  width: 60px;
  margin-right: 1rem;
}

.logo img {
  width: 100%;
  height: auto;
}

h1 {
  font-size: 1.8rem;
  color: #1565c0;
  margin: 0;
}

.search-bar {
  display: flex;
  margin-bottom: 2rem;
  max-width: 500px;
}

.search-bar input {
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #ddd;
  border-radius: 8px 0 0 8px;
  font-size: 1rem;
}

.search-bar button {
  background: #1565c0;
  color: white;
  border: none;
  border-radius: 0 8px 8px 0;
  padding: 0 16px;
  cursor: pointer;
}

.table-container {
  width: 100%;
  margin-bottom: 2rem;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.table-scroll-container {
  width: 100%;
  overflow-x: auto;
  overflow-y: auto;
  max-height: 65vh;
}

.user-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.user-table th,
.user-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.user-table th {
  background: #f8f9fa;
  font-weight: 600;
  color: #333;
}

.user-table tbody tr:hover {
  background: #f8f9fa;
}

.equipos-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.equipo-item {
  padding: 6px 10px;
  border-radius: 6px;
  background-color: #f5f5f5;
  transition: all 0.2s ease;
  color: #333; /* Asegurando que el texto sea oscuro */
}

.equipo-item:hover {
  background-color: #e3f2fd;
  transform: translateX(3px);
}

.equipo-principal {
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333; /* Asegurando que el texto sea oscuro */
}

/* Estilo para las celdas de la tabla */
.table-cell {
  color: #333;
  padding: 10px;
}

.equipo-numero {
  background-color: #1565c0;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
}

.equipo-info {
  flex: 1;
}

.badge-principal {
  background-color: #4caf50;
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: auto;
}

.no-equipos {
  color: #888;
  font-style: italic;
}

.btn-action {
  background: #1565c0;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 0.85rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-action:hover {
  background: #0d47a1;
}

.icon {
  font-size: 1.1rem;
}

.no-results {
  text-align: center;
  padding: 2rem;
  color: #888;
  font-style: italic;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #1565c0;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
}

.equipos-container {
  padding: 24px;
  overflow-y: auto;
  max-height: 50vh;
}

.no-equipos-message {
  text-align: center;
  padding: 2rem;
  color: #888;
  font-style: italic;
}

.equipos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.equipo-card {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.equipo-foto {
  width: 100%;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 10px;
  border-radius: 6px;
  overflow: hidden;
  background-color: #f5f5f5;
}

.equipo-imagen {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.equipo-imagen-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  color: #999;
  font-size: 14px;
  background-color: #eee;
}

.equipo-header {
  background: #f8f9fa;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #eee;
}

.equipo-header h4 {
  margin: 0;
  color: #333;
}

.btn-delete {
  background: none;
  border: none;
  color: #f44336;
  font-size: 1.2rem;
  cursor: pointer;
}

.equipo-details {
  padding: 16px;
}

.equipo-details p {
  margin: 8px 0;
  font-size: 0.9rem;
}

.equipo-accesorios {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.accesorio {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  background: #f0f0f0;
  color: #888;
}

.accesorio.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f8f9fa;
}

.form-container {
  padding: 24px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
}

.form-group textarea {
  min-height: 80px;
  resize: vertical;
}

.checkbox-group {
  display: flex;
  gap: 24px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.btn {
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn.primary {
  background: #1565c0;
  color: white;
}

.btn.primary:hover {
  background: #0d47a1;
}

.btn.primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn.secondary {
  background: #f0f0f0;
  color: #333;
}

.btn.secondary:hover {
  background: #e0e0e0;
}

.dashboard-btn-wrapper {
  margin-top: 2rem;
  display: flex;
  justify-content: flex-end;
}

.btn-volver-dashboard {
  background: #1565c0;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
}

.btn-volver-dashboard:hover {
  background: #0d47a1;
}

/* Loading and error styles - COMPLETAMENTE RENOVADO */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 2rem 1rem;
  min-height: 70vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  margin: 1rem 0;
}

.loading-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 3rem;
}

.loading-animation {
  position: relative;
  width: 120px;
  height: 120px;
  margin-bottom: 2rem;
}

.pulse-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border: 3px solid rgba(21, 101, 192, 0.3);
  border-radius: 50%;
  animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
}

.pulse-ring.delay-1 {
  animation-delay: 0.3s;
  border-color: rgba(66, 165, 245, 0.3);
}

.pulse-ring.delay-2 {
  animation-delay: 0.6s;
  border-color: rgba(100, 181, 246, 0.3);
}

@keyframes pulse-ring {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) scale(2);
    opacity: 0;
  }
}

.loading-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(21, 101, 192, 0.2);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
  50% { transform: translate(-50%, -50%) translateY(-10px); }
}

.loading-content {
  max-width: 400px;
}

.loading-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  background: linear-gradient(135deg, #1565c0, #42a5f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.loading-subtitle {
  font-size: 1rem;
  color: #64748b;
  margin: 0 0 2rem 0;
  line-height: 1.5;
}

.loading-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  min-width: 80px;
  animation: stat-bounce 2s ease-in-out infinite;
}

.stat-item:nth-child(1) { animation-delay: 0s; }
.stat-item:nth-child(2) { animation-delay: 0.2s; }
.stat-item:nth-child(3) { animation-delay: 0.4s; }

@keyframes stat-bounce {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

.stat-icon {
  font-size: 1.5rem;
  filter: grayscale(0.3);
}

.stat-item span {
  font-size: 0.8rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.loading-progress-modern {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.progress-track {
  width: 200px;
  height: 6px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 3px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.progress-fill-modern {
  height: 100%;
  background: linear-gradient(90deg, #1565c0, #42a5f5, #64b5f6);
  background-size: 200% 100%;
  border-radius: 3px;
  animation: progress-modern 2s ease-in-out infinite;
}

@keyframes progress-modern {
  0% { 
    width: 0%; 
    background-position: 0% 50%;
  }
  50% { 
    width: 70%; 
    background-position: 100% 50%;
  }
  100% { 
    width: 100%; 
    background-position: 0% 50%;
  }
}

.progress-dots {
  display: flex;
  gap: 0.5rem;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e1;
  animation: dot-pulse 1.5s ease-in-out infinite;
}

.dot.active {
  background: #1565c0;
}

.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-pulse {
  0%, 100% { 
    transform: scale(1);
    opacity: 0.7;
  }
  50% { 
    transform: scale(1.2);
    opacity: 1;
  }
}

/* Skeleton loader moderno */
.skeleton-preview {
  width: 100%;
  max-width: 800px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.skeleton-header-modern {
  padding: 1.5rem;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-bottom: 1px solid #e2e8f0;
}

.skeleton-title {
  font-size: 1rem;
  font-weight: 600;
  color: #64748b;
  text-align: center;
}

.skeleton-table-modern {
  padding: 1rem;
}

.skeleton-table-header {
  display: grid;
  grid-template-columns: 1fr 2fr 1.5fr 2fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
}

.skeleton-table-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-row-modern {
  display: grid;
  grid-template-columns: 1fr 2fr 1.5fr 2fr 1fr;
  gap: 1rem;
  padding: 0.75rem 0;
}

.skeleton-cell-modern {
  height: 20px;
  border-radius: 6px;
  overflow: hidden;
  background: #f1f5f9;
}

.skeleton-cell-modern.header {
  height: 16px;
  background: #e2e8f0;
}

.skeleton-shimmer {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.8) 50%,
    transparent 100%
  );
  background-size: 200% 100%;
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* Responsive design para loading */
@media (max-width: 768px) {
  .loading-stats {
    gap: 1rem;
  }
  
  .stat-item {
    min-width: 60px;
    padding: 0.75rem;
  }
  
  .stat-icon {
    font-size: 1.2rem;
  }
  
  .skeleton-table-header,
  .skeleton-row-modern {
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0.5rem;
  }
  
  .skeleton-cell-modern:nth-child(4),
  .skeleton-cell-modern:nth-child(5) {
    display: none;
  }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
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

.error-container p {
  color: #d32f2f;
  margin-bottom: 1rem;
}

/* Load more button styles */
.load-more-container {
  display: flex;
  justify-content: center;
  padding: 2rem 0;
  border-top: 1px solid #eee;
  margin-top: 1rem;
}

.btn-load-more {
  background: #1565c0;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-load-more:hover {
  background: #0d47a1;
}

.btn-load-more:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 20px 16px;
    margin: 20px auto;
  }
  
  .equipos-grid {
    grid-template-columns: 1fr;
  }
  
  .user-table th,
  .user-table td {
    padding: 8px 12px;
  }
}
</style>