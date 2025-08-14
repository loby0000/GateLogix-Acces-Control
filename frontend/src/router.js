import { createRouter, createWebHistory } from 'vue-router'


import Login from './components/Login.vue'
import RegistroUsuario from './components/RegistroUsuario.vue'
import RegistroGuardia from './components/registroguardia.vue'

const routes = [
  { path: '/login', component: Login, name: 'login' },
  { path: '/registro', component: RegistroUsuario, name: 'registro' },
  { path: '/registroguardia', component: RegistroGuardia, name: 'registroguardia' },
  { path: '/', redirect: '/login' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
