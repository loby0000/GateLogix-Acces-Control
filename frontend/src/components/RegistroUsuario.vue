<template>
  <div class="page">
    <!-- Background carousel -->
    <div class="background-carousel">
      <transition name="fade" mode="out-in">
        <div 
          :key="currentImageIndex" 
          class="background-image"
          :style="{ backgroundImage: `url(${backgroundImages[currentImageIndex].url})` }"
        ></div>
      </transition>
    </div>
    
    <div class="form-container">
      <!-- Logo -->
      <div class="logo-section">
          <img src="/logo-gatelogix.png" alt="GateLogix Logo" class="logo-img">
        </div>
      <h2 class="form-title">Registro de Usuario </h2>
 <div v-if="usuarioEncontradoMsg" 
           style="background:#e0f7ff; color:#007acc; border-radius:6px; padding:8px; margin-bottom:8px; text-align:center;">
        ✔ Usuario encontrado. Redirigiendo...
      </div>
      <!-- Select tipo de registro -->
      <select v-model="tipoRegistro" class="input-select">
        <option disabled value="">Tipo de registro</option>
        <option>Registrar</option>
        <option>Registrado</option>
      </select>

      <!-- Select tipo de usuario -->
      <select v-model="tipoUsuario" class="input-select" required>
        <option disabled value="">Tipo de usuario</option>
        <option value="Personal de planta">Personal de planta</option>
        <option value="Visitante">Visitante</option>
        <option value="Instructor">Instructor</option>
        <option value="Aprendiz">Aprendiz</option>
      </select>

      <!-- Select tipo de documento -->
      <select v-model="tipoDocumento" class="input-select" required>
        <option disabled value="">Tipo de documento</option>
        <option value="Cédula De Ciudadanía">Cédula De Ciudadanía</option>
        <option value="Cédula De Extranjería">Cédula De Extranjería</option>
        <option value="Tarjeta De Identidad">Tarjeta De Identidad</option>
      </select>

      <!-- Documento con validación -->
      <input
        type="text"
        v-model="numeroDocumento"
        placeholder="Documento"
        class="input-text"
        maxlength="10"
        @input="soloNumeros"
        required
      />
      <p v-if="errores.numeroDocumento" style="color:red; font-size:13px; margin-top:4px;">
        {{ errores.numeroDocumento }}
      </p>

      <input type="text" v-model="nombre" placeholder="Nombre" class="input-text" />
      <input type="email" v-model="email" placeholder="Correo electrónico" class="input-text" required />
      <input type="text" v-model="serialEquipo" placeholder="Serial Del Equipo" class="input-text" required />

      <select v-model="marcaEquipo" class="input-select">
        <option disabled value="">Marca Del Equipo</option>
        <option value="Dell">Dell</option>
        <option value="HP">HP</option>
        <option value="Lenovo">Lenovo</option>
        <option value="Asus">Asus</option>
        <option value="Acer">Acer</option>
        <option value="Apple">Apple</option>
        <option value="Samsung">Samsung</option>
        <option value="Huawei">Huawei</option>
        <option value="Toshiba">Toshiba</option>
        <option value="MSI">MSI</option>
        <option value="Otro">Otro</option>
      </select>

      <input type="text" v-model="caracteristicas" placeholder="Características" class="input-text" />

      <div class="checkbox-group">
        <label class="custom-check" :class="{ checked: mouse }">
          <input type="checkbox" v-model="mouse" style="display:none;" />
          <span class="icon-text"><span>Mouse</span></span>
        </label>
        <label class="custom-check" :class="{ checked: cargador }">
          <input type="checkbox" v-model="cargador" style="display:none;" />
          <span class="icon-text"><span>Cargador</span></span>
        </label>
      </div>

      <div class="file-section">
        <div class="file-label">Insertar imagen o archivo</div>
        <button type="button" class="file-upload-btn" @click="mostrarOpciones = true">📎 Agregar Foto o Archivo</button>
      </div>

      <!-- Modal flotante (fotos/archivos) -->
      <div v-if="mostrarOpciones" class="modal">
        <div class="modal-content">
          <button @click="abrirCamara">Tomar Foto</button>
          <button @click="subirArchivo">Seleccionar Archivo</button>
          <button class="cerrar" @click="mostrarOpciones = false">Cancelar</button>
        </div>
      </div>

      <!-- Cámara -->
      <div v-if="mostrarCamara" class="camara-container">
        <video ref="video" autoplay></video>
        <button @click="capturarFoto">Capturar</button>
        <button @click="cerrarCamara">Cerrar</button>
      </div>

      <!-- Fotos cargadas -->
      <div v-if="fotos.length" style="margin-bottom:8px; display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">
        <div v-for="(img, idx) in fotos" :key="idx" style="text-align:center;">
          <img :src="img.data" alt="Imagen cargada" style="max-width:120px; display:block; margin:auto; border-radius:6px;" />
          <div v-if="img.nombre" style="font-size:13px; color:#444;">{{ img.nombre }}</div>
        </div>
      </div>

      <!-- Mensaje de éxito -->
      <div v-if="registroExitoso" style="background:#e6ffe6; color:#1a7f1a; border-radius:6px; padding:8px; margin-bottom:8px; text-align:center;">
        <span style="font-size:18px;">✔</span> El Registro Ha Sido Exitoso
      </div>

      <!-- Botón registrar -->
      <button class="enviar" @click.prevent="registrar">Registrar</button>
      <router-link to="/login" class="cerrar-sesion-btn">Cerrar sesión</router-link>
    </div>

    <!-- Modal para código de barras -->
    <div v-if="mostrarCodigoModal" class="modal">
      <div class="modal-content" style="text-align:center; max-width:400px; margin:auto;">
        <h3>Código de Barras Generado</h3>
        <img :src="codigoBarrasUrl" alt="Código de Barras" style="max-width:300px; display:block; margin:15px auto;" />
        <div style="margin-top:10px;">
          <button @click="descargarCodigo" class="enviar">Descargar</button>
          <button @click="imprimirCodigo" class="enviar">Imprimir</button>
          <button @click="cerrarCodigoModal" class="cerrar">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>


