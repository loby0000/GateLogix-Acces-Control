<template>
  <div class="notificaciones-container">
    <div class="header">
      <h2>Notificaciones</h2>
      <select v-model="filtroCategoria" class="filter-select" aria-label="Filtrar notificaciones">
        <option value="Todos">Todos</option>
        <option value="Alertas">Alertas</option>
        <option value="Sistema">Sistema</option>
        <option value="Guardias">Guardias</option>
        <option value="Usuarios">Usuarios</option>
        <option value="Equipos">Equipos</option>
      </select>
    </div>
    <transition-group name="notif" tag="div" class="notifications-list">
      <div class="notification" v-for="(notification, index) in filteredNotifications" :key="notification.id || index" :class="notification.type">
        <div
          class="icon"
          :class="notification.type"
          aria-hidden="true"
        >
          <span v-if="notification.type === 'message'">💬</span>
          <span v-else-if="notification.type === 'info'">ℹ️</span>
          <span v-else-if="notification.type === 'success'">✅</span>
          <span v-else-if="notification.type === 'warning'">⚠️</span>
          <span v-else-if="notification.type === 'alert'">❗</span>
        </div>
        <div class="content">
          <p class="message">{{ notification.message }}</p>
          <p class="time">{{ notification.time }} • {{ notification.category }}</p>
        </div>
        <button class="close-btn" @click="dismissNotification(notification)" aria-label="Cerrar">×</button>
      </div>
    </transition-group>
  </div>
  
</template>

