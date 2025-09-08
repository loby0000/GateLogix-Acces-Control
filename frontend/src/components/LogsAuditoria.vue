<template>
  <div class="logs-auditoria-container">
    <h2>Logs Auditoría</h2>
    <p>Aquí se mostrarán los registros de auditoría del sistema.</p>
  </div>
</template>

<script>
export default {
  name: 'LogsAuditoria',
};
</script>

<style scoped>
.logs-auditoria-container {
  max-width: 800px;
  margin: 40px auto;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 0 20px rgb(0 0 0 / 0.1);
  padding: 2rem 3rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h2 {
  color: #2669f5;
  font-weight: 700;
  font-size: 1.8rem;
  margin-bottom: 1rem;
}
</style>
