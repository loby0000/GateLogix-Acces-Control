import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Configuración global para manejar errores de red
window.addEventListener('error', function(e) {
  if (e.message && e.message.includes('net::ERR_ABORTED')) {
    console.warn('Se detectó un error de carga abortada:', e.filename);
    // Evitar que el error se propague y cause problemas en la UI
    e.preventDefault();
    return true;
  }
});

// Interceptor global para errores de carga de recursos
document.addEventListener('error', function(e) {
  if (e.target.tagName === 'IMG' || e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK') {
    console.warn(`Error al cargar recurso: ${e.target.src || e.target.href}`);
    // Podemos intentar recargar o usar un recurso alternativo
    if (e.target.tagName === 'IMG' && !e.target.dataset.retried) {
      e.target.dataset.retried = true;
      e.target.src = 'https://via.placeholder.com/300x150?text=GateLogix';
    }
  }
}, true);

const app = createApp(App)

// Opciones de configuración para las notificaciones toast
const toastOptions = {
  position: "top-right",
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false
}

app.use(router)
app.use(Toast, toastOptions)

// Manejador global de errores de Vue
app.config.errorHandler = (err, vm, info) => {
  console.error('Error en componente Vue:', err);
  console.info('Info:', info);
  
  // Mostrar toast solo para errores que no sean de red abortada
  if (!err.message?.includes('net::ERR_ABORTED')) {
    app.config.globalProperties.$toast.error('Ha ocurrido un error. Por favor, intente nuevamente.');
  }
};

app.mount('#app')
