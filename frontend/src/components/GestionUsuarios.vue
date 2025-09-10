<template>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="logo-container">
        <img src="@/assets/logo.png" alt="Logo" class="logo-img" />
      </div>
      <div class="search-container">
        <div class="search-wrapper">
          <i class="search-icon">🔍</i>
          <input
            type="text"
            placeholder="Buscar por número de documento"
            class="search-input"
            v-model="searchQuery"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">✕</button>
        </div>
      </div>
      <button class="dashboard-btn" @click="goToDashboard">Dashboard</button>
    </header>

    <!-- Indicador de carga principal -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">Cargando usuarios...</div>
      </div>
    </div>
    
    <!-- Mensajes de estado -->
    <div v-if="error" class="status-message error">
      <i class="status-icon">⚠️</i> {{ error }}
    </div>
    <div v-if="successMessage" class="status-message success">
      <i class="status-icon">✅</i> {{ successMessage }}
    </div>

    <!-- Tabla -->
    <table v-if="!loading">
      <thead>
        <tr>
          <th>Foto</th>
          <th>Tipo de Usuario</th>
          <th>Nombre</th>
          <th>Tipo de Documento</th>
          <th>Documento</th>
          <th>Email</th>
          <th>Marca del Equipo</th>
          <th>Serial del Equipo</th>
          <th>Características</th>
          <th>Ratón</th>
          <th>Cargador</th>
          <th>Editar</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(usuario, idx) in usuariosFiltrados" :key="usuario._id || idx">
          <td class="photo-cell">
            <img v-if="usuario.foto" :src="usuario.foto" alt="Foto de usuario" class="user-photo" @click="mostrarImagenAmpliada(usuario.foto)" />
            <div v-else class="no-photo">Sin foto</div>
          </td>
          <td>{{ usuario.tipoUsuario }}</td>
          <td>{{ usuario.nombre }}</td>
          <td>{{ usuario.tipoDocumento }}</td>
          <td>{{ usuario.numeroDocumento }}</td>
          <td>{{ usuario.email }}</td>
          <td>{{ usuario.marcaEquipo }}</td>
          <td>{{ usuario.serialEquipo }}</td>
          <td>{{ usuario.caracteristicas }}</td>
          <td class="icon-cell">{{ usuario.mouse ? '✔️' : '❌' }}</td>
          <td class="icon-cell">{{ usuario.cargador ? '✔️' : '❌' }}</td>
          <td>
            <button class="edit-btn" @click="editItem(idx)">
              ✏️ Editar
            </button>
          </td>
        </tr>
        <tr v-if="usuariosFiltrados.length === 0">
          <td colspan="12" class="no-results">No se encontraron usuarios</td>
        </tr>
      </tbody>
    </table>
    
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
  </div>
</template>

