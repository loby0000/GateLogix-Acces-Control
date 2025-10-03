<template>
  <div class="page">
    <!-- Background carousel -->
    <div class="background-carousel">
      <div 
        v-for="(image, index) in backgroundImages" 
        :key="index"
        class="background-image"
        :class="{ active: index === currentImageIndex }"
        :style="{ backgroundImage: `url(${image.url})` }"
      ></div>
    </div>
    
    <div class="form-container-wrapper">
      <!-- Logo en la parte superior -->
      <div class="header-section">
        <div class="logo-section">
          <img src="/logo-gatelogix.png" alt="GateLogix Logo" class="logo-img" loading="eager" fetchpriority="high">
        </div>
        <h2 class="form-title">Usuarios Por Registrar</h2>
        
        <div v-if="usuarioEncontradoMsg" class="user-found-message">
          ✔ Usuario encontrado. Redirigiendo...
        </div>
      </div>

      <!-- Formulario dividido en dos columnas -->
      <div class="form-container">
        <!-- Columna izquierda: Información del usuario -->
        <div class="left-column">
          <div class="column-title">
            <span class="icon">👤</span>
            Información del Usuario
          </div>
          
          <div class="form-group">
            <label class="form-label">Tipo de Registro</label>
            <select v-model="tipoRegistro" class="input-select" required>
              <option disabled value="">Seleccionar tipo de registro</option>
              <option value="registrar">Registrar</option>
              <option value="registrado">Registrado</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Tipo De Usuario</label>
            <select v-model="tipoUsuario" class="input-select" required>
              <option disabled value="">Seleccionar tipo</option>
              <option value="Personal de planta">Personal de planta</option>
              <option value="Visitante">Visitante</option>
              <option value="Instructor">Instructor</option>
              <option value="Aprendiz">Aprendiz</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Tipo De Documento</label>
            <select v-model="tipoDocumento" class="input-select" required>
              <option disabled value="">Seleccionar documento</option>
              <option value="Cédula De Ciudadanía">Cédula De Ciudadanía</option>
              <option value="Cédula De Extranjería">Cédula De Extranjería</option>
              <option value="Tarjeta De Identidad">Tarjeta De Identidad</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Nombre</label>
            <input 
              type="text" 
              v-model="nombre" 
              placeholder="Mínimo 3 caracteres" 
              :class="['input-text', errores.nombre ? 'error' : '']" 
              @input="validarNombre"
              required 
            />
            <p v-if="errores.nombre" class="error-message">
              {{ errores.nombre }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">Documento</label>
            <input
              type="text"
              v-model="numeroDocumento"
              placeholder="8-10 dígitos"
              :class="['input-text', errores.numeroDocumento ? 'error' : '']"
              maxlength="10"
              @input="validarDocumento"
              required
            />
            <p v-if="errores.numeroDocumento" class="error-message">
              {{ errores.numeroDocumento }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">Correo Electrónico</label>
            <input
              type="email"
              v-model="correoElectronico"
              placeholder="ejemplo@correo.com"
              :class="['input-text', errores.correoElectronico ? 'error' : '']"
              @input="validarCorreo"
              required
            />
            <p v-if="errores.correoElectronico" class="error-message">
              {{ errores.correoElectronico }}
            </p>
          </div>
        </div>

        <!-- Columna derecha: Información del equipo -->
        <div class="right-column">
          <div class="column-title">
            <span class="icon">💻</span>
            Información del Equipo
          </div>
          
          <div class="form-group">
            <label class="form-label">Serial Del Equipo</label>
            <input 
              type="text" 
              v-model="serialEquipo" 
              placeholder="Serial del equipo" 
              :class="['input-text', errores.serialEquipo ? 'error' : '']" 
              @input="validarSerial"
              required 
            />
            <p v-if="errores.serialEquipo" class="error-message">
              {{ errores.serialEquipo }}
            </p>
          </div>

          <div class="form-group">
            <label class="form-label">Marca Del Equipo</label>
            <select v-model="marcaEquipo" class="input-select" required>
              <option disabled value="">Seleccionar marca</option>
              <option value="HP">HP</option>
              <option value="Dell">Dell</option>
              <option value="Lenovo">Lenovo</option>
              <option value="Asus">Asus</option>
              <option value="Acer">Acer</option>
              <option value="Apple">Apple</option>
              <option value="Toshiba">Toshiba</option>
              <option value="Samsung">Samsung</option>
              <option value="Sony">Sony</option>
              <option value="MSI">MSI</option>
              <option value="Otra">Otra</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Características</label>
            <textarea 
              v-model="caracteristicas" 
              placeholder="Descripción del equipo"
              class="input-textarea"
              rows="3"
            ></textarea>
          </div>

          <!-- Checkboxes para accesorios -->
          <div class="accessories-section">
            <div class="checkbox-group">
              <input type="checkbox" v-model="mouse" id="mouse" class="checkbox-input">
              <label for="mouse" class="checkbox-label">Mouse</label>
            </div>
            
            <div class="checkbox-group">
              <input type="checkbox" v-model="cargador" id="cargador" class="checkbox-input">
              <label for="cargador" class="checkbox-label">Cargador</label>
            </div>
          </div>

          <!-- Image Upload Section -->
          <div class="image-section">
            <div class="image-upload-area">
              <span class="upload-text">Insertar imagen</span>
              <div class="upload-buttons">
                <button 
                  type="button" 
                  class="upload-btn camera-btn" 
                  @click="openCamera"
                >
                  {{ cameraButtonText }}
                </button>
                <button 
                  type="button" 
                  class="upload-btn file-btn"
                  @click="openFileSelector"
                >
                  Subir Imagen
                </button>
              </div>
              
              <!-- Vista previa de la imagen -->
              <div v-if="capturedImage" class="image-preview-container">
                <div class="image-preview-header">
                  <span class="preview-title">Vista previa:</span>
                  <button 
                    type="button" 
                    class="remove-image-btn"
                    @click="removeImage"
                    title="Eliminar imagen"
                  >
                    ❌
                  </button>
                </div>
                <div class="image-preview">
                  <img :src="capturedImage" alt="Imagen capturada" class="preview-img" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Botones de acción -->
      <div class="action-buttons">
        <button type="button" @click="registrar" class="btn-primary">
          📝 Registrar Usuario
        </button>
        <button type="button" @click="cerrarSesion" class="btn-secondary">
          🚪 Cerrar sesión
        </button>
      </div>
    </div>

    <!-- Modal para opciones de archivo -->
    <div v-if="mostrarOpciones" class="modal">
      <div class="modal-content">
        <h3>Seleccionar opción</h3>
        <button @click="abrirCamara" class="modal-btn camera">
          📷 Tomar Foto
        </button>
        <button @click="subirArchivo" class="modal-btn file">
          📁 Seleccionar Archivo
        </button>
        <button class="modal-btn cancel" @click="mostrarOpciones = false">
          ❌ Cancelar
        </button>
      </div>
    </div>

    <!-- Cámara -->
    <div v-if="mostrarCamara" class="camera-container">
      <div class="camera-content">
        <video ref="video" autoplay class="camera-video"></video>
        <div class="camera-controls">
          <button @click="capturarFoto" class="camera-btn capture">📸 Capturar</button>
          <button @click="cerrarCamara" class="camera-btn close">❌ Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Nueva cámara -->
    <div v-if="showCamera" class="camera-container">
      <div class="camera-content">
        <video ref="cameraVideo" autoplay class="camera-video"></video>
        <div class="camera-controls">
          <button @click="capturePhoto" class="camera-btn capture">📸 Capturar</button>
          <button @click="closeCamera" class="camera-btn close">❌ Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal para código de barras -->
    <div v-if="mostrarCodigoModal" class="modal">
      <div class="modal-content barcode-modal">
        <h3>Código de Barras Generado</h3>
        <img :src="codigoBarrasUrl" alt="Código de Barras" class="barcode-image" />
        <div class="barcode-actions">
          <button @click="descargarCodigo" class="modal-btn download">💾 Descargar</button>
          <button @click="imprimirCodigo" class="modal-btn print">🖨️ Imprimir</button>
          <button @click="cerrarCodigoModal" class="modal-btn cancel">❌ Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import barcodeScannerMixin from "../mixins/barcodeScannerMixin.js";
import { useToast } from "vue-toastification";

import { getApiUrl } from '../utils/apiConfig';

export default {
  name: "RegistroUsuario",
  mixins: [barcodeScannerMixin],
  setup() {
    const toast = useToast();
    return { toast };
  },

  data() {
    return {
      // Datos del usuario
      tipoRegistro: "",
      tipoUsuario: "",
      tipoDocumento: "",
      nombre: "",
      numeroDocumento: "",
      correoElectronico: "",
      
      // Datos del equipo
      serialEquipo: "",
      marcaEquipo: "",
      caracteristicas: "",
      mouse: false,
      cargador: false,
      
      // Estados de la aplicación
      mostrarOpciones: false,
      mostrarCamara: false,
      mostrarCodigoModal: false,
      fotos: [],
      registroExitoso: false,
      usuarioEncontradoMsg: false,
      cameraButtonText: 'Tomar Foto',
      showCamera: false,
      capturedImage: null,
      videoStream: null,
      
      // Errores de validación
      errores: {
        nombre: "",
        numeroDocumento: "",
        correoElectronico: "",
        serialEquipo: ""
      },
      
      // Carrusel de imágenes
      currentImageIndex: 0,
      carouselInterval: null,
      backgroundImages: [
        {
          url: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=2560&h=1440&dpr=2&fit=crop&q=90',
          alt: 'Oficina moderna con tecnología'
        },
        {
          url: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=2560&h=1440&dpr=2&fit=crop&q=90',
          alt: 'Espacio de trabajo colaborativo'
        },
        {
          url: 'https://images.pexels.com/photos/3184293/pexels-photo-3184293.jpeg?auto=compress&cs=tinysrgb&w=2560&h=1440&dpr=2&fit=crop&q=90',
          alt: 'Centro de datos y servidores'
        },
        {
          url: 'https://images.pexels.com/photos/3184294/pexels-photo-3184294.jpeg?auto=compress&cs=tinysrgb&w=2560&h=1440&dpr=2&fit=crop&q=90',
          alt: 'Sala de conferencias tecnológica'
        },
        {
          url: 'https://images.pexels.com/photos/3184295/pexels-photo-3184295.jpeg?auto=compress&cs=tinysrgb&w=2560&h=1440&dpr=2&fit=crop&q=90',
          alt: 'Laboratorio de innovación'
        },
        {
          url: 'https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg?auto=compress&cs=tinysrgb&w=2560&h=1440&dpr=2&fit=crop&q=90',
          alt: 'Área de desarrollo de software'
        }
      ]
    };
  },

  watch: {
    tipoRegistro(nuevo) {
      console.log('🔄 Cambio en tipoRegistro:', nuevo);
      if (nuevo === "registrado") {
        console.log('✅ Navegando a RegistroUsuariosYaResg');
        this.$router.push({ name: "RegistroUsuariosYaResg" });
      }
    }
  },

  mounted() {
    this.$nextTick(() => {
      if (this.initScanner) this.initScanner(this.onScanDetected);
      this.startCarousel();
      this.precargarImagenes();
    });
  },

  beforeUnmount() {
    if (this.stopScanner) this.stopScanner();
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }
  },

  methods: {
    async onScanDetected(scannedSerial) {
      if (!scannedSerial) return;

      let serial = scannedSerial.toString().replace(/Shift/g, '').trim();
      this.serialEquipo = serial;

      try {
        const url = getApiUrl(`api/usuario-equipo/buscar/${encodeURIComponent(serial)}`);
        
        const token = localStorage.getItem("token");
        if (!token) {
          this.toast.error("No hay sesión activa. Por favor inicie sesión nuevamente.");
          this.$router.push('/login');
          return;
        }
        
        const res = await axios.get(url, { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });

        if (res.data && Object.keys(res.data).length > 0) {
          this.usuarioEncontradoMsg = true;
          
          await this.registrarEntradaAutomatica(serial);
          
          setTimeout(() => {
            this.usuarioEncontradoMsg = false;
            this.$router.push({ 
              name: "RegistroUsuariosYaResg", 
              query: { serial: serial, autoEntry: true }
            });
          }, 1200);
        } else {
          this.toast.info("No se encontró un usuario con ese serial.");
        }
      } catch (err) {
        console.error("❌ Error al buscar por serial:", err.response?.data || err.message);
        
        if (err.code === 'ECONNABORTED') {
          this.toast.error("La conexión ha tardado demasiado. Verifique su conexión a internet.");
        } else if (err.response?.status === 401) {
          this.toast.error("Sesión expirada. Por favor inicie sesión nuevamente.");
          this.$router.push('/login');
        } else if (err.response?.status === 404) {
          this.toast.info("No se encontró un usuario con ese serial.");
        } else {
          this.toast.error("Error al buscar usuario por serial. Intente nuevamente.");
        }
      }
    },

    // Validaciones
    validarNombre() {
      if (this.nombre.length < 3) {
        this.errores.nombre = 'El nombre debe tener al menos 3 caracteres';
      } else {
        this.errores.nombre = '';
      }
    },
    
    validarDocumento() {
      const documento = this.numeroDocumento.replace(/\D/g, '');
      if (documento.length < 8 || documento.length > 10) {
        this.errores.numeroDocumento = 'El documento debe tener entre 8 y 10 dígitos';
      } else {
        this.errores.numeroDocumento = '';
      }
      this.numeroDocumento = documento;
    },
    
    validarSerial() {
      if (this.serialEquipo.length < 5) {
        this.errores.serialEquipo = 'El serial debe tener al menos 5 caracteres';
      } else {
        this.errores.serialEquipo = '';
      }
    },

    validarCorreo() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.correoElectronico) {
        this.errores.correoElectronico = 'El correo electrónico es obligatorio';
      } else if (!emailRegex.test(this.correoElectronico)) {
        this.errores.correoElectronico = 'Ingrese un correo electrónico válido';
      } else {
        this.errores.correoElectronico = '';
      }
    },

    async registrar() {
        // Validar todos los campos
        this.validarNombre();
        this.validarDocumento();
        this.validarCorreo();
        this.validarSerial();
        
        // Verificar si hay errores
        const hayErrores = Object.values(this.errores).some(error => error !== '');
        
        if (!hayErrores && this.tipoUsuario && this.tipoDocumento && this.marcaEquipo) {
          try {
            const token = localStorage.getItem('token');
            if (!token) {
              this.toast.error('No hay sesión activa');
              this.$router.push('/login');
              return;
            }

            const payload = {
              tipoUsuario: this.tipoUsuario,
              tipoDocumento: this.tipoDocumento,
              numeroDocumento: this.numeroDocumento.replace(/\D/g, ''),
              nombre: this.nombre,
              email: this.correoElectronico,
              foto: this.capturedImage || null,
              equipo: {
                serial: this.serialEquipo,
                marca: this.marcaEquipo,
                caracteristicas: this.caracteristicas,
                accesorios: {
                  mouse: this.mouse,
                  cargador: this.cargador
                }
              }
            };

            const url = getApiUrl('api/usuario-equipo/registrar');
            const res = await axios.post(url, payload, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 15000
            });

            this.toast.success(res.data?.message || 'Usuario registrado con éxito');

            // Mostrar código de barras si viene del backend
            if (res.data?.codigoBarrasBase64) {
              this.codigoBarrasUrl = `data:image/png;base64,${res.data.codigoBarrasBase64}`;
              this.mostrarCodigoModal = true;
            }

            this.registroExitoso = true;

            // Emitir evento global de usuario registrado para mini-notificaciones
            try {
              const evento = new CustomEvent('usuario-registrado', {
                detail: {
                  nombre: this.nombre,
                  documento: (this.numeroDocumento || '').replace(/\D/g, '')
                }
              });
              document.dispatchEvent(evento);
              window.dispatchEvent(evento);
            } catch (e) {
              console.warn('No se pudo emitir evento usuario-registrado:', e?.message || e);
            }
            // Opcional: limpiar formulario
            // setTimeout(() => { this.registroExitoso = false; }, 3000);
          } catch (err) {
            console.error('❌ Error al registrar usuario:', err.response?.data || err.message);
            if (err.response?.status === 409) {
              const msg = err.response?.data?.message || 'Datos duplicados';
              this.toast.error(msg);
            } else if (err.response?.status === 400) {
              this.toast.error(err.response?.data?.message || 'Validación inválida');
            } else if (err.response?.status === 401) {
              this.toast.error('Sesión expirada. Por favor inicie sesión nuevamente.');
              this.$router.push('/login');
            } else {
              this.toast.error('Error al registrar usuario. Intente nuevamente.');
            }
          }
        } else {
          this.toast.error('Faltan campos por completar o hay errores');
        }
      },
      
      cerrarSesion() {
        this.$router.push('/login');
      },

    descargarCodigo() {
      const link = document.createElement("a");
      link.href = this.codigoBarrasUrl;
      link.download = "codigo_barras.png";
      link.click();
    },

    imprimirCodigo() {
      const win = window.open("", "_blank");
      win.document.write(`<img src="${this.codigoBarrasUrl}" style="max-width:100%;"/>`);
      win.print();
      win.close();
    },

    cerrarCodigoModal() { 
      this.mostrarCodigoModal = false; 
    },

    openCamera() {
      console.log('Abriendo cámara...');
      this.showCamera = true;
      this.$nextTick(() => {
        this.initializeCamera();
      });
    },

    openFileSelector() {
      console.log('Abriendo selector de archivos...');
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
          this.handleFileUpload(file);
        }
      };
      input.click();
    },

    handleFileUpload(file) {
      console.log('Archivo seleccionado:', file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.capturedImage = e.target.result;
        // Mantener el texto original del botón
      };
      reader.readAsDataURL(file);
    },

    async initializeCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        
        const video = this.$refs.cameraVideo;
        if (video) {
          video.srcObject = stream;
          this.videoStream = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('No se pudo acceder a la cámara. Verifique los permisos.');
        this.showCamera = false;
      }
    },

    capturePhoto() {
      const video = this.$refs.cameraVideo;
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      this.capturedImage = canvas.toDataURL('image/jpeg', 0.8);
      // Mantener el texto original del botón
      this.closeCamera();
    },

    closeCamera() {
      if (this.videoStream) {
        this.videoStream.getTracks().forEach(track => track.stop());
        this.videoStream = null;
      }
      this.showCamera = false;
    },

    removeImage() {
      this.capturedImage = null;
      this.cameraButtonText = 'Tomar Foto';
      console.log('Imagen eliminada');
    },

    abrirCamara() {
      this.mostrarCamara = true;
      this.mostrarOpciones = false;
    },

    cerrarCamara() {
      this.mostrarCamara = false;
    },

    tomarFoto() {
      const video = this.$refs.video;
      const canvas = this.$refs.canvas;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const dataURL = canvas.toDataURL('image/jpeg');
      this.fotos.push({
        data: dataURL,
        nombre: `Foto_${Date.now()}.jpg`
      });
      
      this.cerrarCamara();
    },

    subirArchivo(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.fotos.push({
            data: e.target.result,
            nombre: file.name
          });
        };
        reader.readAsDataURL(file);
      }
      this.mostrarOpciones = false;
    },

    startCarousel() {
      // console.log('Iniciando carrusel de imágenes...');
      // console.log('Total de imágenes:', this.backgroundImages.length);
      
      // Asegurar que empezamos con la primera imagen
      this.currentImageIndex = 0;
      
      if (this.carouselInterval) {
        clearInterval(this.carouselInterval);
      }
      
      this.carouselInterval = setInterval(() => {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.backgroundImages.length;
        // console.log('Cambiando a imagen:', this.currentImageIndex, 'URL:', this.backgroundImages[this.currentImageIndex]);
      }, 3000); // Cambiar cada 3 segundos
    },
    
    precargarImagenes() {
      this.backgroundImages.forEach((image, index) => {
        const img = new Image();
        img.src = image.url;
        img.onload = () => {
          // console.log(`Imagen ${index + 1} precargada:`, image.alt);
        };
        img.onerror = () => {
          console.error(`Error cargando imagen ${index + 1}:`, image.alt);
        };
      });
    },


  }
};
</script>

