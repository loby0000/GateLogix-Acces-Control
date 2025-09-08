<template>
  <div class="container">
    <!-- Header -->
    <header class="header">
      <div class="logo-container">
        <img src="@/assets/logo.png" alt="Logo" class="logo-img" />
      </div>
      <button class="dashboard-btn" @click="goToDashboard">Dashboard</button>
    </header>

    <!-- Buscador -->
    <div class="search-container">
      <input
        type="text"
        placeholder="🔍 Buscar por documento"
        class="search-input"
        v-model="searchQuery"
      />
    </div>

    <!-- Tabla -->
    <table>
      <thead>
        <tr>
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
        <tr v-for="(usuario, idx) in usuarios" :key="usuario.documento">
          <td>{{ usuario.tipoUsuario }}</td>
          <td>{{ usuario.nombre }}</td>
          <td>{{ usuario.tipoDocumento }}</td>
          <td>{{ usuario.documento }}</td>
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
      </tbody>
    </table>

    <!-- Modal de edición corregido -->
    <div v-if="modalVisible" class="modal-overlay">
      <div class="modal-content">
        <h3>Editar Usuario</h3>
        <div class="modal-field">
          <label>Nombre</label>
          <input v-model="usuarioEdit.nombre" />
        </div>
        <div class="modal-field">
          <label>Tipo De Documento</label>
          <select v-model="usuarioEdit.tipoDocumento">
            <option value="Cédula">Cédula</option>
            <option value="Pasaporte">Pasaporte</option>
          </select>
        </div>
        <div class="modal-field">
          <label>Documento</label>
          <input v-model="usuarioEdit.documento" />
        </div>
        <div class="modal-actions">
          <button class="save-btn" 
          lick="guardarUsuario">Guardar</button>
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
      usuarios: [
        {
          tipoUsuario: "Aprendiz",
          nombre: "Juan Pérez",
          tipoDocumento: "Cédula",
          documento: "1234567890",
          email: "juan@gmail.com",
          marcaEquipo: "Lenovo",
          serialEquipo: "45678",
          caracteristicas: "Pegatina de negro con",
          mouse: false,
          cargador: true,
        },
      ],
      modalVisible: false,
      usuarioEdit: {},
      usuarioEditIdx: null,
    };
  },
  methods: {
    editItem(idx) {
      this.usuarioEdit = { ...this.usuarios[idx] };
      this.usuarioEditIdx = idx;
      this.modalVisible = true;
    },
    cerrarModal() {
      this.modalVisible = false;
    },
    guardarUsuario() {
      if (this.usuarioEditIdx !== null) {
        // Actualiza el usuario en la lista con los nuevos datos
        this.usuarios[this.usuarioEditIdx] = { ...this.usuarioEdit };
      }
      this.cerrarModal();
    },
    goToDashboard() {
      this.$router.push('/dashboard');
    },
  },
};
</script>

<style scoped>
/* General Layout */
.container {
  margin-top: 100px; /* Subir todo el contenido aún más */
  padding-top: 0; /* Eliminar espacio superior adicional */
}
.header {
  margin-bottom: 5px; /* Reducir el margen inferior del encabezado */
}
.search-container {
  margin-top: 0; /* Eliminar espacio superior */
  margin-bottom: 5px; /* Reducir espacio inferior */
}
table {
  margin-top: 5px; /* Subir la tabla aún más */
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
thead {
  background: #0d47a1;
  color: white;
}
th, td {
  padding: 12px;
  text-align: center;
  font-size: 0.95rem;
}
tbody tr:nth-child(even) {
  background: #f9f9f9;
}

/* Botón editar */
.edit-btn {
  background: #1565c0;
  border: none;
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}
.edit-btn:hover {
  background: #0d47a1;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 320px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.modal-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 1rem;
}
.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
.save-btn {
  background: #2e7d32;
  border: none;
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}
.save-btn:hover {
  background: #1b5e20;
}
.close-btn {
  background: #c62828;
  border: none;
  color: white;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}
.close-btn:hover {
  background: #8e0000;
}
</style>