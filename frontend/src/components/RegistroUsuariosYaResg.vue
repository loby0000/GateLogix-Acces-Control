<template>
  <div class="registro-usuarios">
    <!-- Header -->
    <header class="header">
      <img src="../assets/logo.png" alt="Logo" class="logo" />
      <h1>Registro De Usuarios Con Equipo</h1>
    </header>

    <!-- Controles -->
    <div class="controls">
      <div class="buscar-documento">
        <input
          type="text"
          placeholder="Buscar por documento..."
          v-model="buscarDocumento"
        />
        <button @click="buscar">Buscar</button>
      </div>

      <!-- Select tipo de registro -->
      <div class="tipo-registro">
        <select v-model="tipoRegistro">
          <option value="Registrar">Registrar</option>
          <option value="Registrado">Registrado</option>
        </select>
      </div>
    </div>

    <!-- Tabla -->
    <table class="tabla-registro" v-if="usuarios.length > 0">
      <thead>
        <tr>
          <th>Foto</th>
          <th>Tipo De Usuario</th>
          <th>Tipo De Documento</th>
          <th>Documento</th>
          <th>Nombre</th>
          <th>Equipo</th>
          <th>Serial</th>
          <th>Características</th>
          <th>Mouse</th>
          <th>Cargador</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(usuario, index) in usuarios" :key="usuario.numeroDocumento">
          <!-- Columna de foto -->
          <td class="foto-cell">
            <div class="foto-container">
              <img 
                v-if="usuario.foto" 
                :src="usuario.foto" 
                :alt="`Foto de ${usuario.nombre}`"
                class="user-photo"
                @click="mostrarFotoAmpliada(usuario.foto)"
                @error="handleImageError"
              />
              <div v-else class="no-photo">
                <span>Sin foto</span>
              </div>
            </div>
          </td>
          
          <td>{{ usuario.tipoUsuario }}</td>
          <td>{{ usuario.tipoDocumento }}</td>
          <td>{{ usuario.numeroDocumento }}</td>
          <td>{{ usuario.nombre }}</td>

          <!-- Celda de equipo con menú -->
          <td class="equipo-cell">
            <span>{{ getEquipoPrincipal(usuario)?.marca || '-' }}</span>
            <button
              class="kebab-btn"
              aria-label="Más opciones de equipo"
              @click.stop="toggleEquipoMenu(index)"
            >
              :
            </button>
          </td>

          <td>{{ getEquipoPrincipal(usuario)?.serial || '-' }}</td>
          <td>{{ getEquipoPrincipal(usuario)?.caracteristicas || '-' }}</td>
          <td>{{ getEquipoPrincipal(usuario)?.accesorios?.mouse ? 'Sí' : 'No' }}</td>
          <td>{{ getEquipoPrincipal(usuario)?.accesorios?.cargador ? 'Sí' : 'No' }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Si no hay resultados -->
    <p v-else style="text-align:center; margin-top:20px;">No hay información para mostrar.</p>

    <!-- Botón interactivo Ingreso/Salida -->
    <div class="accion-btn" v-if="usuarios.length > 0">
      <button 
        :class="{
          'btn': true,
          'btn-success': estadoUsuario === 'Egreso',
          'btn-danger': estadoUsuario === 'Ingreso'
        }"
        @click="registrarMovimiento"
        :disabled="cargandoMovimiento"
      >
        <span v-if="cargandoMovimiento" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        {{ estadoUsuario === 'Egreso' ? 'Registrar Ingreso ✅' : 'Registrar Salida ❌' }}
      </button>
      
      <!-- Información del estado actual -->
      <div class="estado-info">
        <p class="estado-actual">
          Estado actual: 
          <span :class="['estado-badge', estadoUsuario === 'Ingreso' ? 'estado-adentro' : 'estado-afuera']">
            {{ estadoUsuario === 'Ingreso' ? 'Dentro del edificio' : 'Fuera del edificio' }}
          </span>
        </p>
        <p v-if="ultimoMovimiento" class="ultimo-movimiento">
          Último movimiento: {{ formatearFecha(ultimoMovimiento) }}
        </p>
      </div>
    </div>

    <!-- Menú de equipo como modal centrado -->
    <div
      v-if="equipoMenuAbierto !== null"
      class="modal-overlay"
      @click.self="equipoMenuAbierto = null"
    >
      <div
        class="equipo-menu"
        style="position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:320px;background:#fff;border-radius:16px;box-shadow:0 8px 28px rgba(0,0,0,0.18);z-index:2100;padding:24px 16px 16px 16px;"
      >
        <div class="equipo-menu-header">
          <button class="close-btn" @click="equipoMenuAbierto = null">✕</button>
        </div>
        <div class="equipo-list">
          <div
            v-for="(eq, i) in defaultEquipos(usuarios[equipoMenuAbierto])"
            :key="i"
            class="equipo-item"
          >
            <div class="equipo-item-nombre">{{ eq.marca }}</div>
            <div class="equipo-item-serial">{{ eq.serial }}</div>
          </div>
        </div>
        <button
          class="add-equipo-btn"
          @click="abrirModalNuevoEquipo(usuarios[equipoMenuAbierto])"
        >
          ➕ Registrar nuevo equipo
        </button>
      </div>
    </div>

    <!-- Modal para nuevo equipo -->
    <div v-if="modalAbierto" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal-content-large">
        <!-- Header del modal -->
        <div class="modal-header-large">
          <h2>Registro de Usuario con Equipo</h2>
          <button class="close-btn" @click="cerrarModal">✕</button>
        </div>

        <!-- Contenedor de dos columnas -->
        <div class="form-container-two-columns">
          <!-- Columna izquierda: Información del usuario -->
          <div class="form-column user-info-column">
            <div class="column-header">
              <h4>👤 Información del Usuario</h4>
            </div>
            <div class="user-info-display">
              <div class="info-item">
                <label>Nombre Completo</label>
                <div class="info-value">{{ usuarioSeleccionado?.nombre || 'No disponible' }}</div>
              </div>
              <div class="info-item">
                <label>Tipo de Documento</label>
                <div class="info-value">{{ usuarioSeleccionado?.tipoDocumento || 'No disponible' }}</div>
              </div>
              <div class="info-item">
                <label>Número de Documento</label>
                <div class="info-value">{{ usuarioSeleccionado?.numeroDocumento || 'No disponible' }}</div>
              </div>
              <div class="info-item">
                <label>Tipo de Usuario</label>
                <div class="info-value">{{ usuarioSeleccionado?.tipoUsuario || 'No disponible' }}</div>
              </div>
              <div class="info-item">
                <label>Equipos Actuales</label>
                <div class="equipos-actuales">
                  <div v-if="!usuarioSeleccionado?.equipos || usuarioSeleccionado.equipos.length === 0" class="no-equipos">
                    No tiene equipos registrados
                  </div>
                  <div v-else class="equipos-list-compact">
                    <div v-for="(equipo, index) in usuarioSeleccionado.equipos" :key="index" class="equipo-compact">
                      <div class="equipo-badge">{{ equipo.tipo || 'Equipo' }}</div>
                      <div class="equipo-name">{{ equipo.marca }}</div>
                      <div class="equipo-serial">{{ equipo.serial }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Columna derecha: Información del equipo -->
          <div class="form-column equipment-info-column">
            <div class="column-header">
              <h4>💻 Información del Equipo</h4>
            </div>
            <div class="form-fields">
              <div class="form-group">
                <label>Marca/Nombre del Equipo *</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="Ej: Dell Latitude, HP Pavilion..."
                  v-model="nuevoEquipo.nombre"
                />
              </div>

              <div class="form-group">
                <label>Número de Serie *</label>
                <input
                  type="text"
                  class="form-input"
                  placeholder="Ingrese el serial del equipo"
                  v-model="nuevoEquipo.serial"
                />
              </div>

              <div class="form-group">
                <label>Características</label>
                <textarea
                  class="form-textarea"
                  placeholder="Describa las características del equipo (procesador, RAM, etc.)"
                  v-model="nuevoEquipo.caracteristicas"
                ></textarea>
              </div>

              <div class="form-group">
                <label>Accesorios Incluidos</label>
                <div class="accessories-grid">
                  <div class="checkbox-item">
                    <input type="checkbox" id="mouse" v-model="nuevoEquipo.mouse" />
                    <div class="checkbox-custom"></div>
                    <label for="mouse" class="checkbox-label">🖱️ Mouse</label>
                  </div>
                  <div class="checkbox-item">
                    <input type="checkbox" id="cargador" v-model="nuevoEquipo.cargador" />
                    <div class="checkbox-custom"></div>
                    <label for="cargador" class="checkbox-label">🔌 Cargador</label>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Imagen del Equipo</label>
                <div class="image-upload-section">
                  <button type="button" class="image-upload-btn" @click="mostrarOpciones = true">
                    📷 Agregar Foto del Equipo
                  </button>
                </div>
                
                <!-- Vista previa de la imagen - aparece inmediatamente después de los botones -->
                <div v-if="nuevoEquipo.foto" class="image-preview-container">
                  <img :src="nuevoEquipo.foto" alt="Vista previa del equipo" class="image-preview" />
                  <button type="button" class="remove-image-btn" @click="eliminarFoto">✕</button>
                </div>
                
                <!-- Mensaje cuando no hay imagen -->
                <div v-else class="no-image-placeholder">
                  <span>📷 Sin imagen</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer del modal -->
        <div class="modal-footer-large">
          <div class="footer-info">
            <p class="required-note">* Campos obligatorios</p>
          </div>
          <div class="footer-actions">
            <button class="btn-secondary" @click="cerrarModal">
              Cancelar
            </button>
            <button 
              class="btn-primary" 
              @click="guardarNuevoEquipo"
              :disabled="!nuevoEquipo.nombre || !nuevoEquipo.serial"
            >
              💾 Registrar Equipo
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para opciones de foto/archivo -->
    <div v-if="mostrarOpciones" class="modal-overlay">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>Agregar imagen</h3>
          <button class="close-btn" @click="mostrarOpciones = false">✕</button>
        </div>
        <div class="modal-body">
          <button @click="abrirCamara" class="btn-action">Tomar Foto</button>
          <button @click="subirArchivo" class="btn-action">Seleccionar Archivo</button>
          
          <!-- Vista previa de imagen subida -->
          <div v-if="nuevoEquipo.foto && !mostrarCamara" class="image-preview-modal">
            <img :src="nuevoEquipo.foto" alt="Vista previa" class="preview-image" />
            <button @click="eliminarFoto" class="remove-preview-btn">✕ Eliminar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Cámara -->
    <div v-if="mostrarCamara" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Tomar foto</h3>
          <button class="close-btn" @click="cerrarCamara">✕</button>
        </div>
        <div class="modal-body">
          <video ref="video" autoplay style="width: 100%; max-width: 500px;"></video>
          
          <!-- Vista previa de foto capturada en el centro -->
          <div v-if="nuevoEquipo.foto" class="captured-photo-preview">
            <img :src="nuevoEquipo.foto" alt="Foto capturada" class="captured-image" />
            <div class="photo-actions">
              <button @click="eliminarFoto" class="btn-action btn-secondary">🗑️ Eliminar</button>
              <button @click="cerrarCamara" class="btn-action btn-primary">✅ Usar esta foto</button>
            </div>
          </div>
          
          <div class="modal-footer">
            <button v-if="!nuevoEquipo.foto" @click="capturarFoto" class="btn-action">Capturar</button>
            <button @click="cerrarCamara" class="btn-action">Cancelar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para foto ampliada -->
    <div v-if="fotoAmpliadaVisible" class="modal-overlay" @click.self="cerrarFotoAmpliada">
      <div class="foto-modal">
        <button class="close-btn-foto" @click="cerrarFotoAmpliada">✕</button>
        <img :src="fotoAmpliada" alt="Foto ampliada" class="foto-ampliada" />
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import barcodeScannerMixin from "../mixins/barcodeScannerMixin.js";
import { getApiUrl } from '../utils/apiConfig';

export default {
  name: "RegistroUsuariosYaResg",
  mixins: [barcodeScannerMixin], // 🔹 Agregar mixin
  
  // Método para acceder al toast
  computed: {
    toast() {
      return this.$toast || {
        success: (msg) => console.log('✅', msg),
        error: (msg) => console.error('❌', msg),
        warning: (msg) => console.warn('⚠️', msg),
        info: (msg) => console.info('ℹ️', msg)
      };
    }
  },
  data() {
    return {
      tipoRegistro: "Registrado",
      buscarDocumento: "",
      equipoMenuAbierto: null,
      modalAbierto: false,
      usuarioSeleccionado: null,
      nuevoEquipo: {
        nombre: "",
        serial: "",
        caracteristicas: "",
        mouse: false,
        cargador: false,
        foto: null,
      },
      usuarios: [],
      // Variables para modal de foto ampliada
      fotoAmpliadaVisible: false,
      fotoAmpliada: null,
      // Variables para control de movimientos
      estadoUsuario: 'Egreso', // 'Ingreso' o 'Egreso'
      ultimoMovimiento: null,
      cargandoMovimiento: false,
      // Variables para manejo de fotos
      mostrarOpciones: false,
      mostrarCamara: false,
    };
  },
  watch: {
    tipoRegistro(nuevoValor) {
      if (nuevoValor === "Registrar") {
        this.$router.push({ name: "registro" });
      } else if (nuevoValor === "Registrado") {
        // Ya estamos en la página correcta para "Registrado"
        // No necesitamos hacer nada adicional
      }
    },
  },
  mounted() {
    document.addEventListener("click", this.handleClickOutside);

    // 🔹 Verificar si viene un serial en la URL (puede ser query o params)
    const serial = this.$route.query.serial || this.$route.params.serial;
    if (serial) {
      this.buscarPorSerial(serial);
    }

    // 🔹 Inicializar el escáner del mixin si aplica
    if (this.initScanner) this.initScanner();
  },
  beforeUnmount() {
    document.removeEventListener("click", this.handleClickOutside);
    // 🔹 Detener el escáner si aplica
    if (this.stopScanner) this.stopScanner();
  },
  methods: {
    async buscar() {
      if (!this.buscarDocumento) return;
      try {
        const res = await axios.get(
          getApiUrl(`api/usuario-equipo/buscar-documento/${this.buscarDocumento}`),
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );

        this.usuarios = [res.data];
        
        // 🔹 Obtener el estado actual del usuario (solo consulta, sin registro automático)
        const equipoPrincipal = this.getEquipoPrincipal(res.data);
        const serial = equipoPrincipal?.serial;
        if (serial) {
          await this.obtenerEstadoUsuario(serial);
        }
        
      } catch (err) {
        console.error("❌ Error al buscar:", err.response?.data || err.message);
        this.usuarios = [];
        this.toast.error("No se encontró el usuario");
      }
    },

    // 🔹 Búsqueda por serial (desde escaneo)
    async buscarPorSerial(serial) {
      try {
        const res = await axios.get(
          getApiUrl(`api/usuario-equipo/buscar/${serial}`),
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );

        this.usuarios = [res.data];
        
        // 🔹 Obtener el estado actual del usuario
        await this.obtenerEstadoUsuario(serial);
        
      } catch (err) {
        console.error("❌ Error al buscar por serial:", err.response?.data || err.message);
        this.usuarios = [];
         this.toast.error("No se encontró el usuario con ese serial");
      }
    },

    registrar() {
      this.$router.push({ name: "registro" });
    },
    toggleEquipoMenu(index) {
      this.equipoMenuAbierto =
        this.equipoMenuAbierto === index ? null : index;
    },
    handleClickOutside(e) {
      const isMenu = e.target.closest(".equipo-menu");
      const isBtn = e.target.closest(".kebab-btn");
      if (!isMenu && !isBtn) this.equipoMenuAbierto = null;
    },
    defaultEquipos(usuario) {
      let equiposArray = [];
      
      // Inicializar el array de equipos si no existe
      if (!Array.isArray(usuario.equipos)) {
        usuario.equipos = [];
      }
      
      // Si el usuario tiene un equipo principal, asegurarse de que esté en el array
      if (usuario.equipo && usuario.equipo.serial) {
        const equipoPrincipal = {
          nombre: usuario.equipo.marca || '',
          marca: usuario.equipo.marca || '',
          serial: usuario.equipo.serial || '',
          caracteristicas: usuario.equipo.caracteristicas || '',
          accesorios: usuario.equipo.accesorios || { mouse: false, cargador: false },
          mouse: usuario.equipo.accesorios?.mouse || false,
          cargador: usuario.equipo.accesorios?.cargador || false,
          foto: usuario.equipo.foto || null,
          _id: usuario.equipo._id
        };
        
        // Verificar si el equipo principal ya existe en el array de equipos
        const equipoExistente = usuario.equipos.find(e => e.serial === equipoPrincipal.serial);
        if (!equipoExistente) {
          usuario.equipos.unshift(equipoPrincipal);
        }
      }
      
      return usuario.equipos || [];
    },
    
    // Función para obtener el equipo principal desde el array de equipos
    getEquipoPrincipal(usuario) {
      if (!usuario) return null;
      
      // Si hay equipos en el array, devolver el primero (que debería ser el principal)
      if (usuario.equipos && Array.isArray(usuario.equipos) && usuario.equipos.length > 0) {
        return usuario.equipos[0];
      }
      
      // Fallback al campo equipo si existe
      if (usuario.equipo && usuario.equipo.serial) {
        return usuario.equipo;
      }
      
      return null;
    },
    abrirModalNuevoEquipo(usuario) {
      this.usuarioSeleccionado = usuario;
      this.nuevoEquipo = {
        nombre: "",
        serial: "",
        caracteristicas: "",
        mouse: false,
        cargador: false,
        imagen: null,
      };
      this.modalAbierto = true;
      this.equipoMenuAbierto = null;
    },
    cerrarModal() {
      this.modalAbierto = false;
      this.nuevoEquipo = {
        nombre: "",
        serial: "",
        caracteristicas: "",
        mouse: false,
        cargador: false,
        foto: null,
      };
      this.mostrarOpciones = false;
      this.cerrarCamara();
    },
    subirImagen(event) {
      // Este método ya no se usa, se reemplaza por subirArchivo
      // Se mantiene para compatibilidad con código existente
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.optimizarImagen(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    },
    async guardarNuevoEquipo() {
      if (!this.usuarioSeleccionado) {
        this.toast.error("No se ha seleccionado un usuario");
        return;
      }
      
      if (!this.nuevoEquipo.nombre || !this.nuevoEquipo.serial) {
        this.toast.error("La marca y el serial son obligatorios");
        return;
      }
      
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          this.toast.error("No hay sesión activa");
          return;
        }
        
        // Preparar datos del equipo
        const equipoData = {
          usuarioId: this.usuarioSeleccionado._id || this.usuarioSeleccionado.id,
          documento: this.usuarioSeleccionado.numeroDocumento,
          marca: this.nuevoEquipo.nombre,
          serial: this.nuevoEquipo.serial,
          caracteristicas: this.nuevoEquipo.caracteristicas,
          foto: this.nuevoEquipo.foto, // Añadir la foto al objeto de datos
          fechaIngreso: new Date().toISOString(), // Añadir fecha de ingreso
          fechaRegistro: new Date().toISOString(), // Añadir fecha de registro
          accesorios: {
            mouse: this.nuevoEquipo.mouse,
            cargador: this.nuevoEquipo.cargador
          }
        };
        
        // Enviar al backend
        const response = await axios.post(
          getApiUrl('api/equipos/registrar'),
          equipoData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Actualizar la UI
        if (!this.usuarioSeleccionado.equipos) {
          this.usuarioSeleccionado.equipos = [];
        }
        
        this.usuarioSeleccionado.equipos.push({
          marca: this.nuevoEquipo.nombre,
          serial: this.nuevoEquipo.serial,
          caracteristicas: this.nuevoEquipo.caracteristicas,
          foto: this.nuevoEquipo.foto, // Añadir la foto al objeto para la UI
          accesorios: {
            mouse: this.nuevoEquipo.mouse,
            cargador: this.nuevoEquipo.cargador
          }
        });
        
        this.toast.success("Equipo registrado correctamente");
        this.cerrarModal();
      } catch (error) {
        console.error("❌ Error al guardar equipo:", error);
        this.toast.error("Error al registrar el equipo: " + (error.response?.data?.message || error.message));
      }
    },

    // 🔹 Métodos para manejo de fotos
    mostrarFotoAmpliada(foto) {
      this.fotoAmpliada = foto;
      this.fotoAmpliadaVisible = true;
    },

    cerrarFotoAmpliada() {
      this.fotoAmpliadaVisible = false;
      this.fotoAmpliada = null;
    },

    handleImageError(event) {
      console.warn('Error al cargar imagen:', event.target.src);
      event.target.style.display = 'none';
      // Mostrar el placeholder "Sin foto" en su lugar
      const container = event.target.parentElement;
      if (container) {
        container.innerHTML = '<div class="no-photo"><span>Error al cargar</span></div>';
      }
    },
    
    // Métodos para manejo de cámara y fotos
    abrirCamara() {
      this.mostrarOpciones = false;
      this.mostrarCamara = true;
      
      // Acceder a la cámara
      setTimeout(() => {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices
            .getUserMedia({ video: true })
            .then(stream => {
              if (this.$refs.video) {
                this.$refs.video.srcObject = stream;
              }
            })
            .catch(error => {
              console.error("Error al acceder a la cámara:", error);
              alert("No se pudo acceder a la cámara. Verifica los permisos.");
              this.mostrarCamara = false;
            });
        } else {
          alert("Tu navegador no soporta acceso a la cámara");
          this.mostrarCamara = false;
        }
      }, 100);
    },
    
    cerrarCamara() {
      this.mostrarCamara = false;
      // Detener el stream de video
      if (this.$refs.video && this.$refs.video.srcObject) {
        const tracks = this.$refs.video.srcObject.getTracks();
        tracks.forEach(track => track.stop());
        this.$refs.video.srcObject = null;
      }
    },
    
    capturarFoto() {
      const video = this.$refs.video;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Optimizar la imagen antes de guardarla
      this.optimizarImagen(canvas.toDataURL('image/jpeg'));
      this.cerrarCamara();
    },
    
    subirArchivo() {
      this.mostrarOpciones = false;
      
      // Crear un input de archivo temporal
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            this.optimizarImagen(event.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    },
    
    optimizarImagen(dataUrl) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        
        // Calcular dimensiones manteniendo la proporción
        let width = img.width;
        let height = img.height;
        const maxDimension = 800;
        
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir a JPEG con calidad reducida para optimizar tamaño
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        this.nuevoEquipo.foto = optimizedDataUrl;
        console.log('✅ Imagen asignada:', this.nuevoEquipo.foto ? 'Sí' : 'No');
        
        // Forzar actualización de la vista
        this.$forceUpdate();
      };
      
      img.src = dataUrl;
    },

    eliminarFoto() {
      this.nuevoEquipo.foto = null;
      console.log('🗑️ Foto eliminada');
    },

    // 🔹 Métodos para control de movimientos
    async obtenerEstadoUsuario(serial) {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(
          getApiUrl(`api/historial/estado/${serial}`),
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.ok) {
          const data = await response.json();
          this.estadoUsuario = data.estado || 'Egreso';
          this.ultimoMovimiento = data.ultimoMovimiento;
          console.log('✅ Estado actualizado:', this.estadoUsuario);
        }
      } catch (err) {
        console.error("❌ Error al obtener estado del usuario:", err);
        // Por defecto, asumir que está fuera
        this.estadoUsuario = 'Egreso';
      }
    },

    async registrarMovimiento() {
      if (!this.usuarios.length) return;
      
      this.cargandoMovimiento = true;
      
      try {
        const token = localStorage.getItem("token");
        if (!token) {
           this.toast.error("No hay sesión activa");
           return;
         }

        // Obtener información del guardia desde el token
        const payload = JSON.parse(atob(token.split('.')[1]));
        const docGuardia = payload.documento;
        const equipoPrincipal = this.getEquipoPrincipal(this.usuarios[0]);
        const serial = equipoPrincipal?.serial;

        if (!serial) {
           this.toast.error("No se encontró el serial del equipo");
           return;
         }

        // Determinar si es entrada o salida basado en el estado actual
        const endpoint = this.estadoUsuario === 'Egreso' ? 'entrada' : 'salida';
        
        const response = await axios.post(
          getApiUrl(`api/historial/${endpoint}`),
          {
            serial: serial,
            docGuardia: docGuardia
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          }
        );

        console.log(`✅ ${response.data.tipo} registrado correctamente:`, response.data);
        
        // 🔹 Obtener el estado real del backend después del registro
        await this.obtenerEstadoUsuario(serial);

        // Determinar la acción basada en la respuesta del servidor
        const accion = response.data.tipo === 'entrada' ? 'Ingreso' : 'Salida';
        this.toast.success(`${accion} registrado correctamente`);
        
        // Emitir evento para actualizar la tabla de guardias
        window.dispatchEvent(new CustomEvent('guardias-actualizados'));
        
        // Emitir evento específico para actualizar solo el contador de registros
        const registrosActualizadosEvent = new CustomEvent('registros-actualizados', {
          detail: {
            guardiaId: response.data.guardiaId, // ID del guardia
            registros: response.data.registros // Contador actualizado
          }
        });
        document.dispatchEvent(registrosActualizadosEvent);
        window.dispatchEvent(registrosActualizadosEvent);

      } catch (err) {
        console.error("❌ Error al registrar movimiento:", err);
        
        if (err.response?.status === 401) {
           this.toast.error("Sesión expirada. Por favor inicie sesión nuevamente.");
           this.$router.push('/login');
         } else {
           this.toast.error("Error al registrar el movimiento. Intente nuevamente.");
         }
      } finally {
        this.cargandoMovimiento = false;
      }
    },

    formatearFecha(fecha) {
      if (!fecha) return '';
      
      const date = new Date(fecha);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    // 🔹 Registrar entrada automática (también usado para búsqueda por documento)
    async registrarEntradaAutomatica(serial) {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No hay token disponible");
          return;
        }

        // Obtener información del guardia desde el token
        const payload = JSON.parse(atob(token.split('.')[1]));
        const docGuardia = payload.documento;

        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const url = `${baseUrl}/api/historial/entrada`;
        
        const response = await axios.post(
          url,
          {
            serial: serial,
            docGuardia: docGuardia
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          }
        );

        console.log("✅ Entrada registrada automáticamente:", response.data);
        this.toast.success("Entrada registrada correctamente");
        
        // Emitir evento para actualizar la tabla de guardias
        window.dispatchEvent(new CustomEvent('guardias-actualizados'));
        
      } catch (err) {
        console.error("❌ Error al registrar entrada automática:", err.response?.data || err.message);
        
        if (err.response?.status === 401) {
          this.toast.error("Sesión expirada. Por favor inicie sesión nuevamente.");
          this.$router.push('/login');
        } else {
          this.toast.warning("No se pudo registrar la entrada automáticamente. Podrá hacerlo manualmente.");
        }
      }
    },
  },
};
</script>