<style>
/* Estilos globales para eliminar scroll */
* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  overflow: hidden;
  height: 100vh;
  background: #000000 !important;
}

#app {
  height: 100vh;
  overflow: hidden;
}

/* ===== RESPONSIVE DESIGN ===== */

/* Portátiles pequeños (1025px - 1366px) */
@media (min-width: 1025px) and (max-width: 1366px) {
  .form-container {
    gap: 25px;
    max-width: 1100px;
  }
  
  .left-column, .right-column {
    padding: 22px;
    max-height: 65vh;
  }
  
  .column-title {
    font-size: 22px;
    margin-bottom: 18px;
  }
  
  .form-group {
    gap: 7px;
  }
  
  .form-label {
    font-size: 15px;
  }
  
  .input-text, .input-select, .input-textarea {
    padding: 11px 14px;
    font-size: 14px;
  }
  
  .input-textarea {
    min-height: 70px;
  }
  
  .accessories-section {
    gap: 10px;
  }
  
  .checkbox-group {
    padding: 10px 12px;
    font-size: 14px;
  }
  
  .action-buttons {
    gap: 12px;
    margin-top: 20px;
  }
  
  .btn-primary, .btn-secondary {
    padding: 11px 20px;
    font-size: 15px;
  }
  
  .logo-img {
    height: 55px;
  }
  
  .form-title {
    font-size: 30px;
  }
}

