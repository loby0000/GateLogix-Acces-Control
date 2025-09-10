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
/* Variables CSS consistentes con el dashboard */
:root {
  --primary-gradient: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  --secondary-gradient: linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%);
  --success-gradient: linear-gradient(135deg, #059669 0%, #10b981 100%);
  --warning-gradient: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
  --dark-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  --danger-gradient: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.8);
  --shadow-light: 0 8px 32px rgba(30, 64, 175, 0.2);
  --shadow-medium: 0 15px 35px rgba(30, 64, 175, 0.15);
  --shadow-heavy: 0 20px 40px rgba(0, 0, 0, 0.25);
}

/* Contenedor principal con fondo consistente */
.container {
  min-height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
  overflow-y: auto;
  font-family: 'Inter', sans-serif;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Header moderno con glassmorphism */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.logo-container {
  display: flex;
  align-items: center;
}

.logo-img {
  width: 180px;
  height: auto;
  filter: brightness(1.1) contrast(1.1);
}

.dashboard-btn {
  background: var(--primary-gradient);
  color: var(--text-primary);
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: var(--shadow-light);
}

.dashboard-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

/* Contenedor de búsqueda elegante */
.search-container {
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  padding: 0 40px;
}

.search-input {
  width: 100%;
  max-width: 500px;
  padding: 16px 24px;
  border: none;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 500;
  box-shadow: var(--shadow-light);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.search-input:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: var(--shadow-medium);
}

/* Tabla profesional con glassmorphism */
table {
  width: calc(100% - 80px);
  margin: 0 auto 40px;
  border-collapse: separate;
  border-spacing: 0;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

thead {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
}

th {
  padding: 20px 16px;
  text-align: left;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

td {
  padding: 18px 16px;
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

tbody tr {
  transition: all 0.3s ease;
}

tbody tr:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.01);
}

.icon-cell {
  text-align: center;
  font-size: 16px;
}

/* Botón editar moderno */
.edit-btn {
  background: var(--secondary-gradient);
  border: none;
  color: var(--text-primary);
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: var(--shadow-light);
}

.edit-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

/* Modal elegante */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 32px;
  width: 400px;
  max-width: 90vw;
  box-shadow: var(--shadow-heavy);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-primary);
}

.modal-content h3 {
  margin: 0 0 24px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  text-align: center;
}

.modal-field {
  margin-bottom: 20px;
}

.modal-field label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.modal-field input,
.modal-field select {
  width: 100%;
  padding: 12px 16px;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: var(--text-primary);
  font-size: 14px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-sizing: border-box;
}

.modal-field input::placeholder {
  color: var(--text-secondary);
}

.modal-field input:focus,
.modal-field select:focus {
  outline: none;
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
}

.modal-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 32px;
}

.save-btn {
  background: var(--success-gradient);
  border: none;
  color: var(--text-primary);
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: var(--shadow-light);
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.close-btn {
  background: var(--danger-gradient);
  border: none;
  color: var(--text-primary);
  padding: 12px 24px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  box-shadow: var(--shadow-light);
}

.close-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

/* Responsive design */
@media (max-width: 768px) {
  .header {
    padding: 16px 20px;
    flex-direction: column;
    gap: 16px;
  }
  
  .logo-img {
    width: 140px;
  }
  
  .search-container {
    padding: 0 20px;
  }
  
  table {
    width: calc(100% - 40px);
    font-size: 12px;
  }
  
  th, td {
    padding: 12px 8px;
  }
  
  .modal-content {
    width: 350px;
    padding: 24px;
  }
}
</style>