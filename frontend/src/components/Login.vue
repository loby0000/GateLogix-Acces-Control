<template>
  <div class="login-page">
    <div class="container">
      <!-- Logo -->
      <div class="logo-section" style="text-align:center; margin-bottom: 24px;">
        <img :src="logo" alt="Logo" style="max-width: 200px; width: 160px; height: auto; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.12); background: #fff; padding: 12px;" />
      </div>

      <!-- Formulario -->
      <div class="form-section">
        <form @submit.prevent="onSubmit" class="login-form">
          <h2>Iniciar Sesión</h2>

          <select v-model="tipoIngreso" style="margin-bottom: 12px;">
            <option disabled value="">Tipo de usuario</option>
            <option value="admin">Administrador</option>
            <option value="guardia">Guardia</option>
          </select>

          <!-- Campos guardia -->
          <div v-if="tipoIngreso === 'guardia'">
            <input type="text" placeholder="Número de documento" v-model.trim="documento" required autocomplete="off" style="margin-bottom: 12px;" />
            <input type="password" placeholder="Contraseña" v-model.trim="password" required autocomplete="current-password" style="margin-bottom: 12px;" />
            <select v-model="turno" style="margin-bottom: 12px;">
              <option disabled value="">Jornada</option>
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
              <option value="noche">Noche</option>
            </select>
          </div>

          <!-- Campos admin -->
          <div v-else-if="tipoIngreso === 'admin'">
            <input type="text" placeholder="Usuario" v-model.trim="usuarioAdmin" required style="margin-bottom: 12px;" />
            <input type="password" placeholder="Contraseña" v-model.trim="claveAdmin" required style="margin-bottom: 12px;" />
          </div>

          <!-- Botones -->
          <div class="actions" role="group">
            <button type="submit" class="btn btn-primary" :disabled="loading">
              {{ loading ? 'Procesando…' : 'Ingresar' }}
            </button>
            <button type="button" class="btn btn-secondary" @click="goToRegister">
              Regístrate
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import logo from '../assets/logo.png'

const router = useRouter()
const tipoIngreso = ref('')
const documento = ref('')
const password = ref('')
const turno = ref('')
const usuarioAdmin = ref('')
const claveAdmin = ref('')
const loading = ref(false)

async function onSubmit() {
  if (!tipoIngreso.value) return alert('Por favor, selecciona el tipo de usuario')

  loading.value = true
  try {
    let url = ''
    let body = {}

    if (tipoIngreso.value === 'guardia') {
      if (!documento.value || !password.value || !turno.value) {
        loading.value = false
        return alert('Por favor, completa todos los campos del guardia')
      }

      url = 'http://localhost:3000/api/guardia/login'
      body = {
        documento: documento.value,
        clave: password.value,
        jornada: turno.value
      }

    } else if (tipoIngreso.value === 'admin') {
      if (!usuarioAdmin.value || !claveAdmin.value) {
        loading.value = false
        return alert('Por favor, completa todos los campos del admin')
      }

      url = 'http://localhost:3000/api/admin/login'
      body = {
        usuario: usuarioAdmin.value,
        clave: claveAdmin.value
      }
    }

    // fetch en lugar de axios
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await res.json()

    if (res.ok && data.token) {
      localStorage.setItem('token', data.token)

      if (tipoIngreso.value === 'admin') {
        router.push({ path: '/dashboard', name: 'dashboard' })
      } else {
        router.push({ name: 'registro' })
      }
    } else {
      localStorage.removeItem('token')
      alert(data.message || 'Credenciales incorrectas')
    }

  } catch (err) {
    localStorage.removeItem('token')
    alert('Error de conexión con el servidor')
  } finally {
    loading.value = false
  }
}

function goToRegister() {
  router.push({ name: 'registroguardia' })
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
  transition: all 0.3s ease;
}

/* Logo (columna izquierda) */
.logo-section {
  flex: 1  50%;
  min-width: 420px;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.2rem;
  padding: 30px;
  text-align: center;
  transition: all 0.3s ease;
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
  transition: all 0.3s ease;
}

/* Form con ancho comedido para que no pegue a los bordes */
.login-form {
  width: 100%;
  max-width: 480px; 
  transition: all 0.3s ease;
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
  padding: 9px 10px;  
  margin-top: 6px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;     
  color: #111827;
  background: #ffffff;
  box-sizing: border-box;
  transition: border-color .12s ease, box-shadow .12s ease;
}

select:focus,
input:focus {
  outline: none;
  border-color: #60a5fa; 
  box-shadow: 0 4px 14px rgba(96,165,250,0.12);
}

/* Contenedor de botones */
.actions {
  display: flex;
  flex-direction: column;
  align-items: center;   
  gap: 10px;
  margin-top: 18px;
}

/* Botones: primary y secondary */
.btn {
  width: 260px; 
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
  background: #000000;       
  border: 2px solid #e6eefb;
  color: #ffffff;           
  box-shadow: 0 6px 18px rgba(30,41,59,0.12);
  transition: all 0.3s ease; 
}

.btn-primary:hover {
  background: #ffffff;       
  color: #000000;           
  transform: translateY(-2px);
}

/* Secondary (Regístrate) */
.btn-secondary {
  background: transparent;
  color: #1e293b;
  border: 2px solid #000000; 
  background-image: linear-gradient(180deg, rgba(30,41,59,0.03), transparent);
  box-shadow: 0 6px 18px rgba(16,24,40,0.06);
}
.btn-secondary:hover {
  background: #000000;
  color: #ffffff;
  transform: translateY(-2px);
}

/* Responsive: tablets y móviles */
@media (max-width: 1024px) {
  .logo-section {
    font-size: 2rem;
  }
  .form-section {
    padding: 30px;
  }
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
  .logo-section, .form-section {
    width: 100%;
    min-width: 0;
  }
  .logo-section { padding: 25px; font-size: 1.8rem; }
  .login-form { max-width: 100%; padding: 0 16px; }
  .btn { width: 100%; }
}

@media (max-width: 480px) {
  h2 { font-size: 1.4rem; margin-bottom: 16px; }
  label { font-size: 12px; }
  select, input { font-size: 13px; padding: 8px 10px; }
  .btn { font-size: 14px; padding: 9px 14px; }
  .logo-section { font-size: 1.6rem; padding: 20px; }
  .form-section { padding: 20px; }
}
</style>