<style scoped>
/* ===== General ===== */
.registro-usuarios {
  max-width: 1200px;
  margin: 40px auto;
  padding: 32px;
  font-family: "Inter", sans-serif;
  color: #2c3e50;
}

/* ===== Header ===== */
.header {
  display: flex;
  align-items: center;
  justify-content: center; /* centramos el título */
  background: white;
  padding: 20px 40px;
  border-radius: 20px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
  margin-bottom: 36px;
  gap: 20px;
}
.logo {
  height: 210px;
}
.header h1 {
  font-size: 1.8rem;
  font-weight: 600;
  color: #2c3e50;
  letter-spacing: 0.5px;
}

/* ===== Controles ===== */
.controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  gap: 20px;
}
.buscar-documento {
  display: flex;
  gap: 12px;
}
.buscar-documento input {
  padding: 14px 18px;
  border: 1px solid #ddd;
  border-radius: 12px;
  min-width: 320px;
  font-size: 15px;
}
.buscar-documento button {
  padding: 14px 22px;
  background: #4a90e2;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 15px;
}
.buscar-documento button:hover {
  background: #357abd;
}
.tipo-registro select {
  padding: 14px 18px;
  border: 1px solid #ddd;
  border-radius: 12px;
  font-size: 15px;
}

/* ===== Tabla ===== */
.tabla-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 6px 16px rgba(0,0,0,0.06);
  overflow: hidden;
  margin-bottom: 36px;
}
.tabla-registro {
  width: 100%;
  border-collapse: collapse;
}
.tabla-registro th,
.tabla-registro td {
  padding: 18px 20px;
  text-align: left;
  font-size: 15px;
}
.tabla-registro thead {
  background: #f7f9fc;
  font-size: 14px;
  letter-spacing: 0.5px;
}
.tabla-registro tbody tr:hover {
  background: #f0f6ff;
  transition: background 0.3s;
}

