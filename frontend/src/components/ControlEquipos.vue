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

    <!-- Estado de carga -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Cargando usuarios y equipos...</p>
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
  
  // Método para buscar
  onSearch() {
    // La búsqueda se maneja automáticamente a través de la propiedad computada filteredUsers
    console.log('Buscando:', this.searchQuery);
  },
  methods: {
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
    // Cargar usuarios desde el backend
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
        
        // Cargamos la lista de usuarios con paginación para mejorar rendimiento
        const usuariosResponse = await axios.get(getApiUrl(`api/usuario-equipo/listar?page=${this.paginaActual}&limit=${this.usuariosPorPagina}`), {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Asegurarnos de que this.usuarios sea un array
        this.usuarios = Array.isArray(usuariosResponse.data) ? usuariosResponse.data : 
                       (usuariosResponse.data && Array.isArray(usuariosResponse.data.usuarios) ? 
                        usuariosResponse.data.usuarios : []);
        
        // Actualizar total de usuarios si está disponible
        if (usuariosResponse.data && usuariosResponse.data.total) {
          this.totalUsuarios = usuariosResponse.data.total;
        }
        
        // Procesar usuarios para asegurar que todos tengan un array de equipos
        if (Array.isArray(this.usuarios)) {
          this.usuarios = this.usuarios.map(usuario => {
            // Asegurarse de que el usuario tenga un array de equipos
            if (!usuario.equipos) {
              usuario.equipos = [];
            }
            
            // Si el usuario tiene un objeto equipo, asegurarse de que esté correctamente formateado
            if (usuario.equipo && typeof usuario.equipo === 'object' && usuario.equipo.serial) {
              // Crear un objeto de equipo principal completo
              const equipoPrincipal = {
                nombre: usuario.equipo.marca || usuario.equipo.nombre || 'Equipo',
                serial: usuario.equipo.serial || '',
                caracteristicas: usuario.equipo.caracteristicas || '',
                mouse: usuario.equipo.accesorios?.mouse || usuario.mouse || false,
                cargador: usuario.equipo.accesorios?.cargador || usuario.cargador || false,
                foto: usuario.equipo.foto || null,
                _id: usuario.equipo._id || `temp-${Date.now()}`
              };
              
              // Verificar si el equipo principal ya existe en el array por serial
              const equipoExistenteIndex = usuario.equipos.findIndex(e => e.serial === usuario.equipo.serial);
              
              if (equipoExistenteIndex >= 0) {
                // Actualizar el equipo existente y asegurarse de que esté en la primera posición
                usuario.equipos.splice(equipoExistenteIndex, 1);
                usuario.equipos.unshift(equipoPrincipal);
              } else {
                // Añadir el equipo principal al inicio del array de equipos
                usuario.equipos.unshift(equipoPrincipal);
              }
            } else if (usuario.equipo && typeof usuario.equipo === 'string') {
              // Si equipo es un string (posiblemente un ID), crear un objeto equipo básico
              console.log(`Usuario ${usuario.nombre} tiene equipo principal como string: ${usuario.equipo}`);
              
              // Crear objeto de equipo
              const equipoPrincipal = {
                nombre: usuario.marcaEquipo || 'Equipo',
                serial: usuario.serialEquipo || 'Equipo-' + usuario.equipo.substring(0, 8),
                caracteristicas: usuario.caracteristicas || '',
                mouse: usuario.mouse || false,
                cargador: usuario.cargador || false,
                foto: null,
                _id: usuario.equipo
              };
              
              // Actualizar el equipo del usuario
              usuario.equipo = equipoPrincipal;
              
              // Añadir al array de equipos si no existe
              const equipoExistente = usuario.equipos.find(e => e.serial === equipoPrincipal.serial);
              if (!equipoExistente) {
                usuario.equipos.unshift(equipoPrincipal);
              }
            } else if (usuario.serialEquipo) {
              // Si no hay equipo pero hay datos de serialEquipo, crear un equipo a partir de esos datos
              console.log(`Usuario ${usuario.nombre} tiene datos de equipo en campos separados`);
              
              const equipoPrincipal = {
                nombre: usuario.marcaEquipo || 'Equipo',
                serial: usuario.serialEquipo,
                caracteristicas: usuario.caracteristicas || '',
                mouse: usuario.mouse || false,
                cargador: usuario.cargador || false,
                foto: null,
                _id: `temp-${Date.now()}`
              };
              
              // Actualizar el equipo del usuario
              usuario.equipo = equipoPrincipal;
              
              // Añadir al array de equipos
              usuario.equipos.unshift(equipoPrincipal);
            } else {
              console.log(`Usuario ${usuario.nombre} no tiene equipo principal definido`);
            }
            
            return usuario;
          });

        }
        
        // Ahora cargamos los equipos usando paginación escalable
        await this.cargarEquiposPaginados();
        
        console.log('✅ Usuarios y equipos cargados:', Array.isArray(this.usuarios) ? this.usuarios.length : 0);
        // Mostrar equipos de cada usuario para depuración
        if (Array.isArray(this.usuarios)) {
          this.usuarios.forEach(usuario => {
            console.log(`👤 Usuario ${usuario.nombre}: Equipos: ${usuario.equipos?.length || 0}`);
            // Mostrar detalles de todos los equipos para depuración
            if (usuario.equipos && usuario.equipos.length > 0) {
              console.log(`   Equipos de ${usuario.nombre}:`, JSON.stringify(usuario.equipos.map(e => ({serial: e.serial, _id: e._id}))));
            }
          });
        }
      } catch (err) {
        console.error('❌ Error cargando usuarios y equipos:', err);
        this.error = 'Error al cargar los datos. Verifique su conexión.';
      } finally {
        this.loading = false;
      }
    },

    // Método para cargar equipos de forma paginada y escalable
    async cargarEquiposPaginados() {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        let paginaActual = 1;
        let totalCargado = 0;
        let hayMasPaginas = true;

        // Crear mapa de usuarios por documento para acceso rápido
        const usuariosPorDocumento = {};
        if (Array.isArray(this.usuarios)) {
          this.usuarios.forEach(usuario => {
            if (usuario && (usuario.numeroDocumento || usuario.documento)) {
              usuariosPorDocumento[usuario.numeroDocumento || usuario.documento] = usuario;
            }
          });
        }

        console.log('🔄 Iniciando carga paginada de equipos...');

        while (hayMasPaginas && totalCargado < 50000) { // Límite de seguridad
          const equiposResponse = await axios.get(
            getApiUrl(`api/equipos/listar?page=${paginaActual}&limit=${this.equiposPorPagina}`), 
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (equiposResponse.data && equiposResponse.data.equipos) {
            const equipos = equiposResponse.data.equipos;
            
            // Procesar equipos de esta página
            equipos.forEach(equipo => {
              const documento = equipo.usuario?.documento;
              if (documento && usuariosPorDocumento[documento]) {
                const usuario = usuariosPorDocumento[documento];
                
                // Verificar si el equipo ya existe por serial
                const equipoExistente = usuario.equipos.find(e => e.serial === equipo.serial);
                if (!equipoExistente) {
                  usuario.equipos.push({
                    nombre: equipo.marca,
                    serial: equipo.serial,
                    caracteristicas: equipo.caracteristicas,
                    mouse: equipo.accesorios?.mouse || false,
                    cargador: equipo.accesorios?.cargador || false,
                    foto: equipo.foto || null,
                    _id: equipo._id
                  });
                }
              }
            });

            totalCargado += equipos.length;
            
            // Verificar si hay más páginas
            if (equipos.length < this.equiposPorPagina) {
              hayMasPaginas = false;
            } else {
              paginaActual++;
            }

            console.log(`📦 Página ${paginaActual - 1}: ${equipos.length} equipos cargados. Total: ${totalCargado}`);
          } else {
            hayMasPaginas = false;
          }
        }

        this.equiposCargados = true;
        console.log(`✅ Carga de equipos completada. Total equipos procesados: ${totalCargado}`);
        
      } catch (error) {
        console.error('❌ Error cargando equipos paginados:', error);
      }
    },

    // Método para cargar más usuarios si es necesario
    async cargarMasUsuarios() {
      if (this.usuarios.length >= this.totalUsuarios) return;

      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        this.paginaActual++;
        const usuariosResponse = await axios.get(
          getApiUrl(`api/usuario-equipo/listar?page=${this.paginaActual}&limit=${this.usuariosPorPagina}`), 
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const nuevosUsuarios = Array.isArray(usuariosResponse.data) ? usuariosResponse.data : 
                              (usuariosResponse.data && Array.isArray(usuariosResponse.data.usuarios) ? 
                               usuariosResponse.data.usuarios : []);

        if (nuevosUsuarios.length > 0) {
          // Procesar nuevos usuarios
          const usuariosProcesados = nuevosUsuarios.map(usuario => {
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
              usuario.equipos.unshift(equipoPrincipal);
            }
            return usuario;
          });

          this.usuarios.push(...usuariosProcesados);
          console.log(`📄 Página ${this.paginaActual}: ${nuevosUsuarios.length} usuarios adicionales cargados`);
        }
      } catch (error) {
        console.error('❌ Error cargando más usuarios:', error);
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
        
        console.log('✅ Equipo eliminado correctamente');
      } catch (err) {
        console.error('❌ Error al eliminar equipo:', err);
        alert('Error al eliminar el equipo. Intente nuevamente.');
      }
    },
    
    // Volver al dashboard
    volverDashboard() {
      this.$router.push({ path: '/dashboard' });
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

/* Loading and error styles */
.loading-container,
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