<script>
import axios from "axios";
import barcodeScannerMixin from "../mixins/barcodeScannerMixin.js";

export default {
  name: "RegistroUsuario",
  mixins: [barcodeScannerMixin],

  data() {
    return {
      tipoRegistro: "Registrar",
      tipoUsuario: "",
      tipoDocumento: "",
      numeroDocumento: "",
      nombre: "",
      email: "",
      serialEquipo: "",
      marcaEquipo: "",
      caracteristicas: "",
      mouse: false,
      cargador: false,
      fotos: [],
      mostrarOpciones: false,
      mostrarCamara: false,
      registroExitoso: false,
      mostrarCodigoModal: false,
      codigoBarrasUrl: null,
      usuarioEncontradoMsg: false, // 🔹 mensaje temporal
      errores: { numeroDocumento: "", email: "" },
      currentImageIndex: 0,
      backgroundImages: [
        {
          url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80',
          alt: 'Vigilante de seguridad registrando equipos de cómputo'
        },
        {
          url: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80',
          alt: 'Personal de seguridad verificando laptops y dispositivos'
        },
        {
          url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80',
          alt: 'Centro de control de acceso con tecnología moderna'
        },
        {
          url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80',
          alt: 'Oficina corporativa con sistemas de registro'
        },
        {
          url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080&q=80',
          alt: 'Edificio empresarial con control de acceso'
        }
      ]
    };
  },

  watch: {
    tipoRegistro(nuevo) {
      if (nuevo === "Registrado") {
        this.$router.push({ name: "RegistroUsuariosYaResg" });
      }
    }
  },

  mounted() {
    if (this.initScanner) this.initScanner(this.onScanDetected);
    this.startCarousel();
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

  // 🔹 Limpiar caracteres extra típicos de scanners
  let serial = scannedSerial.toString().replace(/Shift/g, '').trim();

  this.serialEquipo = serial;

  try {
    const res = await axios.get(
      `http://localhost:3000/api/usuario-equipo/buscar/${serial}`,
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    if (res.data && Object.keys(res.data).length > 0) {
      this.usuarioEncontradoMsg = true;
      setTimeout(() => {
        this.usuarioEncontradoMsg = false;
        this.$router.push({ name: "RegistroUsuariosYaResg", params: { serial } });
      }, 1200);
    } else {
      alert("No se encontró un usuario con ese serial.");
    }
  } catch (err) {
    console.error("❌ Error al buscar por serial:", err.response?.data || err.message);
    alert("Error al buscar usuario por serial.");
  }


},

    soloNumeros(e) {
      e.target.value = e.target.value.replace(/\D/g, "");
      this.numeroDocumento = e.target.value;
      this.errores.numeroDocumento =
        this.numeroDocumento.length !== 10 ? "El documento debe tener exactamente 10 dígitos numéricos." : "";
    },

    validarEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    async registrar() {
      if (!this.tipoUsuario || !this.tipoDocumento || !this.numeroDocumento || !this.email || !this.serialEquipo || !this.marcaEquipo) {
        alert("Por favor completa todos los campos obligatorios.");
        return;
      }

      if (!this.validarEmail(this.email)) {
        this.errores.email = "Correo inválido.";
        return;
      } else this.errores.email = "";

      const payload = {
        tipoUsuario: this.tipoUsuario,
        tipoDocumento: this.tipoDocumento,
        numeroDocumento: this.numeroDocumento,
        nombre: this.nombre,
        email: this.email,
        equipo: {
          serial: this.serialEquipo,
          marca: this.marcaEquipo,
          caracteristicas: this.caracteristicas,
          accesorios: { mouse: this.mouse, cargador: this.cargador }
        }
      };

      try {
        const res = await axios.post(
          "http://localhost:3000/api/usuario-equipo/registrar",
          payload,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );

        console.log("✅ Registrado:", res.data);
        this.mostrarCodigoModal = true;
        this.codigoBarrasUrl = `data:image/png;base64,${res.data.codigoBarrasBase64}`;
        this.registroExitoso = true;
      } catch (err) {
        console.error("❌ Error al registrar:", err.response?.data || err.message);
      }
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

    cerrarCodigoModal() { this.mostrarCodigoModal = false; },

    abrirCamara() {
      this.mostrarCamara = true;
      navigator.mediaDevices.getUserMedia({ video: true }).then(stream => this.$refs.video.srcObject = stream);
    },

    capturarFoto() {
      const canvas = document.createElement("canvas");
      canvas.width = this.$refs.video.videoWidth;
      canvas.height = this.$refs.video.videoHeight;
      canvas.getContext("2d").drawImage(this.$refs.video, 0, 0);
      this.fotos.push({ data: canvas.toDataURL("image/png"), nombre: "foto.png" });
      this.cerrarCamara();
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
          const reader = new FileReader();
          reader.onload = ev => this.fotos.push({ data: ev.target.result, nombre: file.name });
          reader.readAsDataURL(file);
        }
      };
      input.click();
    },

    startCarousel() {
      this.carouselInterval = setInterval(() => {
        this.currentImageIndex = (this.currentImageIndex + 1) % this.backgroundImages.length;
      }, 5000);
    }
  }
};
</script>
<style scoped>
.page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 20px;
  overflow: hidden;
  box-sizing: border-box;
  z-index: 0;
  background: #1e293b;
}