<script>
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
      // Datos para paginación
      pagination: {
        total: 0,
        page: 1,
        limit: 10,
        pages: 0
      },
      loadingMore: false
    };
  },
  created() {
    this.cargarUsuariosConCache();
  },
  computed: {
    usuariosFiltrados() {
      if (!this.searchQuery) return this.usuarios;
      
      const query = this.searchQuery.toLowerCase();
      return this.usuarios.filter(usuario => 
        (usuario.numeroDocumento && usuario.numeroDocumento.toLowerCase().includes(query)) ||
        (usuario.nombre && usuario.nombre.toLowerCase().includes(query))
      );
    }
  },
  methods: {
    cargarUsuariosConCache() {
      // Intentar cargar desde caché primero
      const cachedData = localStorage.getItem('usuariosCache');
      const cachedTimestamp = localStorage.getItem('usuariosCacheTimestamp');
      const currentTime = new Date().getTime();
      
      // Verificar si hay datos en caché y si no han pasado más de 5 minutos
      if (cachedData && cachedTimestamp && (currentTime - cachedTimestamp < 5 * 60 * 1000)) {
        try {
          const parsedData = JSON.parse(cachedData);
          this.usuarios = parsedData.usuarios;
          this.pagination = parsedData.pagination;
          console.log('Datos cargados desde caché');
          
          // Cargar datos actualizados en segundo plano
          setTimeout(() => {
            this.cargarUsuarios();
          }, 1000);
        } catch (e) {
          console.error('Error al parsear caché:', e);
          this.cargarUsuarios();
        }
      } else {
        // Si no hay caché o está expirada, cargar desde el servidor
        this.cargarUsuarios();
      }
    },
    
    validarFoto(foto) {
      // Asegurarse de que la foto sea una cadena base64 válida
      if (foto && typeof foto === 'string' && foto.startsWith('data:image')) {
        console.log('Foto válida detectada en edición');
        // Comprimir la imagen antes de devolverla
        return this.comprimirImagen(foto);
      } else if (foto) {
        console.log('Formato de foto no válido en edición:', typeof foto);
      }
      return null;
    },
    
    // Método para comprimir imágenes
    async comprimirImagen(base64Str) {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          // Determinar el tamaño objetivo (máximo 500px de ancho o alto)
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
          
          // Crear canvas para la compresión
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          // Dibujar imagen redimensionada
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convertir a base64 con calidad reducida
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
        // Obtener token del localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        const url = new URL('http://localhost:3000/api/usuario-equipo/listar');
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
        
        // Actualizar datos de paginación
        this.pagination = data.pagination;
        
        if (resetPage) {
          this.usuarios = data.usuarios;
          
          // Guardar en caché
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
          // Añadir nuevos usuarios a la lista existente
          this.usuarios = [...this.usuarios, ...data.usuarios];
        }
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
      // Esperar a que el DOM se actualice antes de acceder a la referencia del video
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
        // Comprimir la imagen antes de asignarla
        const fotoComprimida = await this.comprimirImagen(fotoData);
        this.usuarioEdit.foto = fotoComprimida;
        this.cerrarCamara();
      } catch (error) {
        console.error('Error al capturar foto:', error);
      }
    },

    cerrarCamara() {
      this.mostrarCamara = false;
      const stream = this.$refs.video?.srcObject;
      if (stream) stream.getTracks().forEach(t => t.stop());
    },

    subirArchivo() {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = e => {
        const file = e.target.files[0];
        if (file) {
          console.log('Archivo seleccionado en edición:', file.name, file.type, file.size, 'bytes');
          const reader = new FileReader();
          reader.onload = ev => {
            const imageData = ev.target.result;
            console.log('Imagen cargada en edición:', imageData.substring(0, 50) + '...');
            this.usuarioEdit.foto = imageData;
            this.mostrarOpcionesFoto = false;
          };
          reader.onerror = error => {
            console.error('Error al leer el archivo en edición:', error);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    },

    async guardarUsuario() {
      if (!this.usuarioEdit._id) {
        this.cerrarModal();
        return;
      }
      
      this.loading = true;
      this.error = null;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        console.log('Enviando datos de usuario para actualizar:', {
          nombre: this.usuarioEdit.nombre,
          tipoDocumento: this.usuarioEdit.tipoDocumento,
          numeroDocumento: this.usuarioEdit.numeroDocumento,
          foto: this.usuarioEdit.foto ? 'Foto presente (base64)' : 'Sin foto'
        });
        
        const fotoValidada = this.validarFoto(this.usuarioEdit.foto);
        console.log('Foto validada:', fotoValidada ? 'Foto válida presente' : 'Sin foto válida');
        
        const response = await fetch(`http://localhost:3000/api/usuario-equipo/${this.usuarioEdit._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: this.usuarioEdit.nombre,
            tipoDocumento: this.usuarioEdit.tipoDocumento,
            numeroDocumento: this.usuarioEdit.numeroDocumento, // Corregido: usar numeroDocumento en lugar de documento
            foto: fotoValidada
          })
        });
        
        if (!response.ok) {
          throw new Error(`Error al actualizar usuario: ${response.statusText}`);
        }
        
        const usuarioActualizado = await response.json();
        
        // Actualizar el usuario en la lista local
        if (this.usuarioEditIdx !== null) {
          this.usuarios[this.usuarioEditIdx] = {
            ...usuarioActualizado
            // Ya no necesitamos mapear numeroDocumento a documento
          };
        }
        
        this.successMessage = "Usuario actualizado correctamente";
        setTimeout(() => {
          this.successMessage = null;
        }, 3000);
        
        this.cerrarModal();
      } catch (error) {
        console.error('Error al actualizar usuario:', error);
        this.error = `Error al actualizar usuario: ${error.message}`;
      } finally {
        this.loading = false;
      }
    },
    goToDashboard() {
      this.$router.push('/dashboard');
    },
    mostrarImagenAmpliada(imagen) {
      this.imagenAmpliada = imagen;
      this.imagenAmpliadaVisible = true;
    },
    cerrarImagenAmpliada() {
      this.imagenAmpliadaVisible = false;
      this.imagenAmpliada = null;
    },
  },
};
</script>

<style scoped>
/* General Layout */
.container {
  margin-top: 80px;
  padding: 0 15px;
  max-width: 100%;
  box-sizing: border-box;
}

/* Estilos para las fotos */
.photo-cell {
  width: 60px;
  text-align: center;
}

.user-photo {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #3498db;
  cursor: pointer;
  transition: transform 0.2s;
}

.user-photo:hover {
  transform: scale(1.1);
}

.no-photo {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #f0f0f0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  margin: 0 auto;
}

.modal-photo {
  text-align: center;
  margin-bottom: 20px;
}

.edit-user-photo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #3498db;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.photo-btn {
  margin-top: 10px;
  padding: 6px 12px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.photo-btn:hover {
  background-color: #2980b9;
}

.foto-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.foto-modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.foto-modal-content button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.foto-modal-content button:not(.cerrar) {
  background-color: #3498db;
  color: white;
}

.foto-modal-content button:not(.cerrar):hover {
  background-color: #2980b9;
}

.foto-modal-content .cerrar {
  background-color: #e74c3c;
  color: white;
}

.foto-modal-content .cerrar:hover {
  background-color: #c0392b;
}

.camara-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.camara-container video {
  max-width: 90%;
  max-height: 70%;
  border: 3px solid white;
  border-radius: 8px;
}

.camara-container button {
  margin-top: 15px;
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: #3498db;
  color: white;
  transition: background-color 0.3s;
}

.camara-container button:hover {
  background-color: #2980b9;
}

.no-photo-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: #f0f0f0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  margin: 0 auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 40px;
}

.search-container {
  flex-grow: 1;
  margin: 0 20px;
  max-width: 500px;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  color: #757575;
  font-style: normal;
}

.search-input {
  width: 100%;
  padding: 10px 15px 10px 35px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #2196F3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
  outline: none;
}

.clear-search {
  position: absolute;
  right: 10px;
  background: none;
  border: none;
  color: #757575;
  cursor: pointer;
  font-size: 16px;
}

.dashboard-btn {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.dashboard-btn:hover {
  background-color: #0d8aee;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

table {
  margin-top: 20px;
}

/* Mensajes de estado */
.status-message {
  padding: 15px;
  margin: 20px auto;
  border-radius: 8px;
  width: 90%;
  max-width: 1200px;
  text-align: center;
  box-shadow: 0 3px 10px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

/* Estilos para el indicador de carga principal */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(30, 41, 59, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
}

.loading-content {
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  padding: 30px 50px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateY(-20px);
  animation: fadeInUp 0.5s ease forwards;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(52, 152, 219, 0.2);
  border-top: 4px solid #3498db;
  border-left: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
}

.loading-text {
  margin-top: 20px;
  font-size: 18px;
  font-weight: 500;
  color: #2c3e50;
  letter-spacing: 0.5px;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.status-icon {
  margin-right: 10px;
  font-size: 18px;
  font-style: normal;
}

.loading {
  background-color: #e3f2fd;
  color: #0d47a1;
  border-left: 4px solid #0d47a1;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

.error {
  background-color: #ffebee;
  color: #c62828;
  border-left: 4px solid #c62828;
}

.success {
  background-color: #e8f5e9;
  color: #2e7d32;
  border-left: 4px solid #2e7d32;
}

.no-results {
  text-align: center;
  padding: 30px;
  font-style: italic;
  color: #757575;
  background-color: #f5f5f5;
  border-radius: 8px;
  margin: 20px auto;
  width: 90%;
  max-width: 1200px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

/* Header */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 20px;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
}
.logo-container {
  display: flex;
  align-items: center;
}
.logo-img {
  width: 150px; /* Aumenta el tamaño del logo */
  height: auto;
}
.dashboard-btn {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
}
.dashboard-btn:hover {
  background-color: #0056b3;
}

/* Buscador */
.search-container {
  display: flex;
  justify-content: center;
  margin-top: 5px; /* Reducir espacio superior */
  margin-bottom: 10px; /* Reducir espacio inferior */
}
.search-input {
  padding: 8px 14px;
  border-radius: 10px;
  border: 1px solid #ccc;
  font-size: 1rem;
}

/* Tabla */
table {
  margin: 0 auto;
  border-collapse: collapse;
  width: 90%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  margin-top: 10px; /* Subir la tabla */
}

/* Estilos para la paginación y carga */
.load-more-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 20px;
  margin-bottom: 30px;
}

.loading-indicator {
  padding: 15px;
  color: #2c3e50;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  margin: 10px 0;
  min-width: 220px;
}

.loading-dot-container {
  display: flex;
  margin-right: 10px;
}

.loading-dot {
  width: 8px;
  height: 8px;
  margin: 0 2px;
  background-color: #3498db;
  border-radius: 50%;
  display: inline-block;
  animation: dotPulse 1.4s infinite ease-in-out;
}

.loading-dot:nth-child(1) {
  animation-delay: 0s;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotPulse {
  0%, 80%, 100% { 
    transform: scale(0.8);
    opacity: 0.6;
  }
  40% { 
    transform: scale(1);
    opacity: 1;
  }
}

.load-more-btn {
  padding: 12px 24px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(52, 152, 219, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.load-more-btn:hover {
  background-color: #2980b9;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(52, 152, 219, 0.3);
}

.load-more-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(52, 152, 219, 0.2);
}

.pagination-info {
  margin-top: 12px;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 500;
  background-color: #f8f9fa;
  padding: 8px 16px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
thead {
  background: #0d47a1;
  color: white;
  position: sticky;
  top: 0;
}
th, td {
  padding: 12px;
  text-align: center;
  font-size: 0.95rem;
}
tbody tr:nth-child(even) {
  background: #f9f9f9;
}
tbody tr:hover {
  background-color: #f1f8e9;
  transition: background-color 0.2s;
}

/* Responsive Design */
@media screen and (max-width: 768px) {
  .container {
    margin-top: 60px;
    padding: 0 10px;
  }
  
  table {
    display: block;
    overflow-x: auto;
    width: 95%;
  }
  
  th, td {
    padding: 8px 10px;
    min-width: 100px;
    font-size: 0.9rem;
  }
}

@media screen and (max-width: 480px) {
  .header {
    flex-direction: column;
    gap: 10px;
  }
  
  .search-input {
    width: 100%;
  }
  
  .edit-btn {
    padding: 6px 10px;
    font-size: 0.9rem;
  }
}

/* Botón editar */
.edit-btn {
  background: #1565c0;
  border: none;
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
.edit-btn:hover {
  background: #0d47a1;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

/* Estilos para la imagen ampliada */
.imagen-ampliada-container {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  background-color: white;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.imagen-ampliada {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.cerrar-imagen-btn {
  position: absolute;
  top: -15px;
  right: -15px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #e74c3c;
  color: white;
  border: none;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 90%;
  max-width: 450px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: modalFade 0.3s ease;
}

@keyframes modalFade {
  from {opacity: 0; transform: translateY(-20px);}
  to {opacity: 1; transform: translateY(0);}
}

.modal-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 1rem;
  margin-bottom: 15px;
}

.checkbox-field {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.modal-field input[type="text"],
.modal-field input[type="email"],
.modal-field select,
.modal-field textarea {
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border 0.3s ease, box-shadow 0.3s ease;
}

.modal-field input[type="text"]:focus,
.modal-field input[type="email"]:focus,
.modal-field select:focus,
.modal-field textarea:focus {
  border-color: #1565c0;
  outline: none;
  box-shadow: 0 0 0 2px rgba(21, 101, 192, 0.2);
}

.modal-field textarea {
  min-height: 80px;
  resize: vertical;
}
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 10px;
}
.save-btn {
  background: #2e7d32;
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}
.save-btn:hover {
  background: #1b5e20;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}
.close-btn {
  background: #c62828;
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}
.close-btn:hover {
  background: #8e0000;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

@media screen and (max-width: 480px) {
  .modal-content {
    width: 95%;
    padding: 20px;
  }
  
  .modal-actions {
    flex-direction: column;
    gap: 10px;
  }
  
  .save-btn, .close-btn {
    width: 100%;
    padding: 12px;
  }
}
</style>