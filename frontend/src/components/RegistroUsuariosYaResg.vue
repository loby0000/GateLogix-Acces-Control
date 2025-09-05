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

    <!-- Botón registrar general -->
    <div class="registrar-btn">
      <button @click="registrar">Registrar</button>
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

        <input type="file" @change="subirImagen" />

        <div class="modal-actions">
          <button class="guardar" @click="guardarNuevoEquipo">
            Registrar equipo nuevo
          </button>
          <button class="cancelar" @click="cerrarModal">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";
import barcodeScannerMixin from "../mixins/barcodeScannerMixin.js";

export default {
  name: "RegistroUsuariosYaResg",
  mixins: [barcodeScannerMixin], // 🔹 Agregar mixin
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
        imagen: null,
      },
      usuarios: [],
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
          `http://localhost:3000/api/usuario-equipo/buscar-documento/${this.buscarDocumento}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );

        this.usuarios = [res.data];
      } catch (err) {
        console.error("❌ Error al buscar:", err.response?.data || err.message);
        this.usuarios = [];
        alert("No se encontró el usuario");
      }
    },

    // 🔹 Búsqueda por serial (desde escaneo)
    async buscarPorSerial(serial) {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/usuario-equipo/buscar/${serial}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );

        this.usuarios = [res.data];
      } catch (err) {
        console.error("❌ Error al buscar por serial:", err.response?.data || err.message);
        this.usuarios = [];
        alert("No se encontró el usuario con ese serial");
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
    },
    subirImagen(event) {
      const file = event.target.files[0];
      if (file) this.nuevoEquipo.imagen = file;
    },
    guardarNuevoEquipo() {
      if (this.usuarioSeleccionado) {
        if (!this.usuarioSeleccionado.equipos)
          this.usuarioSeleccionado.equipos = [];
        this.usuarioSeleccionado.equipos.push({
          nombre: this.nuevoEquipo.nombre,
          serial: this.nuevoEquipo.serial,
        });
      }
      this.cerrarModal();
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

/* ===== Botón registrar ===== */
.registrar-btn {
  display: flex;
  justify-content: center;
  margin-top: 36px;
}
.registrar-btn button {
  padding: 16px 36px;
  background: #27ae60;
  color: white;
  border: none;
  border-radius: 14px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.2s, transform 0.1s;
}
.registrar-btn button:hover {
  background: #1e8e4d;
  transform: scale(1.03);
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

/* ===== Animaciones ===== */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
