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
            <span>{{ usuario.equipo?.marca || '-' }}</span>
            <button
              class="kebab-btn"
              aria-label="Más opciones de equipo"
              @click.stop="toggleEquipoMenu(index)"
            >
              :
            </button>
          </td>

          <td>{{ usuario.equipo?.serial || '-' }}</td>
          <td>{{ usuario.equipo?.caracteristicas || '-' }}</td>
          <td>{{ usuario.equipo?.accesorios?.mouse ? 'Sí' : 'No' }}</td>
          <td>{{ usuario.equipo?.accesorios?.cargador ? 'Sí' : 'No' }}</td>
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
      <div class="modal-content">
        <h2>Registrar Nuevo Equipo</h2>
        <input
          type="text"
          placeholder="Marca del equipo"
          v-model="nuevoEquipo.nombre"
        />
        <input
          type="text"
          placeholder="Serial del equipo"
          v-model="nuevoEquipo.serial"
        />
        <textarea
          placeholder="Características"
          v-model="nuevoEquipo.caracteristicas"
        ></textarea>

        <label>
          <input type="checkbox" v-model="nuevoEquipo.mouse" />
          Mouse
        </label>
        <label>
          <input type="checkbox" v-model="nuevoEquipo.cargador" />
          Cargador
        </label>

        <!-- Sección para cargar imagen del equipo -->
        <div class="file-section">
          <div class="file-label">Insertar imagen del equipo</div>
          <button type="button" class="file-upload-btn" @click="mostrarOpciones = true">📎 Agregar Foto</button>
        </div>
        
        <!-- Vista previa de la imagen -->
        <div v-if="nuevoEquipo.foto" class="image-preview">
          <img :src="nuevoEquipo.foto" alt="Vista previa" style="max-width: 200px; max-height: 150px; margin-top: 10px; border-radius: 4px;" />
        </div>

        <div class="modal-actions">
          <button class="guardar" @click="guardarNuevoEquipo">
            Registrar equipo nuevo
          </button>
          <button class="cancelar" @click="cerrarModal">Cancelar</button>
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
          <div class="modal-footer">
            <button @click="capturarFoto" class="btn-action">Capturar</button>
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
        const serial = res.data.equipo?.serial;
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
      return usuario.equipos?.length
        ? usuario.equipos
        : usuario.equipo
        ? [{ marca: usuario.equipo.marca, serial: usuario.equipo.serial }]
        : [];
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
      };
      
      img.src = dataUrl;
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
        const serial = this.usuarios[0].equipo?.serial;

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
</style>
