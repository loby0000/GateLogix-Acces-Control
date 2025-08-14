<template>
  <div class="login-page">
    <div class="container">
      <!-- Logo -->
      <div class="logo-section" style="text-align:center; margin-bottom: 24px;">
        <img :src="logo" alt="Logo" style="max-width: 200px; width: 160px; height: auto; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.12); background: #fff; padding: 12px;" />
      </div>

      <!-- Formulario -->
      <div class="form-section">
        <form @submit.prevent="abrirConfirmacion" class="login-form">
          <h2>{{ tipoIngreso === 'guardia' ? 'Registro de Guardia' : 'Reemplazo de Admin' }}</h2>

          <!-- Selección tipo -->
          <label for="tipoIngreso">Tipo de Ingreso</label>
          <select id="tipoIngreso" v-model="tipoIngreso" style="margin-bottom: 12px;">
            <option disabled value="">Selecciona tipo de ingreso</option>
            <option value="guardia">Guardia</option>
            <option value="admin">Admin</option>
          </select>

          <!-- Campos Guardia -->
          <div v-if="tipoIngreso === 'guardia'">
            <label for="turno">Tipo de Jornada</label>
            <select id="turno" v-model="turno" style="margin-bottom: 12px;">
              <option disabled value="">Selecciona jornada</option>
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
              <option value="noche">Noche</option>
            </select>

            <label for="documento">Número de Documento</label>
            <input id="documento" v-model="documento" placeholder="Ingresar Número de Documento" />

            <label for="nombre">Nombre</label>
            <input id="nombre" v-model="nombre" placeholder="Ingrese su nombre" />

            <label for="password">Contraseña</label>
            <input type="password" id="password" v-model="password" placeholder="Contraseña del guardia" />
          </div>

          <!-- Campos Admin -->
          <div v-else-if="tipoIngreso === 'admin'">
            <label for="usuarioAdminNuevo">Usuario</label>
            <input id="usuarioAdminNuevo" v-model="usuarioNuevoAdmin" placeholder="Usuario del nuevo admin" />

            <label for="nombreAdmin">Nombre</label>
            <input id="nombreAdmin" v-model="nombreNuevoAdmin" placeholder="Nombre del nuevo admin" />

            <label for="claveAdminNueva">Contraseña</label>
            <input type="password" id="claveAdminNueva" v-model="claveNuevoAdmin" placeholder="Clave del nuevo admin" />
          </div>

          <!-- Botón -->
          <div style="margin-top: 12px;">
            <button type="submit" class="btn btn-primary">Registrar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Confirmación -->
    <div v-if="mostrarConfirmacion" class="modal-confirm">
      <div class="modal-content-confirm">
        <h3 style="text-align:center; margin-bottom:12px;">
          {{ tipoIngreso === 'guardia' ? 'Confirmar Registro de Guardia' : 'Confirmar Reemplazo de Admin' }}
        </h3>

        <!-- Credenciales admin para confirmar -->
        <label for="confirmUsuarioAdmin">Usuario Admin</label>
        <input id="confirmUsuarioAdmin" v-model="usuarioAdmin" placeholder="Usuario del administrador" class="input-confirm" />

        <label for="confirmClaveAdmin">Clave Admin</label>
        <input type="password" id="confirmClaveAdmin" v-model="claveAdmin" placeholder="Clave del administrador" class="input-confirm" />

        <div style="display:flex; gap:10px; justify-content:center; margin-top:16px;">
          <button type="button" class="btn btn-primary" @click="confirmarRegistro">Confirmar</button>
          <button type="button" class="btn btn-secondary" @click="mostrarConfirmacion = false">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import logo from '../assets/logo.png'

const router = useRouter()

// Campos generales
const tipoIngreso = ref('guardia')
const usuarioAdmin = ref('')
const claveAdmin = ref('')
const mostrarConfirmacion = ref(false)

// Campos Guardia
const turno = ref('')
const documento = ref('')
const nombre = ref('')
const password = ref('')

// Campos Nuevo Admin
const usuarioNuevoAdmin = ref('')
const nombreNuevoAdmin = ref('')
const claveNuevoAdmin = ref('')

// Abrir modal
function abrirConfirmacion() {
  mostrarConfirmacion.value = true
}

// Confirmar y enviar
async function confirmarRegistro() {
  try {
    let url = ''
    let body = {}

    if (tipoIngreso.value === 'guardia') {
      url = 'http://localhost:3000/api/guardia/registrar'
      body = {
        documento: documento.value,
        nombre: nombre.value,
        jornada: turno.value,
        claveGuardia: password.value,
        usuarioAdmin: usuarioAdmin.value,
        claveAdmin: claveAdmin.value
      }
    } else if (tipoIngreso.value === 'admin') {
      url = 'http://localhost:3000/api/admin/reemplazar'
      body = {
        usuario: usuarioNuevoAdmin.value,
        clave: claveNuevoAdmin.value,
        nombre: nombreNuevoAdmin.value,
        usuarioAdmin: usuarioAdmin.value,
        claveAdmin: claveAdmin.value
      }
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    const data = await res.json()

    if (res.ok) {
      alert('✅ Operación realizada con éxito')
      limpiarCampos()
      router.push({ name: 'login' })
    } else {
      alert(data.message || '❌ Error en la operación')
    }
  } catch (err) {
    alert('⚠️ Error de conexión con el servidor')
  }
}

// Limpiar todos los campos
function limpiarCampos() {
  turno.value = ''
  documento.value = ''
  nombre.value = ''
  password.value = ''
  usuarioNuevoAdmin.value = ''
  nombreNuevoAdmin.value = ''
  claveNuevoAdmin.value = ''
  usuarioAdmin.value = ''
  claveAdmin.value = ''
  mostrarConfirmacion.value = false
}
</script>


<style scoped>
/* Modal confirmación registro */
.modal-confirm {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content-confirm {
  background: #fff;
  border-radius: 16px;
  padding: 2rem 2.5rem 1.5rem 2.5rem;
  box-shadow: 0 6px 18px rgba(30,41,59,0.13);
  min-width: 320px;
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.input-confirm {
  width: 100%;
  padding: 9px 10px;
  margin-bottom: 10px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  color: #111827;
  background: #f8fafc;
  box-sizing: border-box;
  transition: border-color .12s ease, box-shadow .12s ease;
}
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
.container {
  display: flex;
  flex: 1 1 100%;
  height: 100%;
  width: 100%;
}
.logo-section {
  flex: 1 1 50%;
  min-width: 420px;
  background: #1e293b;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2.2rem;
  padding: 30px;
}
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
.login-form {
  width: 100%;
  max-width: 480px;
}
h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #111827;
}
label {
  font-weight: 700;
  margin-top: 10px;
  display: block;
  color: #374151;
  font-size: 13px;
}
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
.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}
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
.btn-secondary {
  background: transparent;
  color: #000000; /* Texto negro */
  border: 2px solid #000000;
  background-image: linear-gradient(180deg, rgba(30,41,59,0.03), transparent);
  box-shadow: 0 6px 18px rgba(16,24,40,0.06);
}
.btn-secondary:hover {
  background: #ffffff;
  transform: translateY(-2px);
}
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
