<template>
  <div class="dashboard-container">
    <!-- Logo -->
    <div class="logo">
      <img src="@/assets/logo.png" alt="Logo" />
    </div>

    <!-- Barra de búsqueda -->
    <div class="search-bar">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Buscar por documento y nombre"
        @input="onSearch"
      />
      <button>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2" fill="none"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    </div>
    <!-- Tabla de usuarios -->
    <table class="user-table">
      <thead>
        <tr>
          <th>Tipo De Usuario</th>
          <th>Nombre</th>
          <th>Tipo De Documento</th>
          <th>Documento</th>
          <th>Equipos asociados</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="user in filteredUsers" :key="user.document">
          <td>{{ user.tipoUsuario }}</td>
          <td>{{ user.nombre }}</td>
          <td>{{ user.tipoDocumento }}</td>
          <td>{{ user.documento }}</td>
          <td>{{ user.equiposAsociados }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'ControlEquipos',
  data() {
    return {
      searchQuery: '',
      users: [
        // Ejemplo de datos
        {
          tipoUsuario: 'Admin',
          nombre: 'Juan Pérez',
          tipoDocumento: 'DNI',
          documento: '12345678',
          equiposAsociados: 'Equipo A, Equipo B',
        },
        {
          tipoUsuario: 'Usuario',
          nombre: 'María López',
          tipoDocumento: 'Pasaporte',
          documento: 'A9876543',
          equiposAsociados: 'Equipo C',
        },
        // Más usuarios...
      ],
    };
  },
  computed: {
    filteredUsers() {
      if (!this.searchQuery) return this.users;
      const query = this.searchQuery.toLowerCase();
      return this.users.filter(user => {
        return (
          user.nombre.toLowerCase().includes(query) ||
          user.documento.toLowerCase().includes(query)
        );
      });
    },
  },
  methods: {
    onSearch() {
      // Se actualiza automáticamente con computed
    },
  },
};
</script>

<style scoped>
.dashboard-container {
  padding: 40px 32px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.10);
  max-width: 1100px;
  margin: 40px auto;
}

.logo {
  margin-bottom: 32px;
  display: flex;
  justify-content: center;
}

.logo img {
  max-width: 240px;
  height: auto;
}

.search-bar {
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.search-bar input {
  flex-grow: 1;
  padding: 16px 18px;
  font-size: 18px;
  border-radius: 10px;
  border: 1.5px solid #2669f5;
  background: #f5f7fa;
  transition: border-color 0.3s;
}
.search-bar input:focus {
  border-color: #1a4dc1;
  background: #fff;
  outline: none;
}

.search-bar button {
  background: #2669f5;
  border: none;
  cursor: pointer;
  margin-left: 0;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}
.search-bar button:hover {
  background: #1a4dc1;
}
.search-bar svg {
  width: 28px;
  height: 28px;
  color: #fff;
}

.user-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 18px;
}

.user-table th, .user-table td {
  border: none;
  padding: 22px 18px;
  text-align: left;
  font-size: 1.15rem;
}

.user-table th {
  font-weight: bold;
  background-color: #eaf1fb;
  color: #2669f5;
  border-radius: 10px 10px 0 0;
}

.user-table tr {
  background: #f7faff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(38,105,245,0.07);
}

.user-table td {
  border-radius: 0 0 10px 10px;
}
</style>