/* ===== Botón de acción (Ingreso/Salida) ===== */
.accion-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 36px;
  gap: 20px;
}

.btn-movimiento {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 40px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  font-size: 18px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 200px;
  justify-content: center;
}

.btn-movimiento:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
}

.btn-ingreso {
  background: linear-gradient(135deg, #27ae60, #2ecc71);
  color: white;
}

.btn-ingreso:hover:not(:disabled) {
  background: linear-gradient(135deg, #1e8e4d, #27ae60);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
}

.btn-salida {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}

.btn-salida:hover:not(:disabled) {
  background: linear-gradient(135deg, #c0392b, #a93226);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(231, 76, 60, 0.4);
}

.btn-icon {
  font-size: 20px;
}

.btn-text {
  font-weight: 600;
}

/* ===== Información de estado ===== */
.estado-info {
  text-align: center;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 400px;
}

.estado-actual {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #2c3e50;
}

.estado-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.estado-adentro {
  background: #d5f4e6;
  color: #27ae60;
}

.estado-afuera {
  background: #ffeaa7;
  color: #e17055;
}

.ultimo-movimiento {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0;
}

/* ===== Menú de equipo ===== */
.equipo-cell {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
}
.kebab-btn {
  background: #fff;
  border: none;
  font-size: 28px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 50%;
  color: #111;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  margin-left: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}
.equipo-menu {
  position: absolute;
  top: calc(100% + 12px);
  left: 0;
  width: 300px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.1);
  z-index: 1000;
  padding: 16px;
}
.equipo-item {
  background: #f9f9fb;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 10px;
  font-size: 14px;
}
.add-equipo-btn {
  width: 100%;
  background: #27ae60;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  font-size: 14px;
}

/* ===== Modal ===== */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
}

/* Modal original para compatibilidad */
.modal-content {
  background: white;
  padding: 28px;
  border-radius: 18px;
  width: 420px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 8px 28px rgba(0,0,0,0.18);
}

/* Nuevo modal de dos columnas */
.modal-content-large {
  background: white;
  border-radius: 16px;
  width: 95%;
  max-width: 1200px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

.modal-header-large {
  padding: 24px 32px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header-large h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.form-container-two-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
}

.form-column {
  display: flex;
  flex-direction: column;
}

.user-info-column {
  background: #f8f9fa;
  border-right: 1px solid #e0e0e0;
}

.equipment-info-column {
  background: white;
}

.column-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
}

.column-header h4 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-info-display {
  padding: 24px;
}

.info-item {
  margin-bottom: 20px;
}

.info-item label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  background: white;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  font-size: 0.95rem;
  color: #333;
  min-height: 20px;
}

.equipos-actuales {
  max-height: none;
}

.no-equipos {
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.equipos-list-compact {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.equipo-compact {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.equipo-compact:last-child {
  border-bottom: none;
}

.equipo-badge {
  background: #1565c0;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 60px;
  text-align: center;
}

.equipo-name {
  font-weight: 500;
  color: #333;
  flex: 1;
}

.equipo-serial {
  font-size: 0.85rem;
  color: #666;
  font-family: monospace;
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.form-fields {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1565c0;
  box-shadow: 0 0 0 3px rgba(21, 101, 192, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.accessories-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.checkbox-item:hover {
  border-color: #1565c0;
  background: #f8f9ff;
}

.checkbox-item input[type="checkbox"] {
  display: none;
}

.checkbox-custom {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-item input[type="checkbox"]:checked + .checkbox-custom {
  background: #1565c0;
  border-color: #1565c0;
}

.checkbox-item input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.checkbox-label {
  font-weight: 500;
  color: #333;
}

.image-upload-section {
  margin-top: 8px;
}

.image-upload-btn {
  background: #f0f0f0;
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 16px 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  color: #666;
  width: 100%;
}

.image-upload-btn:hover {
  background: #e8f5e9;
  border-color: #4caf50;
  color: #2e7d32;
}

.image-preview-container {
  position: relative;
  margin-top: 12px;
  display: block !important;
  width: 100%;
}

.no-image-placeholder {
  margin-top: 12px;
  padding: 20px;
  background: #f9f9f9;
  border: 1px dashed #ddd;
  border-radius: 8px;
  text-align: center;
  color: #888;
  font-size: 0.9rem;
}

.image-preview {
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  object-fit: cover;
  display: block !important;
  visibility: visible !important;
}

.remove-image-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-footer-large {
  padding: 20px 32px;
  border-top: 1px solid #e0e0e0;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info {
  color: #666;
  font-size: 0.85rem;
}

.required-note {
  font-style: italic;
  margin: 0;
}

.footer-actions {
  display: flex;
  gap: 12px;
}

.btn-primary {
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #0d47a1 0%, #1565c0 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(21, 101, 192, 0.3);
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-secondary {
  background: white;
  color: #666;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

/* Estilos para vista previa de imágenes en modales */
.image-preview-modal {
  margin-top: 20px;
  text-align: center;
  padding: 15px;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  background: #f9f9f9;
}

.preview-image {
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 10px;
}

.remove-preview-btn {
  background: #ff4444;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.remove-preview-btn:hover {
  background: #cc0000;
  transform: translateY(-1px);
}

.captured-photo-preview {
  text-align: center;
  margin: 20px 0;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
}

.captured-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 15px;
}

.photo-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  align-items: center;
}

.btn-primary {
  background: linear-gradient(135deg, #1565c0 0%, #1976d2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}
/* ===== RESPONSIVE DESIGN ===== */

/* Laptops (769px - 1024px) */
@media (max-width: 1024px) and (min-width: 769px) {
  .header {
    padding: 15px 30px;
  }
  
  .logo {
    height: 45px;
  }
  
  .header h1 {
    font-size: 1.6rem;
  }
  
  .controls {
    padding: 0 30px;
    gap: 15px;
  }
  
  .buscar-documento input {
    padding: 10px 15px;
    font-size: 14px;
  }
  
  .tabla-registro {
    font-size: 13px;
  }
  
  .tabla-registro th,
  .tabla-registro td {
    padding: 10px 8px;
  }
  
  .user-photo {
    width: 50px;
    height: 50px;
  }
  
  .no-photo {
    width: 50px;
    height: 50px;
    font-size: 9px;
  }
  
  .modal-content-large {
    width: 95%;
    max-width: 900px;
    max-height: 90vh;
  }
  
  .form-container-two-columns {
    grid-template-columns: 1fr;
  }
  
  .user-info-column {
    border-right: none;
    border-bottom: 1px solid #e0e0e0;
  }
  
  .column-header {
    padding: 16px 20px 12px;
  }
  
  .user-info-display,
  .form-fields {
    padding: 20px;
  }
}

/* Tablets (481px - 768px) */
@media (max-width: 768px) and (min-width: 481px) {
  .header {
    padding: 12px 20px;
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .logo {
    height: 40px;
  }
  
  .header h1 {
    font-size: 1.4rem;
    margin: 0;
  }
  
  .controls {
    padding: 0 20px;
    flex-direction: column;
    gap: 15px;
  }
  
  .buscar-documento {
    width: 100%;
  }
  
  .buscar-documento input {
    width: 70%;
    padding: 12px 15px;
    font-size: 14px;
  }
  
  .buscar-documento button {
    padding: 12px 20px;
    font-size: 14px;
  }
  
  .tipo-registro select {
    padding: 12px 15px;
    font-size: 14px;
    width: 100%;
  }
  
  .tabla-registro {
    font-size: 12px;
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
  
  .tabla-registro thead,
  .tabla-registro tbody,
  .tabla-registro th,
  .tabla-registro td,
  .tabla-registro tr {
    display: block;
  }
  
  .tabla-registro thead tr {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }
  
  .tabla-registro tr {
    border: 1px solid #ccc;
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 8px;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .tabla-registro td {
    border: none;
    position: relative;
    padding: 8px 10px 8px 35%;
    text-align: left;
    white-space: normal;
  }
  
  .tabla-registro td:before {
    content: attr(data-label) ": ";
    position: absolute;
    left: 6px;
    width: 30%;
    padding-right: 10px;
    white-space: nowrap;
    font-weight: bold;
    color: #333;
  }
  
  .user-photo {
    width: 45px;
    height: 45px;
  }
  
  .no-photo {
    width: 45px;
    height: 45px;
    font-size: 8px;
  }
  
  .modal-content-large {
    width: 95%;
    height: 95vh;
    max-height: 95vh;
    border-radius: 8px;
  }
  
  .form-container-two-columns {
    grid-template-columns: 1fr;
  }
  
  .accessories-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-actions {
    flex-direction: column-reverse;
    width: 100%;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
  
  .btn-movimiento {
    padding: 15px 25px;
    font-size: 16px;
    min-width: 180px;
  }
  
  .estado-info {
    max-width: 350px;
    padding: 15px;
  }
}

/* Mobile (≤480px) */
@media (max-width: 480px) {
  .registro-usuarios {
    padding: 0;
  }
  
  .header {
    padding: 10px 15px;
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
  
  .logo {
    height: 35px;
  }
  
  .header h1 {
    font-size: 1.2rem;
    margin: 0;
    line-height: 1.3;
  }
  
  .controls {
    padding: 0 15px;
    flex-direction: column;
    gap: 12px;
  }
  
  .buscar-documento {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }
  
  .buscar-documento input {
    width: 100%;
    padding: 12px 15px;
    font-size: 14px;
  }
  
  .buscar-documento button {
    width: 100%;
    padding: 12px 20px;
    font-size: 14px;
  }
  
  .tipo-registro select {
    padding: 12px 15px;
    font-size: 14px;
    width: 100%;
  }
  
  .tabla-registro {
    margin: 15px;
    font-size: 11px;
    display: block;
    overflow-x: auto;
  }
  
  .tabla-registro thead,
  .tabla-registro tbody,
  .tabla-registro th,
  .tabla-registro td,
  .tabla-registro tr {
    display: block;
  }
  
  .tabla-registro thead tr {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }
  
  .tabla-registro tr {
    border: 1px solid #ccc;
    margin-bottom: 10px;
    padding: 12px;
    border-radius: 8px;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .tabla-registro td {
    border: none;
    position: relative;
    padding: 8px 10px 8px 40%;
    text-align: left;
    white-space: normal;
  }
  
  .tabla-registro td:before {
    content: attr(data-label) ": ";
    position: absolute;
    left: 6px;
    width: 35%;
    padding-right: 10px;
    white-space: nowrap;
    font-weight: bold;
    color: #333;
    font-size: 10px;
  }
  
  .foto-cell {
    width: 100%;
    padding: 10px 0;
  }
  
  .user-photo {
    width: 40px;
    height: 40px;
  }
  
  .no-photo {
    width: 40px;
    height: 40px;
    font-size: 7px;
  }
  
  .kebab-btn {
    padding: 6px 8px;
    font-size: 14px;
  }
  
  .modal-content-large {
    width: 100%;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
    margin: 0;
  }
  
  .modal-header-large {
    padding: 15px;
  }
  
  .modal-header-large h2 {
    font-size: 1.3rem;
  }
  
  .form-container-two-columns {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .column-header {
    padding: 12px 15px 8px;
  }
  
  .column-header h4 {
    font-size: 1rem;
  }
  
  .user-info-display,
  .form-fields {
    padding: 15px;
  }
  
  .form-input,
  .form-textarea {
    padding: 12px;
    font-size: 14px;
  }
  
  .accessories-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .checkbox-item {
    padding: 12px;
  }
  
  .footer-actions {
    flex-direction: column-reverse;
    width: 100%;
    padding: 15px;
    gap: 10px;
  }
  
  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
    padding: 15px;
    font-size: 14px;
  }
  
  .btn-movimiento {
    padding: 12px 20px;
    font-size: 14px;
    min-width: 150px;
    margin: 5px;
  }
  
  .btn-icon {
    font-size: 16px;
  }
  
  .estado-info {
    max-width: 300px;
    padding: 12px;
    margin: 10px;
  }
  
  .estado-actual {
    font-size: 14px;
  }
  
  .estado-badge {
    padding: 4px 8px;
    font-size: 12px;
  }
  
  .ultimo-movimiento {
    font-size: 11px;
  }
}

/* Mobile Landscape (≤768px and landscape) */
@media (max-width: 768px) and (orientation: landscape) {
  .header {
    padding: 8px 15px;
  }
  
  .header h1 {
    font-size: 1.1rem;
  }
  
  .logo {
    height: 30px;
  }
  
  .controls {
    padding: 0 15px;
    flex-direction: row;
    gap: 15px;
  }
  
  .buscar-documento {
    flex: 1;
    flex-direction: row;
    gap: 10px;
  }
  
  .tipo-registro {
    min-width: 150px;
  }
  
  .modal-content-large {
    width: 95%;
    height: 95vh;
    max-height: 95vh;
  }
  
  .form-container-two-columns {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  
  .user-info-column {
    border-right: 1px solid #e0e0e0;
    border-bottom: none;
  }
  
  .column-header {
    padding: 10px 15px 8px;
  }
  
  .user-info-display,
  .form-fields {
    padding: 15px;
  }
  
  .btn-movimiento {
    padding: 10px 15px;
    font-size: 13px;
    min-width: 130px;
  }
}

.modal-content input,
.modal-content textarea {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #ccc;
  font-size: 14px;
}
.modal-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}
.guardar {
  background: #27ae60;
  color: white;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
}
.cancelar {
  background: #ccc;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
}

/* ===== Estilos para fotos ===== */
.foto-cell {
  width: 80px;
  text-align: center;
  padding: 10px;
}

.foto-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.user-photo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #4a90e2;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.user-photo:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.no-photo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #f0f0f0;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  text-align: center;
  border: 2px solid #ddd;
}

/* ===== Modal de foto ampliada ===== */
.foto-modal {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
}

.close-btn-foto {
  position: absolute;
  top: 10px;
  right: 15px;
  background: rgba(0,0,0,0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background 0.2s;
}

.close-btn-foto:hover {
  background: rgba(0,0,0,0.9);
}

.foto-ampliada {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
}

/* ===== Animaciones ===== */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* ===== Estilos para botones de acción ===== */
.btn-action {
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin: 8px 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-action:hover {
  background: linear-gradient(135deg, #357abd 0%, #2968a3 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.btn-action:active {
  transform: translateY(0);
}

/* ===== RESPONSIVE DESIGN ===== */

/* Portátiles pequeños (1025px - 1366px) */
@media (min-width: 1025px) and (max-width: 1366px) {
  .modal-content {
    width: 85%;
    max-width: 900px;
    max-height: 80vh;
    padding: 20px;
  }
  
  .modal-header {
    padding: 18px 20px;
  }
  
  .modal-title {
    font-size: 1.3rem;
  }
  
  .modal-body {
    padding: 0 20px 20px;
  }
  
  .equipos-section {
    max-height: 200px;
  }
  
  .equipo-compact {
    padding: 10px 14px;
  }
  
  .equipo-badge {
    padding: 3px 7px;
    font-size: 0.7rem;
    min-width: 55px;
  }
  
  .equipo-name {
    font-size: 0.9rem;
  }
  
  .equipo-serial {
    font-size: 0.8rem;
    padding: 2px 5px;
  }
  
  .form-fields {
    padding: 20px;
  }
  
  .form-group {
    margin-bottom: 18px;
  }
  
  .form-group label {
    font-size: 0.85rem;
    margin-bottom: 7px;
  }
  
  .form-input,
  .form-textarea {
    padding: 10px 14px;
    font-size: 0.9rem;
  }
  
  .form-textarea {
    min-height: 70px;
  }
  
  .accessories-grid {
    gap: 10px;
  }
  
  .checkbox-item {
    padding: 10px;
    font-size: 0.85rem;
  }
  
  .checkbox-item input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }
  
  .modal-footer {
    padding: 15px 20px;
    gap: 10px;
  }
  
  .btn {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
  
  .user-photo {
    width: 55px;
    height: 55px;
  }
  
  .no-photo {
    width: 55px;
    height: 55px;
    font-size: 9px;
  }
}
</style>
