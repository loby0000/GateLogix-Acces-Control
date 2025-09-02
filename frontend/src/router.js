import { createRouter, createWebHistory } from 'vue-router'


import Login from './components/Login.vue'
import RegistroUsuario from './components/RegistroUsuario.vue'
import RegistroGuardia from './components/registroguardia.vue'
import RegistroUsuariosConEquipo from './components/RegistroUsuariosConEquipo.vue'
import Dashboard from './components/Dashboard.vue'
import Historial from './components/Historial.vue'

const routes = [
  { path: '/login', component: Login, name: 'login' },
  { path: '/registro', component: RegistroUsuario, name: 'registro' },
  { path: '/registroguardia', component: RegistroGuardia, name: 'registroguardia' },
  { path: '/registro-usuarios-equipo', component: RegistroUsuariosConEquipo, name: 'registroUsuariosConEquipo' },
  { path: '/dashboard', component: Dashboard, name: 'dashboard' },
  { path: '/historial', component: Historial, name: 'historial' },
  { path: '/', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