<script>
import { getApiUrl } from '@/utils/apiConfig.js';
import frontendCacheService from '@/services/cacheService.js';
export default {
  name: "Notificaciones",
  data() {
    return {
      notifications: [],
      pollIntervalId: null,
      softRefreshIntervalId: null,
      notificados24h: new Set(),
      maxNotifications: Infinity,
      maxAlertas24hPorCarga: Infinity,
      filtroCategoria: 'Todos',
      _eventHandlers: {},
      _recentEventMap: new Map(),
    };
  },
  mounted() {
    // Consumir eventos cacheados si existen
    try {
      // Purgar mensajes de desarrollo persistidos
      this.purgeDevReadyMessages();
      // Cargar notificaciones persistidas desde caché (TTL por categoría)
      this.loadPersistedNotifications();

      const events = frontendCacheService.get('notifications_queue') || [];
      if (Array.isArray(events) && events.length) {
        // Reproducir eventos en orden del más antiguo al más reciente
        events.slice().reverse().forEach((item) => {
          const { eventName, detail } = item || {};
          if (!eventName) return;
          const eventMap = {
            'usuario-registrado': this.onUsuarioRegistrado,
            'guardia-sesion-expirada': this.onSesionGuardiaExpirada,
            'registros-actualizados': this.onRegistrosActualizados,
            'guardia-registrado': this.onGuardiaRegistrado,
            'guardia-inicio-sesion': this.onGuardiaInicioSesion,
            'admin-inicio-sesion': this.onAdminInicioSesion,
            'admin-registrado': this.onAdminRegistrado,
            'guardia-estado-cambiado': this.onGuardiaEstadoCambiado,
            'equipo-registrado': this.onEquipoRegistrado,
            'historial-movimiento-registrado': this.onMovimientoRegistrado,
          };
          const handler = eventMap[eventName];
          if (typeof handler === 'function') {
            // Simular evento entregando detail
            handler({ detail });
          }
        });
        // Limpiar cola después de consumir
        frontendCacheService.delete('notifications_queue');
      }
    } catch (e) {
      console.warn('No se pudo cargar cola de notificaciones:', e?.message || e);
    }
    // Escuchar eventos globales en window y document con desduplicación simple
    const register = (target, name, handler) => {
      // Wrap del handler con desduplicación por nombre+detail
      const wrapped = (e) => {
        try {
          const now = Date.now();
          let detailKey = '';
          try { detailKey = JSON.stringify(e?.detail || {}); } catch { detailKey = String(e?.detail || ''); }
          const key = `${name}:${detailKey}`;
          const last = this._recentEventMap.get(key) || 0;
          if (now - last < 800) return; // ignorar duplicado reciente
          this._recentEventMap.set(key, now);
          handler(e);
        } catch (err) {
          console.warn('Error manejando evento', name, err?.message || err);
        }
      };
      target.addEventListener(name, wrapped);
      const id = `${target === window ? 'window' : 'document'}:${name}`;
      this._eventHandlers[id] = wrapped;
    };
    const addListeners = (target) => {
      register(target, 'usuario-registrado', this.onUsuarioRegistrado);
      register(target, 'guardia-sesion-expirada', this.onSesionGuardiaExpirada);
      register(target, 'registros-actualizados', this.onRegistrosActualizados);
      register(target, 'guardia-registrado', this.onGuardiaRegistrado);
      register(target, 'guardia-inicio-sesion', this.onGuardiaInicioSesion);
      register(target, 'admin-inicio-sesion', this.onAdminInicioSesion);
      register(target, 'admin-registrado', this.onAdminRegistrado);
      register(target, 'guardia-estado-cambiado', this.onGuardiaEstadoCambiado);
      register(target, 'equipo-registrado', this.onEquipoRegistrado);
      register(target, 'historial-movimiento-registrado', this.onMovimientoRegistrado);
    };
    addListeners(window);
    addListeners(document);

    // Iniciar polling para detectar usuarios con más de 24h sin salir
    this.iniciarPolling24h();

    // Refresco interno cada 30 segundos: recalcular tiempos y limpiar >24h
    try {
      this.softRefreshIntervalId = setInterval(() => {
        this.softRefresh();
      }, 30 * 1000);
    } catch (e) {
      // Ignorar si no se puede programar refresco
    }

    // Quitar mensaje de sistema en modo desarrollo
  },
  beforeUnmount() {
    const remove = (target, name) => {
      const id = `${target === window ? 'window' : 'document'}:${name}`;
      const wrapped = this._eventHandlers[id];
      if (wrapped) target.removeEventListener(name, wrapped);
    };
    const removeListeners = (target) => {
      remove(target, 'usuario-registrado');
      remove(target, 'guardia-sesion-expirada');
      remove(target, 'registros-actualizados');
      remove(target, 'guardia-registrado');
      remove(target, 'guardia-inicio-sesion');
      remove(target, 'admin-inicio-sesion');
      remove(target, 'admin-registrado');
      remove(target, 'guardia-estado-cambiado');
      remove(target, 'equipo-registrado');
      remove(target, 'historial-movimiento-registrado');
    };
    removeListeners(window);
    removeListeners(document);

    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
    }
    if (this.softRefreshIntervalId) {
      clearInterval(this.softRefreshIntervalId);
      this.softRefreshIntervalId = null;
    }
  },
  methods: {
    // Refresco interno: actualizar tiempos, limpiar expirados y mezclar caché
    softRefresh() {
      try {
        // Recalcular tiempo relativo
        for (const n of this.notifications) {
          const created = n.createdAt || Date.now();
          n.time = this.formatRelativeTime(new Date(created));
        }
        // Limpiar los que superaron 24h (excepto Alertas/Sistema)
        this.cleanupExpiredNotifications();
        // Purgar mensajes de desarrollo si aún existen
        this.purgeDevReadyMessages();
        // Cargar nuevas notificaciones persistidas (sin duplicar)
        this.loadPersistedNotifications();
      } catch (e) {
        console.warn('Error en refresco interno:', e?.message || e);
      }
    },
    // Eliminar una notificación persistida del caché por id
    deleteNotificationFromCache(notif) {
      try {
        if (!notif || !notif.id) return;
        const key = `notif_${notif.id}`;
        frontendCacheService.delete(key);
      } catch (e) {
        console.warn('No se pudo eliminar notificación del caché:', e?.message || e);
      }
    },
    // Detectar mensaje de desarrollo "Panel de notificaciones listo"
    isDevReadyMessage(notif) {
      const msg = String(notif?.message || '').toLowerCase();
      return msg.includes('panel de notificaciones listo');
    },
    // Purgar del almacenamiento mensajes de desarrollo para que no reaparezcan
    purgeDevReadyMessages() {
      try {
        const toDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
          const rawKey = localStorage.key(i);
          if (!rawKey || typeof rawKey !== 'string') continue;
          if (rawKey.startsWith('gatelogix_notif_')) {
            const serviceKey = rawKey.replace('gatelogix_', '');
            const notif = frontendCacheService.get(serviceKey);
            if (notif && this.isDevReadyMessage(notif)) {
              toDelete.push(serviceKey);
            }
          }
        }
        for (const k of toDelete) {
          try { frontendCacheService.delete(k); } catch {}
        }
        // También limpiar del estado actual si ya están cargados
        this.notifications = this.notifications.filter(n => !this.isDevReadyMessage(n));
      } catch (e) {
        console.warn('No se pudo purgar mensajes de desarrollo:', e?.message || e);
      }
    },
    // --- Persistencia por notificación con TTL ---
    persistNotification(notif) {
      try {
        const isCritical = notif.category === 'Alertas' || notif.category === 'Sistema';
        // Para Alertas y Sistema, persistencia indefinida hasta eliminación manual
        const ttl = isCritical ? 0 : (24 * 60 * 60 * 1000);
        const key = `notif_${notif.id}`;
        frontendCacheService.set(key, notif, ttl);
      } catch (e) {
        console.warn('No se pudo persistir notificación:', e?.message || e);
      }
    },
    loadPersistedNotifications() {
      try {
        const arr = [];
        for (let i = 0; i < localStorage.length; i++) {
          const rawKey = localStorage.key(i);
          if (!rawKey || typeof rawKey !== 'string') continue;
          // Las claves del servicio llevan prefijo 'gatelogix_'
          if (rawKey.startsWith('gatelogix_notif_')) {
            const serviceKey = rawKey.replace('gatelogix_', '');
            const notif = frontendCacheService.get(serviceKey);
            if (notif) {
              // Recalcular tiempo relativo
              const created = notif.createdAt || Date.now();
              notif.time = this.formatRelativeTime(new Date(created));
              arr.push(notif);
            }
          }
        }
        // Ordenar por más recientes
        arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        // Insertar al estado actual sin duplicar IDs
        const existingIds = new Set(this.notifications.map(n => n.id));
        for (const n of arr) {
          if (!existingIds.has(n.id)) this.notifications.push(n);
        }
      } catch (e) {
        console.warn('No se pudieron cargar notificaciones persistidas:', e?.message || e);
      }
    },
    // --- Utilidades de deduplicación para alertas 24h ---
    alert24hKey(key) {
      // Normalizar clave para almacenamiento
      return `alert24h_seen_${String(key).replace(/[^a-zA-Z0-9:_-]/g, '')}`;
    },
    hasAlert24hSeen(key) {
      try {
        const k = this.alert24hKey(key);
        return !!frontendCacheService.get(k);
      } catch (e) {
        return false;
      }
    },
    markAlert24hSeen(key) {
      try {
        const k = this.alert24hKey(key);
        const ttl24h = 24 * 60 * 60 * 1000;
        frontendCacheService.set(k, true, ttl24h);
      } catch (e) {
        // Ignorar errores de caché para no afectar el UI
      }
    },
    addNotification({ type = 'message', message, category = 'Sistema', dedupKey = '' }) {
      const now = Date.now();
      const time = this.formatRelativeTime(new Date(now));
      // ID estable si se proporciona dedupKey (p.ej. para alertas 24h por usuario)
      const stableId = dedupKey ? `stable_${category}:${dedupKey}` : `${now}-${Math.random().toString(36).slice(2,8)}`;
      const notif = { id: stableId, type, message, time, category, createdAt: now };

      // Insertar al comienzo
      this.notifications.unshift(notif);
      // Persistir con TTL según categoría
      this.persistNotification(notif);
      // Notificaciones persistentes: no se auto-cierran
    },
    // Eliminar notificaciones (excepto Alertas y Sistema) con más de 24h
    cleanupExpiredNotifications() {
      try {
        const ahora = Date.now();
        const diaMs = 24 * 60 * 60 * 1000;
        const restantes = [];
        for (const n of this.notifications) {
          const esCritica = n.category === 'Alertas' || n.category === 'Sistema';
          const created = n.createdAt || ahora;
          const dentro24h = (ahora - created) <= diaMs;
          const keep = esCritica || dentro24h;
          if (keep) {
            restantes.push(n);
          } else {
            // Remover del caché para que no reaparezca tras refrescar
            this.deleteNotificationFromCache(n);
          }
        }
        this.notifications = restantes;
      } catch (e) {
        console.warn('Error limpiando notificaciones:', e?.message || e);
      }
    },

    dismissNotification(notif) {
      if (notif?._timeoutId) clearTimeout(notif._timeoutId);
      // Remover del caché persistente
      this.deleteNotificationFromCache(notif);
      const idx = this.notifications.indexOf(notif);
      if (idx !== -1) this.notifications.splice(idx, 1);
    },

    formatRelativeTime(date) {
      const diffMs = Date.now() - date.getTime();
      const minutes = Math.floor(diffMs / 60000);
      const hours = Math.floor(minutes / 60);
      if (minutes < 1) return 'ahora';
      if (minutes < 60) return `hace ${minutes} min`;
      return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    },

    onUsuarioRegistrado(e) {
      const nombre = e?.detail?.nombre || 'Usuario';
      const documento = e?.detail?.documento || '';
      this.addNotification({
        type: 'success',
        category: 'Usuarios',
        message: `Se registró un usuario: ${nombre}${documento ? ` (${documento})` : ''}`,
      });
    },

    onSesionGuardiaExpirada(e) {
      const nombre = e?.detail?.nombre || 'Guardia';
      const documento = e?.detail?.documento || '';
      this.addNotification({
        type: 'alert',
        category: 'Guardias',
        message: `La sesión de ${nombre}${documento ? ` (${documento})` : ''} expiró`,
      });
    },

    onRegistrosActualizados(e) {
      const registros = e?.detail?.registros;
      this.addNotification({
        type: 'info',
        category: 'Guardias',
        message: `Registros del guardia actualizados${typeof registros === 'number' ? `: ${registros}` : ''}`,
      });
    },

    onGuardiaRegistrado(e) {
      const nombre = e?.detail?.nombre || 'Guardia';
      const documento = e?.detail?.documento || '';
      const jornada = e?.detail?.jornada || '';
      this.addNotification({
        type: 'success',
        category: 'Guardias',
        message: `Nuevo guardia registrado: ${nombre}${documento ? ` (${documento})` : ''}${jornada ? ` • ${jornada}` : ''}`,
      });
    },

    onGuardiaInicioSesion(e) {
      const documento = e?.detail?.documento || '';
      const jornada = e?.detail?.jornada || '';
      this.addNotification({
        type: 'success',
        category: 'Guardias',
        message: `Guardia inició sesión${documento ? ` (${documento})` : ''}${jornada ? ` • ${jornada}` : ''}`,
      });
    },

    onAdminInicioSesion(e) {
      const usuario = e?.detail?.usuario || '';
      this.addNotification({
        type: 'success',
        category: 'Sistema',
        message: `Admin inició sesión${usuario ? ` (${usuario})` : ''}`,
      });
    },

    onAdminRegistrado(e) {
      const usuario = e?.detail?.usuario || '';
      const documento = e?.detail?.documento || '';
      const nombre = e?.detail?.nombre || '';
      this.addNotification({
        type: 'success',
        category: 'Sistema',
        message: `Nuevo admin registrado${nombre ? `: ${nombre}` : ''}${usuario ? ` • Usuario: ${usuario}` : ''}${documento ? ` (${documento})` : ''}`,
      });
    },

    onEquipoRegistrado(e) {
      const serial = e?.detail?.serial || '';
      const documento = e?.detail?.documento || '';
      const nombre = e?.detail?.nombre || '';
      this.addNotification({
        type: 'success',
        category: 'Equipos',
        message: `Nuevo equipo registrado${serial ? ` • Serial: ${serial}` : ''}${nombre ? ` • Usuario: ${nombre}` : ''}${documento ? ` (${documento})` : ''}`,
      });
    },

    onMovimientoRegistrado(e) {
      const tipo = e?.detail?.tipo; // 'entrada' | 'salida'
      const estado = e?.detail?.estado; // 'Ingreso' | 'Egreso'
      const usuario = e?.detail?.usuario || 'Usuario';
      const serial = e?.detail?.serial || '';
      const esEntrada = tipo === 'entrada';
      const iconType = esEntrada ? 'success' : 'info';
      const categoria = 'Usuarios';
      const mensaje = `${estado} registrado${usuario ? ` • ${usuario}` : ''}${serial ? ` • Equipo: ${serial}` : ''}`;
      this.addNotification({ type: iconType, category: categoria, message: mensaje });
    },

    onGuardiaEstadoCambiado(e) {
      const nombre = e?.detail?.nombre || 'Guardia';
      const estado = e?.detail?.estado || '';
      this.addNotification({
        type: estado === 'activo' ? 'info' : 'warning',
        category: 'Guardias',
        message: `Guardia ${nombre} ${estado === 'activo' ? 'reactivado' : 'desactivado'}`,
      });
    },

    iniciarPolling24h() {
      // Ejecutar inmediatamente y luego cada minuto
      this.verificarUsuarios24h();
      this.pollIntervalId = setInterval(this.verificarUsuarios24h, 60 * 1000);
    },

    async verificarUsuarios24h() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Usar configuración de API robusta para entorno local/producción
        const url = getApiUrl('api/historial/listar');
        const params = new URLSearchParams({ page: 1, limit: 200, t: Date.now() });
        const response = await fetch(`${url}?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const historial = await response.json();
        const ahora = Date.now();
        const diaMs = 24 * 60 * 60 * 1000;

        let agregadas = 0;
        for (const h of historial) {
          const entrada = h?.entrada ? new Date(h.entrada).getTime() : null;
          const salida = h?.salida ? new Date(h.salida).getTime() : null;
          const estado = h?.estado || '';
          const usuario = h?.usuario;
          const documento = usuario?.numeroDocumento || h?.documento || '';
          const nombre = usuario?.nombre || 'Usuario';

          // Detectar entradas abiertas: sin salida y >24h (estado 'Ingreso' cuando disponible)
          if (!salida && entrada && (ahora - entrada > diaMs) && (estado ? estado === 'Ingreso' : true)) {
            const key = documento || usuario?._id || `${nombre}:${h.serial}`;
            // Evitar duplicados: revisar set en memoria y caché persistida con TTL 24h
            if (!this.notificados24h.has(key) && !this.hasAlert24hSeen(key)) {
              this.notificados24h.add(key);
              this.markAlert24hSeen(key);
              this.addNotification({
                type: 'alert',
                category: 'Alertas',
                message: `El usuario ${nombre}${documento ? ` (${documento})` : ''} no ha salido en más de 24 horas`,
                dedupKey: key
              });
              agregadas++;
              if (agregadas >= this.maxAlertas24hPorCarga) break;
            }
          }
        }
      } catch (err) {
        console.warn('Error verificando usuarios >24h:', err?.message || err);
      }
    },
  },
  computed: {
    filteredNotifications() {
      const cat = this.filtroCategoria;
      if (cat === 'Todos') return this.notifications;
      return this.notifications.filter(n => n.category === cat);
    }
  }
};
</script>

<style scoped>
.notificaciones-container {
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(0,0,0,0.12);
  border-radius: 16px;
  padding: 20px;
  font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

h2 {
  font-weight: 700;
  font-size: 1.2rem;
  color: #172130;
}

.filter-select {
  border: 1px solid #e3e8ef;
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 0.9rem;
  color: #172130;
  background: #f9fafb;
}

.notifications-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 12px;
  max-height: 60vh; /* altura máxima visible */
  overflow: auto; /* mostrar scroll al superar límite */
}

.notification {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e6e8eb;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
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
  background-color: #64748b; /* slate */
}

.icon.alert {
  background-color: #ef4444; /* red */
}

.icon.success {
  background-color: #22c55e; /* green */
}

.icon.info {
  background-color: #3b82f6; /* blue */
}

.icon.warning {
  background-color: #f59e0b; /* amber */
}

.content {
  flex-grow: 1;
  min-width: 0; /* permite truncar si es necesario */
}

.message {
  font-weight: 600;
  font-size: 0.95rem;
  color: #172130;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 3; /* estándar para compatibilidad */
  -webkit-line-clamp: 3; /* mostrar hasta 3 líneas */
  -webkit-box-orient: vertical;
}

.time {
  font-size: 0.8rem;
  color: #797a80;
  margin: 0;
}

.close-btn {
  border: none;
  background: transparent;
  color: #9aa1a9;
  font-size: 1rem;
  cursor: pointer;
  padding: 4px 6px;
}

.notification.success {
  border-left: 3px solid #22c55e;
}
.notification.alert {
  border-left: 3px solid #ef4444;
}
.notification.info {
  border-left: 3px solid #3b82f6;
}
.notification.warning {
  border-left: 3px solid #f59e0b;
}

/* Animaciones de entrada/salida */
.notif-enter-active, .notif-leave-active {
  transition: all 0.25s ease;
}
.notif-enter-from, .notif-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.notifications-list .notification:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}

/* Responsive tweaks */
@media (max-width: 640px) {
  .notificaciones-container {
    padding: 16px;
    border-radius: 12px;
  }
  .notifications-list {
    grid-template-columns: 1fr; /* una columna en móviles */
    gap: 10px;
  }
}
</style>