/* Laptops y pantallas medianas (768px - 1024px) */
@media (min-width: 768px) and (max-width: 1024px) {
  .form-container-wrapper {
    padding: 15px;
  }
  
  .form-title {
    font-size: 28px;
  }
  
  .left-column, .right-column {
    padding: 20px;
    gap: 15px;
  }
  
  .column-title {
    font-size: 20px;
  }
}

/* Tablets (481px - 768px) */
@media (max-width: 768px) {
  .form-container {
    grid-template-columns: 1fr;
    gap: 20px;
    max-width: 600px;
  }
  
  .form-container-wrapper {
    padding: 15px;
  }
  
  .form-title {
    font-size: 26px;
  }
  
  .left-column, .right-column {
    max-height: none;
    padding: 20px;
  }
  
  .column-title {
    font-size: 20px;
    margin-bottom: 15px;
  }
  
  .register-btn {
    width: 100%;
    max-width: 300px;
  }
}

/* Móviles (hasta 480px) */
@media (max-width: 480px) {
  .form-container-wrapper {
    padding: 10px;
  }
  
  .header-section {
    margin-bottom: 20px;
  }
  
  .logo-img {
    height: 50px;
  }
  
  .form-title {
    font-size: 22px;
  }
  
  .user-found-message {
    padding: 12px 20px;
    font-size: 14px;
  }
  
  .form-container {
    gap: 15px;
    max-width: 100%;
  }
  
  .left-column, .right-column {
    padding: 15px;
    gap: 15px;
  }
  
  .column-title {
    font-size: 18px;
    margin-bottom: 12px;
  }
  
  .form-label {
    font-size: 14px;
  }
  
  .input-text, .input-select, .input-textarea {
    padding: 14px;
    font-size: 16px; /* Evita zoom en iOS */
    min-height: 48px; /* Mejor para touch */
  }
  
  .input-textarea {
    min-height: 100px;
  }
  
  .upload-btn, .image-btn {
    padding: 14px 20px;
    font-size: 14px;
    min-height: 48px;
  }
  
  .checkbox-group {
    flex-direction: column;
    gap: 10px;
  }
  
  .checkbox-label {
    font-size: 14px;
  }
  
  .register-btn {
    width: 100%;
    padding: 16px 30px;
    font-size: 16px;
    min-height: 52px;
  }
  
  .success-message {
    padding: 15px;
    font-size: 16px;
  }
  
  /* Ajustes para la cámara en móviles */
  .camera-video {
    max-width: 95%;
    max-height: 60vh;
  }
  
  .camera-controls {
    flex-direction: column;
    gap: 10px;
  }
  
  .camera-btn {
    width: 100%;
    max-width: 200px;
    padding: 14px 20px;
  }
  
  /* Preview de imágenes más pequeño en móviles */
  .preview-img {
    height: 150px;
  }
}

