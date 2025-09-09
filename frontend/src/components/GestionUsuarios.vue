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
            placeholder="Buscar por documento"
            class="search-input"
            v-model="searchQuery"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search">✕</button>
        </div>
      </div>
      <button class="dashboard-btn" @click="goToDashboard">Dashboard</button>
    </header>

    <!-- Mensajes de estado -->
    <div v-if="loading" class="status-message loading">
      <i class="status-icon">⌛</i> Cargando datos...
    </div>
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
        <tr v-if="usuariosFiltrados.length === 0">
          <td colspan="11" class="no-results">No se encontraron usuarios</td>
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
      successMessage: null
    };
  },
  created() {
    this.cargarUsuarios();
  },
  computed: {
    usuariosFiltrados() {
      if (!this.searchQuery) return this.usuarios;
      
      const query = this.searchQuery.toLowerCase();
      return this.usuarios.filter(usuario => 
        usuario.documento.toLowerCase().includes(query) ||
        usuario.nombre.toLowerCase().includes(query)
      );
    }
  },
  methods: {
    async cargarUsuarios() {
      this.loading = true;
      this.error = null;
      
      try {
        // Obtener token del localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        const response = await fetch('http://localhost:3000/api/usuario-equipo/listar', {
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
        this.usuarios = data.map(usuario => ({
          ...usuario,
          documento: usuario.numeroDocumento // Ajustar nombre de campo
        }));
      } catch (error) {
        console.error('Error al cargar usuarios:', error);
        this.error = `Error al cargar usuarios: ${error.message}`;
      } finally {
        this.loading = false;
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
        
        const response = await fetch(`http://localhost:3000/api/usuario-equipo/${this.usuarioEdit._id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nombre: this.usuarioEdit.nombre,
            tipoDocumento: this.usuarioEdit.tipoDocumento,
            documento: this.usuarioEdit.documento
          })
        });
        
        if (!response.ok) {
          throw new Error(`Error al actualizar usuario: ${response.statusText}`);
        }
        
        const usuarioActualizado = await response.json();
        
        // Actualizar el usuario en la lista local
        if (this.usuarioEditIdx !== null) {
          this.usuarios[this.usuarioEditIdx] = {
            ...usuarioActualizado,
            documento: usuarioActualizado.documento || usuarioActualizado.numeroDocumento
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