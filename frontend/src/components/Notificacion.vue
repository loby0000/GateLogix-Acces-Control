<template>
  <div class="notificaciones-container">
    <h2>Notificaciones</h2>
    <div class="notification" v-for="(notification, index) in notifications" :key="index">
      <div
        class="icon"
        :class="notification.type"
        aria-hidden="true"
      >
        <span v-if="notification.type === 'message'">💬</span>
        <span v-else-if="notification.type === 'alert'">❗</span>
      </div>
      <div class="content">
        <p class="message">{{ notification.message }}</p>
        <p class="time">{{ notification.time }}</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "Notificaciones",
  data() {
    return {
      notifications: [
        {
          type: "message",
          message: "El informe mensual ha sido generado",
          time: "hace 2 min",
        },
        {
          type: "alert",
          message: 'Ha expirado la sesión de "paulaR"',
          time: "hace 1 hora",
        },
        {
          type: "message",
          message: "Nueva solicitud de acceso",
          time: "hace 3 horas",
        },
      ],
    };
  },
};
</script>

<style scoped>
.notificaciones-container {
  width: 300px;
  background: #f9fafb;
  box-shadow: 0 0 6px rgba(0,0,0,0.1);
  border-radius: 8px;
  padding: 16px;
  font-family: Arial, sans-serif;
}

h2 {
  font-weight: 700;
  font-size: 1.2rem;
  margin-bottom: 12px;
  color: #172130;
}

.notification {
  display: flex;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 4px;
  border: 1px solid #dbe2e8;
  margin-bottom: 8px;
}

.notification:last-child {
  margin-bottom: 0;
}

.icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 10px;
  font-size: 1.2rem;
  color: white;
}

.icon.message {
  background-color: #8193a3;
}

.icon.alert {
  background-color: #1568fa;
}

.content {
  flex-grow: 1;
}

.message {
  font-weight: 600;
  font-size: 0.95rem;
  color: #172130;
  margin: 0 0 4px 0;
}

.time {
  font-size: 0.8rem;
  color: #797a80;
  margin: 0;
}
</style>