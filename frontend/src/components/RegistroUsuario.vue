<template>
  <div class="page">
    <div class="form-container">
      <!-- Logo -->
      <div style="text-align:center; margin-bottom: 12px;">
        <img src="../assets/logo.png" alt="LOGO" style="max-width:260px; width:180px; height:auto; margin:auto; display:block;" />
      </div>
      <h2 style="text-align:center; margin-bottom: 18px;">Registro de Usuario Con Equipos</h2>
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

      <div style="margin-bottom:8px;">Insertar imagen</div>
      <button type="button" @click="mostrarOpciones = true" style="margin-bottom:8px;">Agregar Foto o Archivo</button>

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
      errores: { numeroDocumento: "", email: "" }
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
  },

  beforeUnmount() {
    if (this.stopScanner) this.stopScanner();
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
    }
  }
};
</script>
<style scoped>
.page {
  background: #1e293b !important;
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  box-sizing: border-box;
  z-index: 0;
}
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.6s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
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
  background: #fff;
  padding: 1.2rem 1.2rem 1rem 1.2rem;
  border-radius: 16px;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 6px 18px rgba(30,41,59,0.10);
}
.form-container h2 {
  text-align: center;
  color: #111827;
  font-size: 1.25rem;
  margin-bottom: 0.7rem;
}
.input-text, .input-select {
  width: 100%;
  padding: 8px 10px;
  margin-top: 3px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #ffffff;
  box-sizing: border-box;
  transition: border-color .12s ease, box-shadow .12s ease;
}
.input-text:focus, .input-select:focus {
  outline: none;
  border-color: #60a5fa;
  box-shadow: 0 4px 14px rgba(96,165,250,0.12);
}
  .checkbox-group {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    margin-bottom: 4px;
    width: 100%;
  }
  .custom-check {
    display: flex;
    align-items: center;
    background: #f1f5f9;
    border-radius: 8px;
    padding: 6px 16px 6px 8px;
    cursor: pointer;
    font-size: 15px;
    color: #374151;
    border: 1.5px solid #e2e8f0;
    transition: background 0.15s, border 0.15s;
    user-select: none;
    min-width: 110px;
  }
  .custom-check.checked {
    background: #2563eb22;
    border-color: #2563eb;
    color: #1e293b;
  }
  .icon-text {
    display: flex;
    align-items: center;
    gap: 8px;
  }
button {
  cursor: pointer;
}
.enviar {
  background: linear-gradient(90deg, #1e293b, #334155);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  padding: 10px 0;
  box-shadow: 0 6px 18px rgba(30,41,59,0.12);
  margin-top: 8px;
  transition: transform .06s ease, box-shadow .12s ease, opacity .12s ease;
  width: 100%;
}
.enviar:hover { transform: translateY(-2px); }

.cerrar-sesion-btn {
  display: block;
  width: 100%;
  margin-top: 10px;
  background: #ef4444;
  color: #111827;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  padding: 10px 0;
  text-align: center;
  box-shadow: 0 6px 18px rgba(30,41,59,0.12);
  transition: background 0.2s, color 0.2s, transform .06s, box-shadow .12s, opacity .12s;
  cursor: pointer;
  text-decoration: none;
}
.cerrar-sesion-btn:hover {
  background: #b91c1c;
  color: #fff;
  transform: translateY(-2px);
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
@media (max-width: 600px) {
  .form-container {
    max-width: 98vw;
    padding: 1rem 0.5rem;
  }
  video {
    max-width: 98vw;
  }
}
</style>
