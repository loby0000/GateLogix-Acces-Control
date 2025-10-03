import { createApp } from 'vue'
import './style.css'
import './responsive-utilities.css'
import App from './App.vue'
import router from './router'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import httpCacheInterceptor from './services/httpInterceptor.js'
import axios from 'axios'
import frontendCacheService from './services/cacheService.js'

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

// Configurar interceptores HTTP con caché
const configuredAxios = httpCacheInterceptor.setup(axios);

// Configurar URL base para Axios
const apiUrl = import.meta.env.VITE_API_URL || 
               (window.location.hostname === 'localhost' ? 
                'http://localhost:3000' : 
                'https://backend-736887951555.europe-west1.run.app');
console.log('🌐 API URL configurada:', apiUrl);
configuredAxios.defaults.baseURL = apiUrl;

// Hacer Axios disponible globalmente
const app = createApp(App)
app.config.globalProperties.$http = configuredAxios;
app.provide('$http', configuredAxios);

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

// Escuchadores globales para cachear eventos de notificaciones cuando el panel no está montado
const NOTIF_QUEUE_KEY = 'notifications_queue';
// Desduplicación simple para evitar eventos duplicados (window + document)
const _recentEventMap = new Map();
const _DEDUP_MS = 800; // ventana de desduplicación
function enqueueNotificationEvent(eventName, detail) {
  try {
    const now = Date.now();
    let detailKey = '';
    try { detailKey = JSON.stringify(detail || {}); } catch { detailKey = String(detail || ''); }
    const key = `${eventName}:${detailKey}`;
    const last = _recentEventMap.get(key) || 0;
    if (now - last < _DEDUP_MS) return; // ignorar duplicado reciente
    _recentEventMap.set(key, now);

    const existing = frontendCacheService.get(NOTIF_QUEUE_KEY) || [];
    // Guardar al inicio para mantener orden reciente
    existing.unshift({ eventName, detail, time: now });
    // Limitar tamaño de la cola
    if (existing.length > 50) existing.pop();
    // Persistir por 6 horas
    frontendCacheService.set(NOTIF_QUEUE_KEY, existing, 6 * 60 * 60 * 1000);
  } catch (e) {
    console.warn('No se pudo cachear evento de notificación:', e?.message || e);
  }
}

const globalNotificationEvents = [
  'usuario-registrado',
  'guardia-sesion-expirada',
  'registros-actualizados',
  'guardia-registrado',
  'guardia-inicio-sesion',
  'admin-inicio-sesion',
  'admin-registrado',
  'guardia-estado-cambiado',
  'equipo-registrado',
  'historial-movimiento-registrado',
];

globalNotificationEvents.forEach((ev) => {
  const handler = (e) => enqueueNotificationEvent(ev, e.detail);
  // Capturar en window y document, con desduplicación para evitar dobles
  window.addEventListener(ev, handler, { capture: true });
  document.addEventListener(ev, handler, { capture: true });
});

app.mount('#app')
