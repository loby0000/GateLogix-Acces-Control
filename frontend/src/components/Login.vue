<template>
  <div class="login-page">
    <div class="container">
      <!-- Sección Logo -->
      <div class="logo-section" style="text-align:center; margin-bottom: 24px;">
        <img :src="logo" alt="Logo" style="max-width: 200px; width: 160px; height: auto; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.12); background: #fff; padding: 12px;" />
      </div>

      <!-- Sección Formulario -->
      <div class="form-section">
        <form id="loginForm" @submit.prevent="onSubmit" class="login-form">
          <h2>Iniciar Sesión</h2>

          <select id="tipoIngreso" name="tipoIngreso" v-model="tipoIngreso" style="margin-bottom: 12px;">
            <option disabled value="">Tipo de usuario</option>
            <option value="admin">Administrador</option>
            <option value="guardia">Guardia</option>
          </select>

          <input
            type="text"
            id="documento"
            name="documento"
            placeholder="Número de documento"
            v-model="documento"
            required
            autocomplete="off"
            style="margin-bottom: 12px;"
          />

          <input
            type="password"
            id="password"
            name="password"
            placeholder="Contraseña"
            v-model="password"
            required
            autocomplete="current-password"
            style="margin-bottom: 12px;"
          />

          <div v-if="tipoIngreso === 'guardia'">
            <select id="turno" name="turno" v-model="turno" style="margin-bottom: 12px;">
              <option disabled value="">Jornada</option>
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
              <option value="noche">Noche</option>
            </select>
          </div>

          <!-- botones: Iniciar Sesión y Regístrate (debajo, centrado) -->
          <div class="actions" role="group" aria-label="Acciones de sesión">
            <button type="submit" class="btn btn-primary" aria-label="Iniciar sesión">
              Iniciar Sesión
            </button>

            <button
              type="button"
              class="btn btn-secondary"
              @click="goToRegister"
              aria-label="Registrarse"
            >
              Regístrate
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps } from 'vue'
import logo from '../assets/logo.png'

const props = defineProps({
  onLoginSuccess: Function
})

const tipoIngreso = ref('')
const documento = ref('')
const password = ref('')
const turno = ref('')

function onSubmit() {
  // Aquí deberías validar contra la base de datos real
  if (props.onLoginSuccess && (tipoIngreso.value === 'guardia' || tipoIngreso.value === 'admin')) {
    props.onLoginSuccess(tipoIngreso.value)
  } else {
    alert('Tipo de usuario no válido o falta callback')
  }
}

function goToRegister() {
  alert('Aquí abrirías el formulario de registro (configura la ruta /registro)')
}
</script>

<style scoped>
/* Contenedor ocupa todo el viewport */
.login-page {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  font-family: Arial, sans-serif;
  background-color: #f4f6f8;
  display: flex;
  align-items: stretch;
  justify-content: center;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* Dos columnas: logo | formulario */
.container {
  display: flex;
  flex: 1 1 100%;
  height: 100%;
  width: 100%;
}

/* Logo (columna izquierda) */
.logo-section {
  flex: 1 1 50%;
  min-width: 320px;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.2rem;
  padding: 20px;
}

/* Form (columna derecha) */
.form-section {
  flex: 1 1 50%;
  min-width: 360px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: #ffffff;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.06);
}

/* Form con ancho comedido para que no pegue a los bordes */
.login-form {
  width: 100%;
  max-width: 480px; /* un poco más corto que antes */
}

/* Tipografía / espaciado */
h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #111827;
}

/* Labels */
label {
  font-weight: 700;
  margin-top: 10px;
  display: block;
  color: #374151;
  font-size: 13px;
}

/* Inputs / selects reducidos */
select,
input {
  width: 100%;
  padding: 9px 10px;   /* reducido */
  margin-top: 6px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;     /* reducido */
  color: #111827;
  background: #ffffff;
  box-sizing: border-box;
  transition: border-color .12s ease, box-shadow .12s ease;
}

select:focus,
input:focus {
  outline: none;
  border-color: #60a5fa; /* azul suave */
  box-shadow: 0 4px 14px rgba(96,165,250,0.12);
}

/* Contenedor de botones */
.actions {
  display: flex;
  flex-direction: column;
  align-items: center;   /* centra los botones */
  gap: 10px;
  margin-top: 18px;
}

/* Botones: primary y secondary */
.btn {
  width: 260px; /* ancho fijo para que queden centrados y parejos */
  max-width: 100%;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  border: none;
  transition: transform .06s ease, box-shadow .12s ease, opacity .12s ease;
}

/* Primary */
.btn-primary {
  background: linear-gradient(90deg, #1e293b, #334155);
  color: #fff;
  box-shadow: 0 6px 18px rgba(30,41,59,0.12);
}
.btn-primary:hover { transform: translateY(-2px); }

/* Secondary (Regístrate) */
.btn-secondary {
  background: transparent;
  color: #1e293b;
  border: 2px solid #e6eefb; /* sutil borde claro */
  background-image: linear-gradient(180deg, rgba(30,41,59,0.03), transparent);
  box-shadow: 0 6px 18px rgba(16,24,40,0.06);
}
.btn-secondary:hover {
  background: #f3f6fb;
  transform: translateY(-2px);
}

/* En pantallas pequeñas vuelven full-width */
@media (max-width: 700px) {
  .login-page {
    position: static;
    height: auto;
    min-height: 100vh;
  }
  .container {
    flex-direction: column;
  }
  .logo-section, .form-section {
    width: 100%;
    min-width: 0;
  }
  .logo-section { padding: 30px; font-size: 1.8rem; }
  .login-form { max-width: 100%; padding: 0 16px; }
  .btn { width: 100%; }
}
</style>