/* Orientación horizontal en móviles */
@media (max-width: 768px) and (orientation: landscape) and (max-height: 500px) {
  .form-container-wrapper {
    min-height: auto;
  }
  
  .header-section {
    margin-bottom: 15px;
  }
  
  .logo-img {
    height: 40px;
  }
  
  .form-title {
    font-size: 20px;
  }
  
  .left-column, .right-column {
    padding: 15px;
    gap: 10px;
  }
  
  .column-title {
    font-size: 16px;
    margin-bottom: 10px;
  }
}

</style>

<style scoped>
/* Estilos globales para eliminar scroll */
html, body {
  overflow: hidden;
  height: 100vh;
  margin: 0;
  padding: 0;
}

.page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

/* Background carousel */
.background-carousel {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 0;
  overflow: hidden;
}

.background-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0;
  transition: opacity 1s ease-in-out;
}

.background-image.active {
  opacity: 1;
}

/* Form container */
.form-container-wrapper {
  position: relative;
  z-index: 100;
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 20px;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
}

/* Header section */
.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  flex-shrink: 0;
}

.logo-section {
  margin-bottom: 20px;
}

.logo-img {
  height: 60px;
  width: auto;
}

.form-title {
  color: white;
  font-size: 32px;
  font-weight: bold;
  text-align: center;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.user-found-message {
  background: rgba(76, 175, 80, 0.9);
  color: white;
  padding: 15px 25px;
  border-radius: 8px;
  margin-top: 15px;
  font-weight: bold;
  font-size: 16px;
}

/* Form container - Two columns */
.form-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  flex: 1;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* Columns */
.left-column, .right-column {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

/* Column titles */
.column-title {
  color: white;
  font-size: 24px;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

/* Form groups */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.form-label {
  color: white;
  font-weight: bold;
  font-size: 16px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

/* Input styles */
.input-text, .input-select, .input-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 16px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.input-textarea {
  min-height: 80px;
  resize: vertical;
}

.input-text:focus, .input-select:focus, .input-textarea:focus {
  outline: none;
  border-color: rgba(46, 204, 113, 0.8);
  box-shadow: 0 0 10px rgba(46, 204, 113, 0.3);
  transform: translateY(-2px);
}

/* Custom scrollbar */
.left-column::-webkit-scrollbar, .right-column::-webkit-scrollbar {
  width: 6px;
}

.left-column::-webkit-scrollbar-track, .right-column::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.left-column::-webkit-scrollbar-thumb, .right-column::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.left-column::-webkit-scrollbar-thumb:hover, .right-column::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Image section */
.image-section {
  margin-top: 10px;
}

.image-upload-area {
  background: rgba(255, 255, 255, 0.1);
  border: 2px dashed rgba(255, 255, 255, 0.4);
  border-radius: 10px;
  padding: 20px;
  text-align: center;
}

.upload-text {
  color: white;
  font-weight: 600;
  display: block;
  margin-bottom: 15px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

.upload-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.upload-btn {
  padding: 10px 15px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
}

.camera-btn {
  background: #2196F3;
  color: white;
}

.camera-btn:hover {
  background: #1976D2;
  transform: translateY(-2px);
}

.file-btn {
  background: #FF9800;
  color: white;
}

.file-btn:hover {
  background: #F57C00;
  transform: translateY(-2px);
}

/* Action buttons */
.action-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  flex-shrink: 0;
}

.btn-primary, .btn-secondary {
  padding: 12px 25px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #45a049, #3d8b40);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.btn-secondary {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  color: white;
  box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
}

.btn-secondary:hover {
  background: linear-gradient(135deg, #d32f2f, #b71c1c);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 400px;
  width: 90%;
}

.modal-content h3 {
  color: #2c3e50;
  margin-bottom: 20px;
  font-size: 20px;
}

.modal-btn {
  display: block;
  width: 100%;
  padding: 12px;
  margin: 8px 0;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-btn.camera {
  background: #3498db;
  color: white;
}

.modal-btn.file {
  background: #2ecc71;
  color: white;
}

.modal-btn.download {
  background: #f39c12;
  color: white;
}

.modal-btn.print {
  background: #9b59b6;
  color: white;
}

.modal-btn.cancel {
  background: #e74c3c;
  color: white;
}

.modal-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.barcode-modal {
  max-width: 500px;
}

.barcode-image {
  max-width: 300px;
  display: block;
  margin: 15px auto;
}

.barcode-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.barcode-actions .modal-btn {
  flex: 1;
  margin: 0;
}

.camera-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.camera-content {
  text-align: center;
}

.camera-video {
  max-width: 90%;
  max-height: 70vh;
  border-radius: 10px;
}

.camera-controls {
  margin-top: 20px;
  display: flex;
  gap: 15px;
  justify-content: center;
}

.camera-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.camera-btn.capture {
  background: #2ecc71;
  color: white;
}

.camera-btn.close {
  background: #e74c3c;
  color: white;
}

.camera-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

/* Image Preview Styles */
.image-preview-container {
  margin-top: 15px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(5px);
}

.image-preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.preview-title {
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.remove-image-btn {
  background: rgba(231, 76, 60, 0.8);
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-image-btn:hover {
  background: rgba(231, 76, 60, 1);
  transform: scale(1.1);
}

.image-preview {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.preview-img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}


</style>
