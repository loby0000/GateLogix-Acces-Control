<template>
  <section class="audit-logs-wrapper">
    <header class="header">
      <h1>Logs de auditoría</h1>
      <button class="dashboard-btn" @click="goToDashboard">Dashboard</button>
    </header>

    <table class="audit-table">
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Acción</th>
          <th>Marca de tiempo</th>
          <th>Detalles</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="log in logs" :key="log.id">
          <td>{{ log.usuario }}</td>
          <td>{{ log.accion }}</td>
          <td>{{ formatDate(log.timestamp) }}</td>
          <td>
            <Tooltip :text="log.detalles">
              <p class="details-text">{{ snippet(log.detalles) }}</p>
            </Tooltip>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-if="logs.length === 0" class="no-data">No hay logs disponibles.</p>
  </section>
</template>

<script setup>
import { ref } from 'vue';

// Datos simulados de ejemplo
const logs = ref([
  {
    id: 1,
    usuario: 'JuanAdmin',
    accion: 'Cambió estado de guardia',
    timestamp: '2025-08-11T15:32:00',
    detalles: 'Cambió estado de "Juan Pérez" de activo a inactivo',
  },
  // puedes agregar más logs aquí
]);

const goToDashboard = () => {
  // Lógica para redirigir al dashboard o emitir evento
  alert('Navegar a Dashboard');
};

const formatDate = (dateString) => {
  const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleString('es-ES', options);
};

const snippet = (text, maxLength = 40) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};
</script>

<style scoped>
.audit-logs-wrapper {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.8rem;
}

.header h1 {
  font-weight: 700;
  font-size: 1.8rem;
  color: #2c3e50;
}

.dashboard-btn {
  background: #2563eb;
  border: none;
  padding: 0.5rem 1.2rem;
  border-radius: 8px;
  font-weight: 600;
  color: white;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(37, 99, 235, 0.4);
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.dashboard-btn:hover {
  background: #1e40af;
  box-shadow: 0 7px 20px rgba(30, 64, 175, 0.6);
}

.audit-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.75rem;
}

.audit-table th {
  background-color: #3b82f6;
  color: white;
  font-weight: 700;
  text-align: left;
  padding: 0.75rem 1.2rem;
  border-radius: 12px 12px 0 0;
  user-select: none;
}

.audit-table td {
  background-color: white;
  padding: 1rem 1.2rem;
  color: #334155;
  vertical-align: middle;
  box-shadow: 0px 2px 8px rgb(0 0 0 / 0.05);
  border-left: 1px solid #e2e8f0;
  border-right: 1px solid #e2e8f0;
  max-width: 250px;
  word-wrap: break-word;
}

.audit-table tbody tr:last-child td {
  border-radius: 0 0 12px 12px;
  border-bottom: none;
}

.audit-table tbody tr:hover td {
  background-color: #e0f2fe;
  transition: background-color 0.3s ease;
}

.details-text {
  cursor: pointer;
  color: #2563eb;
  font-style: italic;
  user-select: none;
}

/* Tooltip component styles */
.tooltip {
  position: relative;
  display: inline-block;
}

.tooltip .tooltip-text {
  visibility: hidden;
  width: 220px;
  background-color: #2d3748;
  color: #f1f5f9;
  text-align: center;
  border-radius: 8px;
  padding: 0.6rem;
  position: absolute;
  z-index: 10;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 7px 14px rgba(0, 0, 0, 0.15);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  font-size: 0.85rem;
  line-height: 1.2rem;
}

.tooltip:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
  pointer-events: auto;
}

/* Mensaje sin datos */
.no-data {
  text-align: center;
  margin-top: 4rem;
  font-style: italic;
  color: #64748b;
  font-weight: 600;
}
</style>

<script>
// Componente Tooltip para mostrar detalles completos en hover
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Tooltip',
  props: {
    text: {
      type: String,
      required: true
    }
  },
  template: `
    <div class="tooltip">
      <slot></slot>
      <span class="tooltip-text">{{ text }}</span>
    </div>
  `
});
</script>