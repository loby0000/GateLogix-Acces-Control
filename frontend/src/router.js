import { createRouter, createWebHistory } from 'vue-router'

import Login from './components/Login.vue'
import RegistroUsuario from './components/RegistroUsuario.vue'
import RegistroGuardia from './components/registroguardia.vue'
import RegistroUsuariosYaResg from './components/RegistroUsuariosYaResg.vue'
import Dashboard from './components/Dashboard.vue'
import Historial from './components/Historial.vue'
import Notificacion from './components/Notificacion.vue'
import GestionUsuarios from './components/GestionUsuarios.vue'
import LogsAuditoria from './components/LogsAuditoria.vue'
import ControlEquipos from './components/ControlEquipos.vue'

const routes = [
  { path: '/login', component: Login, name: 'login' },
  { path: '/registro', component: RegistroUsuario, name: 'registro' },
  { path: '/registroguardia', component: RegistroGuardia, name: 'registroguardia' },

  // 🔹 Normal sin serial
  { path: '/RegistroUsuariosYaResg', component: RegistroUsuariosYaResg, name: 'RegistroUsuariosYaResg' },

  // 🔹 Dinámica con serial (cuando se escanee el código)
  { path: '/RegistroUsuariosYaResg/:serial', component: RegistroUsuariosYaResg, name: 'RegistroUsuariosYaResgSerial', props: true },

  { path: '/dashboard', component: Dashboard, name: 'dashboard' },
  { path: '/historial', component: Historial, name: 'historial' },
  { path: '/notificacion', component: Notificacion, name: 'notificacion' },
  { path: '/gestion-usuarios', component: GestionUsuarios, name: 'gestionUsuarios' },
  { path: '/logs-auditoria', component: LogsAuditoria, name: 'logsAuditoria' },
  { path: '/control-equipos', component: ControlEquipos, name: 'controlEquipos' },
  { path: '/', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
 