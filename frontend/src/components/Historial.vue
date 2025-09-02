<template>
  <button class="btn-volver-dashboard-fixed" @click="goToDashboard">Volver al Dashboard</button>
  <section class="container">
    <div class="top-bar">
      <div class="search-filter">
        <input
          type="search"
          v-model="searchQuery"
          placeholder="Buscar por Documento, fecha, documento guardia"
          aria-label="Buscar registros"
          @input="filterTable"
        />
        <select v-model="selectedType" @change="filterTable" aria-label="Tipo registro">
          <option value="">Tipo registro</option>
          <option value="Salida">Salida</option>
          <option value="Entrada">Entrada</option>
        </select>
      </div>
      <div class="actions">
        <button @click="exportData('excel')" class="btn primary">Exportar Excel</button>
        <button @click="exportData('pdf')" class="btn primary">Exportar PDF</button>
      </div>
    </div>

    <table class="records-table">
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Documento</th>
          <th>Serial del equipo</th>
          <th>Entrada</th>
          <th>Salida</th>
          <th>Doc.Guardia</th>
          <th>Tipo</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(record, index) in filteredRecords" :key="index">
          <td>
            <span class="usuario-link" @click="showUserModal(record)">{{ record.usuario }}</span>
          </td>
          <td>{{ record.documento }}</td>
          <td>{{ record.serial }}</td>
          <td>{{ record.entrada }}</td>
          <td>{{ record.salida || '---------'}} </td>
          <td>{{ record.docGuardia }}</td>
          <td>
            <span :class="['type-badge', record.tipo.toLowerCase()]">{{ record.tipo }}</span>
          </td>
        </tr>
        <tr v-if="filteredRecords.length === 0">
          <td colspan="7" class="no-results">No se encontraron registros</td>
        </tr>
      </tbody>
    </table>

    <div v-if="showModal" class="modal-overlay" @click.self="closeUserModal">
      <div class="modal-content">
        <div class="modal-search-row">
          <input type="text" placeholder="Buscar por año" class="modal-search" />
          <input type="text" placeholder="Buscar por mes" class="modal-search" />
          <input type="text" placeholder="Buscar por día" class="modal-search" />
        </div>
        <div class="modal-row">
          <button class="modal-btn">Usuario</button>
          <button class="modal-btn">Documento</button>
        </div>
        <div class="modal-row">
          <button class="modal-btn">Entrada</button>
          <button class="modal-btn">Salida</button>
        </div>
        <div class="modal-row">
          <button class="modal-btn">Cerrar</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  data() {
    return {
      searchQuery: "",
      selectedType: "",
      records: [
        {
          usuario: "Fulano",
          documento: "Fulano123",
          serial: "Fulanoqthiudyd",
          entrada: "hoy",
          salida: "Mañana",
          docGuardia: "3838738974",
          tipo: "Salida"
        },
        {
          usuario: "Fulano2",
          documento: "Fulano2123",
          serial: "Fulano5qthiudyd",
          entrada: "hoy",
          salida: "",
          docGuardia: "3838738974",
          tipo: "Entrada"
        }
      ],
      filteredRecords: [],
      showModal: false,
      selectedUser: null,
    };
  },
  mounted() {
    this.filteredRecords = this.records;
  },
  methods: {
    filterTable() {
      const query = this.searchQuery.trim().toLowerCase();
      this.filteredRecords = this.records.filter(({ usuario, documento, serial, entrada, salida, docGuardia, tipo }) => {
        const matchesSearch =
          usuario.toLowerCase().includes(query) ||
          documento.toLowerCase().includes(query) ||
          entrada.toLowerCase().includes(query) ||
          salida?.toLowerCase().includes(query) ||
          docGuardia.includes(query);
        const matchesType = this.selectedType ? tipo === this.selectedType : true;
        return matchesSearch && matchesType;
      });
    },
    exportData(type) {
      alert(`Función para exportar como ${type.toUpperCase()} aún no implementada.`);
    },
    goToDashboard() {
      this.$router.push({ path: '/dashboard' });
    },
    showUserModal(record) {
      this.selectedUser = record;
      this.showModal = true;
    },
    closeUserModal() {
      this.showModal = false;
      this.selectedUser = null;
    },
  }
}
</script>

<style scoped>
.container {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  margin: 2rem auto;
  color: #222;
  background: #fff;
  width: 90vw;
  min-height: 80vh;
  max-width: 1200px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  border-radius: 16px;
  padding: 2.5rem 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
  width: 100%;
}

.search-filter {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

input[type="search"] {
  padding: 0.5rem 1rem;
  border: 1px solid #bbb;
  border-radius: 6px;
  min-width: 280px;
  font-size: 0.9rem;
  transition: border-color 0.3s ease;
}

input[type="search"]:focus {
  outline: none;
  border-color: #1565c0;
  box-shadow: 0 0 6px #90caf9;
}

select {
  padding: 0.4rem 0.8rem;
  border: 1px solid #bbb;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

select:focus {
  outline: none;
  border-color: #1565c0;
  box-shadow: 0 0 6px #90caf9;
}

.actions {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.35rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s ease;
  color: white;
  user-select: none;
}

.btn.primary {
  background-color: #1565c0;
}

.btn.primary:hover {
  background-color: #0d3c78;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 1.05rem;
  margin-top: 2rem;
}

.records-table thead tr {
  background-color: #f0f4f8;
}

.records-table th,
.records-table td {
  padding: 1rem 1.5rem;
  border: 1px solid #ddd;
  text-align: left;
  vertical-align: middle;
}

.type-badge {
  display: inline-block;
  padding: 0.2rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  user-select: none;
}

.type-badge.salida {
  background-color: #fceaea;
  color: #d32f2f;
}

.type-badge.entrada {
  background-color: #e6f4ea;
  color: #388e3c;
}

.no-results {
  text-align: center;
  color: #888;
  font-style: italic;
  padding: 2rem 0;
}

.dashboard-btn-wrapper {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  margin-top: 2.5rem;
}

.btn-volver-dashboard {
  background: #1565c0;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 1rem 2.2rem;
  font-size: 1.1rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  cursor: pointer;
  transition: background 0.2s;
}
.btn-volver-dashboard:hover {
  background: #0d3c78;
}

.btn-volver-dashboard-fixed {
  position: fixed;
  top: 1.2rem;
  right: 1.5rem;
  background: #1565c0;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.45rem 1.1rem;
  font-size: 0.95rem;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  cursor: pointer;
  z-index: 9999;
  transition: background 0.2s;
}
.btn-volver-dashboard-fixed:hover {
  background: #0d3c78;
}

.usuario-link {
  color: #1565c0;
  text-decoration: underline;
  cursor: pointer;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}
.modal-content {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 32px rgba(0,0,0,0.18);
  padding: 2.5rem 2.5rem 2rem 2.5rem;
  min-width: 420px;
  min-height: 340px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.modal-search-row {
  display: flex;
  gap: 1.2rem;
  margin-bottom: 2rem;
}
.modal-search {
  padding: 0.6rem 1.2rem;
  border: 1px solid #bbb;
  border-radius: 8px;
  font-size: 1rem;
  min-width: 120px;
}
.modal-row {
  display: flex;
  gap: 2rem;
  margin-bottom: 1.2rem;
  justify-content: center;
}
.modal-btn {
  padding: 0.7rem 2.2rem;
  border: 1px solid #1565c0;
  border-radius: 8px;
  background: #f7f7f7;
  color: #222;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.modal-btn:hover {
  background: #e3eafc;
}
</style>