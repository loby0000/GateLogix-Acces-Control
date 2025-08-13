<template>
  <div class="page">
    <div class="form-container">
      <!-- Logo -->
      <div style="text-align:center; margin-bottom: 12px;">
        <img src="../assets/logo.png" alt="LOGO" style="max-width:260px; width:180px; height:auto; margin:auto; display:block;" />
      </div>
      <h2 style="text-align:center; margin-bottom: 18px;">Registro de Usuario Con Equipos</h2>

      <!-- Select tipo de registro -->
      <select v-model="tipoRegistro" class="input-select">
        <option disabled value="">Tipo de registro</option>
        <option>Registrar</option>
        <option>Registrado</option>
      </select>

      <!-- Select tipo de usuario -->
      <select v-model="tipoUsuario" class="input-select">
        <option disabled value="">Tipo de usuario</option>
        <option>Administrador</option>
        <option>Guardia</option>
        <option>Visitante</option>
      </select>
      <select v-model="tipoDocumento" class="input-select">
        <option disabled value="">Tipo de documento</option>
        <option value="Cédula ciudadana">Cédula ciudadana</option>
        <option value="Tarjeta de identidad">Tarjeta de identidad</option>
        <option value="Extranjero">Extranjero</option>
      </select>
  <input type="text" v-model="nombre" placeholder="Nombre" class="input-text" />
  <input type="text" v-model="numeroDocumento" placeholder="Documento" class="input-text" />
  <input type="text" v-model="serialEquipo" placeholder="Serial Del Equipo" class="input-text" />
  <input type="text" v-model="marcaEquipo" placeholder="Marca Del Equipo" class="input-text" />
  <input type="text" v-model="caracteristicas" placeholder="Características" class="input-text" />

      <div class="checkbox-group">
        <label class="custom-check" :class="{ checked: mouse }">
          <input type="checkbox" v-model="mouse" style="display:none;" />
          <span class="icon-text">
            <svg v-if="!mouse" width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="6" width="16" height="10" rx="5" stroke="#64748b" stroke-width="2"/><rect x="8" y="2" width="6" height="8" rx="3" stroke="#64748b" stroke-width="2"/></svg>
            <svg v-else width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="6" width="16" height="10" rx="5" fill="#2563eb"/><rect x="8" y="2" width="6" height="8" rx="3" fill="#2563eb"/><path d="M7 11l3 3 5-5" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
            <span>Mouse</span>
          </span>
        </label>
        <label class="custom-check" :class="{ checked: cargador }">
          <input type="checkbox" v-model="cargador" style="display:none;" />
          <span class="icon-text">
            <svg v-if="!cargador" width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="7" y="2" width="8" height="12" rx="4" stroke="#64748b" stroke-width="2"/><rect x="9" y="14" width="4" height="6" rx="2" stroke="#64748b" stroke-width="2"/></svg>
            <svg v-else width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="7" y="2" width="8" height="12" rx="4" fill="#2563eb"/><rect x="9" y="14" width="4" height="6" rx="2" fill="#2563eb"/><path d="M9 10l2 2 2-2" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>
            <span>Cargador</span>
          </span>
        </label>
      </div>

      <div style="margin-bottom:8px;">Insertar imagen</div>
  <button type="button" @click="mostrarOpciones = true" style="margin-bottom:8px;">Agregar Foto o Archivo</button>

      <!-- Modal flotante -->
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

      <!-- Fotos o archivos cargados -->
      <div v-if="fotos.length" style="margin-bottom:8px; display:flex; flex-wrap:wrap; gap:10px; justify-content:center;">
        <div v-for="(img, idx) in fotos" :key="idx" style="text-align:center;">
          <img :src="img.data" alt="Imagen cargada" style="max-width:120px; display:block; margin:auto; border-radius:6px;" />
          <div v-if="img.nombre" style="font-size:13px; color:#444;">{{ img.nombre }}</div>
        </div>
      </div>

      <!-- Mensaje de éxito simulado -->
      <div v-if="registroExitoso" style="background:#e6ffe6; color:#1a7f1a; border-radius:6px; padding:8px; margin-bottom:8px; text-align:center;">
        <span style="font-size:18px;">✔</span> El Registro Ha Sido Exitoso
      </div>

      <button class="enviar" @click.prevent="registrar">Registrar</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tipoRegistro: "",
      tipoUsuario: "",
      tipoDocumento: "",
      nombre: "",
      numeroDocumento: "",
      serialEquipo: "",
      marcaEquipo: "",
      caracteristicas: "",
      mouse: false,
      cargador: false,
      mostrarOpciones: false,
      mostrarCamara: false,
      fotos: [],
      stream: null,
      registroExitoso: false,
    };
  },
  methods: {
    async abrirCamara() {
      this.mostrarOpciones = false;
      this.mostrarCamara = true;
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.$refs.video.srcObject = this.stream;
      } catch (error) {
        alert("No se pudo acceder a la cámara");
      }
    },
    capturarFoto() {
      const canvas = document.createElement("canvas");
      canvas.width = this.$refs.video.videoWidth;
      canvas.height = this.$refs.video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(this.$refs.video, 0, 0);
      this.fotos.push({ data: canvas.toDataURL("image/png"), nombre: "foto_capturada.png" });
      this.cerrarCamara();
    },
    cerrarCamara() {
      this.mostrarCamara = false;
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop());
      }
    },
    subirArchivo() {
      this.mostrarOpciones = false;
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.multiple = true;
      input.onchange = e => {
        const files = Array.from(e.target.files);
        files.forEach(file => {
          const reader = new FileReader();
          reader.onload = ev => {
            this.fotos.push({ data: ev.target.result, nombre: file.name + ' ' + Math.round(file.size/1024) + 'KB' });
          };
          reader.readAsDataURL(file);
        });
      };
      input.click();
    },
    registrar() {
      // Simula registro exitoso
      this.registroExitoso = true;
      setTimeout(() => { this.registroExitoso = false; }, 3000);
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
