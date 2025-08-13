
<template>
  <component :is="currentComponent" :on-login-success="handleLoginSuccess" />
</template>

<script>

import Login from './components/Login.vue'
import RegistroUsuario from './components/RegistroUsuario.vue'

export default {
  name: 'App',
  components: {
    Login,
  RegistroUsuario
  },
  data() {
    return {
      currentComponent: 'Login',
    }
  },
  methods: {
    handleLoginSuccess(tipo) {
      if (tipo === 'guardia') {
        this.currentComponent = 'RegistroUsuario';
      } else {
        // Aquí podrías redirigir a otro componente según el tipo
        alert('Solo el guardia está implementado para redirigir.');
      }
    }
  }
}
</script>

<style>
/* Si quieres, aquí van estilos globales */
body {
  margin: 0;
  font-family: Arial, sans-serif;
}
</style>