.background-carousel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
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
}

.background-image::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(30, 41, 59, 0.7);
  z-index: 1;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 1.5s ease-in-out;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.fade-enter-to, .fade-leave-from {
  opacity: 1;
}
/* Modal genérico */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}
.form-container {
   background: rgba(255, 255, 255, 0.1);
   backdrop-filter: blur(20px);
   padding: 1.5rem;
   border-radius: 20px;
   width: 100%;
   max-width: 420px;
   max-height: 85vh;
   overflow-y: auto;
   display: flex;
   flex-direction: column;
   gap: 0.8rem;
   box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
   border: 1px solid rgba(255, 255, 255, 0.2);
   position: relative;
   z-index: 2;
 }
 
 /* Logo section */
 .logo-section {
   text-align: center;
   margin-bottom: 0.5rem;
 }
 
 .logo-img {
   width: 160px;
   height: auto;
   filter: brightness(1.1) contrast(1.1);
   transition: all 0.3s ease;
 }
 
 .logo-img:hover {
   transform: scale(1.05);
 }
.form-title {
   text-align: center;
   color: #ffffff;
   font-size: 1.4rem;
   font-weight: 700;
   margin-bottom: 1rem;
   text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
   letter-spacing: 0.5px;
 }
.input-text, .input-select {
     width: 100%;
     padding: 10px 14px;
     margin-top: 3px;
     margin-bottom: 8px;
     border: 1px solid rgba(255, 255, 255, 0.4);
     border-radius: 10px;
     font-size: 14px;
     color: #1f2937;
     background: rgba(255, 255, 255, 0.9);
     backdrop-filter: blur(10px);
     box-sizing: border-box;
     transition: all 0.3s ease;
     font-weight: 500;
   }
  .input-text:focus, .input-select:focus {
    outline: none;
    border-color: #3b82f6;
    background: rgba(255, 255, 255, 0.95);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15), 0 6px 25px rgba(59, 130, 246, 0.2);
    transform: translateY(-2px);
  }
  .input-text::placeholder {
    color: #6b7280;
    font-weight: 400;
  }
  .checkbox-group {
     display: flex;
     align-items: center;
     justify-content: center;
     gap: 16px;
     margin-bottom: 8px;
     width: 100%;
   }
   .custom-check {
       display: flex;
       align-items: center;
       background: rgba(255, 255, 255, 0.85);
       backdrop-filter: blur(10px);
       border-radius: 10px;
       padding: 8px 16px;
       cursor: pointer;
       font-size: 13px;
       color: #1f2937;
       border: 1px solid rgba(255, 255, 255, 0.5);
       transition: all 0.3s ease;
       user-select: none;
       min-width: 110px;
       font-weight: 600;
     }
    .custom-check:hover {
      background: rgba(255, 255, 255, 0.9);
      transform: translateY(-1px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
    .custom-check.checked {
      background: rgba(59, 130, 246, 0.3);
      border-color: #3b82f6;
      color: #ffffff;
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
    }
   .icon-text {
      display: flex;
      align-items: center;
      gap: 8px;
    }

 /* Sección de archivos */
 .file-section {
   margin: 0.5rem 0;
   text-align: center;
 }
 
 .file-label {
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 6px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
 
 .file-upload-btn {
   background: rgba(16, 185, 129, 0.8);
   backdrop-filter: blur(8px);
   color: #ffffff;
   border: 1px solid rgba(255, 255, 255, 0.3);
   border-radius: 12px;
   font-weight: 500;
   font-size: 14px;
   padding: 10px 20px;
   cursor: pointer;
   transition: all 0.3s ease;
   box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
 }
 
 .file-upload-btn:hover {
   background: rgba(16, 185, 129, 0.9);
   transform: translateY(-1px);
   box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
 }

 button {
   cursor: pointer;
 }
.enviar {
   background: linear-gradient(135deg, #3b82f6, #1e40af);
   color: #ffffff;
   border: none;
   border-radius: 10px;
   font-weight: 600;
   font-size: 15px;
   padding: 10px 0;
   box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
   margin-top: 8px;
   transition: all 0.3s ease;
   width: 100%;
   cursor: pointer;
 }
 .enviar:hover {
   transform: translateY(-2px);
   box-shadow: 0 12px 35px rgba(59, 130, 246, 0.4);
   background: linear-gradient(135deg, #2563eb, #1d4ed8);
 }
 
 .cerrar-sesion-btn {
   display: block;
   width: 100%;
   margin-top: 8px;
   background: rgba(239, 68, 68, 0.9);
   backdrop-filter: blur(8px);
   color: #ffffff;
   border: 1px solid rgba(255, 255, 255, 0.2);
   border-radius: 10px;
   font-weight: 600;
   font-size: 13px;
   padding: 8px 0;
   text-align: center;
   box-shadow: 0 6px 20px rgba(239, 68, 68, 0.25);
   transition: all 0.3s ease;
   cursor: pointer;
   text-decoration: none;
 }
 .cerrar-sesion-btn:hover {
   background: rgba(185, 28, 28, 0.95);
   transform: translateY(-2px);
   box-shadow: 0 8px 25px rgba(185, 28, 28, 0.35);
 }
.modal {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 220px;
}
.camara-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}
video {
  width: 100%;
  max-width: 260px;
  border-radius: 8px;
}
/* Animaciones de entrada */
 @keyframes slideInUp {
   from {
     opacity: 0;
     transform: translateY(30px);
   }
   to {
     opacity: 1;
     transform: translateY(0);
   }
 }
 
 .form-container {
   animation: slideInUp 0.8s ease-out;
 }
 
 .input-text, .input-select {
   animation: slideInUp 0.6s ease-out;
   animation-fill-mode: both;
 }
 
 .input-text:nth-child(1) { animation-delay: 0.1s; }
 .input-text:nth-child(2) { animation-delay: 0.2s; }
 .input-text:nth-child(3) { animation-delay: 0.3s; }
 .input-text:nth-child(4) { animation-delay: 0.4s; }
 
 /* Responsive Design */
  @media (max-width: 768px) {
    .page {
      padding: 15px;
    }
    
    .form-container {
      max-width: 95vw;
      padding: 1.5rem 1.25rem;
    }
    
    .logo-img {
      width: 140px;
    }
    
    .form-title {
      font-size: 1.5rem;
    }
    
    .checkbox-group {
      flex-direction: column;
      gap: 10px;
    }
    
    .custom-check {
      width: 100%;
      justify-content: center;
    }
  }
  
  @media (max-width: 480px) {
    .page {
      padding: 10px;
    }
    
    .form-container {
      max-width: 98vw;
      padding: 1.25rem 1rem;
    }
    
    .logo-img {
      width: 120px;
    }
    
    .form-title {
      font-size: 1.25rem;
      margin-bottom: 1rem;
    }
    
    .input-text, .input-select {
      padding: 12px 16px;
      font-size: 14px;
    }
    
    video {
      max-width: 90vw;
    }
  }
</style>
