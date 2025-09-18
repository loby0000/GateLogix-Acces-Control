<template>
  <div class="login-page">
    <div class="container">
      <!-- Logo Section -->
      <div class="logo-brand-container">
        <div class="logo-wrapper">
          <div class="logo-glow"></div>
          <img src="/src/assets/logo1-.png" alt="GateLogix" class="logo-image" />
        </div>
        <div class="brand-text">
          <h1 class="brand-title">GateLogix</h1>
          <p class="brand-subtitle">Sistema de Registro Avanzado</p>
        </div>
        <div class="decorative-line"></div>
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

            <label for="documentoAdminNuevo">Documento</label>
            <input id="documentoAdminNuevo" v-model="documentoNuevoAdmin" placeholder="Documento del nuevo admin" />

            <label for="nombreAdmin">Nombre</label>
            <input id="nombreAdmin" v-model="nombreNuevoAdmin" placeholder="Nombre del nuevo admin" />

            <label for="claveAdminNueva">Contraseña</label>
            <input type="password" id="claveAdminNueva" v-model="claveNuevoAdmin" placeholder="Clave del nuevo admin" />
          </div>

          <!-- Botones -->
          <div style="margin-top: 12px; display:flex; flex-direction:column; gap:10px; align-items:center;">
            <button type="submit" class="btn btn-primary">Registrar</button>

            <button 
              type="button" 
              class="btn btn-login"
              @click="router.push({ name: 'login' })"
            >
              Iniciar Sesión
            </button>
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

        <!-- Credenciales de admin existente para validar -->
        <label for="usuarioExistente">Usuario Admin Existente</label>
        <input id="usuarioExistente" v-model="usuarioExistente" placeholder="Usuario del admin existente" class="input-confirm" />

        <label for="claveExistente">Clave Admin Existente</label>
        <input type="password" id="claveExistente" v-model="claveExistente" placeholder="Clave del admin existente" class="input-confirm" />

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
import { getApiUrl } from '../utils/apiConfig'

const router = useRouter()

// Campos generales
const tipoIngreso = ref('guardia')
const mostrarConfirmacion = ref(false)

// Credenciales admin existente (modal)
const usuarioExistente = ref('')
const claveExistente = ref('')

// Campos Guardia
const turno = ref('')
const documento = ref('')
const nombre = ref('')
const password = ref('')

// Campos Nuevo Admin
const usuarioNuevoAdmin = ref('')
const documentoNuevoAdmin = ref('')
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

    let url = getApiUrl('api/guardia/registrar')
      if (tipoIngreso.value === 'guardia') {
      body = {
        documento: documento.value,
        nombre: nombre.value,
        jornada: turno.value,
        clave: password.value,
        usuarioAdmin: usuarioExistente.value,
        claveAdmin: claveExistente.value
      }
    } else if (tipoIngreso.value === 'admin') {
      url = getApiUrl('api/admin/reemplazar')
      body = {
        usuario: usuarioNuevoAdmin.value,
        documento: documentoNuevoAdmin.value,
        nombre: nombreNuevoAdmin.value,
        clave: claveNuevoAdmin.value,
        usuarioExistente: usuarioExistente.value,
        claveExistente: claveExistente.value
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
      // Emitir evento para actualizar la tabla de guardias en GestionGuardia.vue
      const guardiasActualizadosEvent = new CustomEvent('guardias-actualizados')
      document.dispatchEvent(guardiasActualizadosEvent)
      window.dispatchEvent(guardiasActualizadosEvent)
      
      // Emitir evento específico para actualizar solo el contador de registros
      if (tipoIngreso.value === 'guardia') {
        const registrosActualizadosEvent = new CustomEvent('registros-actualizados', {
          detail: {
            guardiaId: data.guardiaId, // ID del guardia registrado
            registros: data.registros || 0 // Contador actualizado
          }
        })
        document.dispatchEvent(registrosActualizadosEvent)
        window.dispatchEvent(registrosActualizadosEvent)
      }
      router.push({ name: 'login' })
    } else {
      alert(data.message || '❌ Error en la operación')
    }
  } catch (err) {
    console.error(err)
    alert('⚠️ Error de conexión con el servidor')
  }
}

// Limpiar campos
function limpiarCampos() {
  turno.value = ''
  documento.value = ''
  nombre.value = ''
  password.value = ''
  usuarioNuevoAdmin.value = ''
  documentoNuevoAdmin.value = ''
  nombreNuevoAdmin.value = ''
  claveNuevoAdmin.value = ''
  usuarioExistente.value = ''
  claveExistente.value = ''
  mostrarConfirmacion.value = false
}
</script>


<style scoped>
/* Modal confirmación registro */
.modal-confirm {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
}

.modal-content-confirm {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: clamp(30px, 5vw, 40px) clamp(25px, 4vw, 35px);
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.3),
    0 8px 16px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  min-width: clamp(320px, 90vw, 450px);
  max-width: 95vw;
  display: flex;
  flex-direction: column;
  gap: clamp(16px, 3vw, 20px);
  animation: slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  overflow: hidden;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-content-confirm::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
}

.modal-content-confirm h3 {
  color: var(--text-primary);
  font-size: clamp(1.3rem, 3vw, 1.6rem);
  font-weight: 700;
  text-align: center;
  margin: 0 0 clamp(16px, 3vw, 20px) 0;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
}

.modal-content-confirm label {
  color: var(--text-secondary);
  font-size: clamp(0.85rem, 2vw, 0.9rem);
  font-weight: 500;
  margin-bottom: 6px;
  display: block;
  letter-spacing: 0.3px;
}

.input-confirm {
  width: 100%;
  padding: clamp(12px, 2.5vw, 16px) clamp(14px, 3vw, 18px);
  margin-bottom: clamp(12px, 2.5vw, 16px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  font-size: clamp(0.9rem, 2vw, 1rem);
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  box-sizing: border-box;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  outline: none;
}

.input-confirm::placeholder {
  color: rgba(255, 255, 255, 0.5);
  font-weight: 400;
}

.input-confirm:focus {
  border-color: rgba(59, 130, 246, 0.6);
  background: rgba(255, 255, 255, 0.12);
  box-shadow: 
    0 0 0 3px rgba(59, 130, 246, 0.1),
    0 4px 12px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.input-confirm:hover:not(:focus) {
  border-color: rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.1);
}

.modal-content-confirm .btn {
  padding: clamp(12px, 2.5vw, 16px) clamp(20px, 4vw, 28px);
  border-radius: 12px;
  font-size: clamp(0.9rem, 2vw, 1rem);
  font-weight: 600;
  letter-spacing: 0.3px;
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content-confirm .btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.6s;
}

.modal-content-confirm .btn:hover::before {
  left: 100%;
}

.modal-content-confirm .btn-primary {
  background: var(--primary-gradient);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.modal-content-confirm .btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
}

.modal-content-confirm .btn-primary:active {
  transform: translateY(0);
}

.modal-content-confirm .btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.modal-content-confirm .btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.3);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.modal-content-confirm .btn-secondary:active {
  transform: translateY(0);
}

/* Variables CSS */
:root {
  --primary-gradient: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  --secondary-gradient: linear-gradient(135deg, #60a5fa 0%, #93c5fd 100%);
  --dark-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --shadow-light: 0 8px 32px rgba(30, 64, 175, 0.3);
  --shadow-dark: 0 8px 32px rgba(30, 64, 175, 0.4);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.8);
  --accent-color: #3b82f6;
}

/* Contenedor ocupa todo el viewport */
.login-page {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  display: flex;
  align-items: stretch;
  justify-content: center;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
.container {
  display: flex;
  width: 100%;
  height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 0;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
}






.logo-brand-container {
  position: absolute;
  top: 50%;
  left: 15%;
  transform: translateY(-50%);
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: auto;
  max-width: 400px;
  padding: clamp(20px, 5vw, 60px);
  box-sizing: border-box;
  text-align: center;
}

.logo-wrapper {
  position: relative;
  display: inline-block;
  margin-bottom: 30px;
}

.logo-glow {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
  border-radius: 50%;
  filter: blur(30px);
  opacity: 0.6;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.logo-image {
  position: relative;
  width: clamp(120px, 20vw, 160px);
  height: clamp(120px, 20vw, 160px);
  border-radius: 0;
  background: transparent;
  padding: 0;
  margin-left: -8px;
  box-shadow: none;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  cursor: pointer;
  filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.3));
  object-fit: contain;
  aspect-ratio: 1 / 1;
}

.logo-image:hover {
  transform: scale(1.05) rotate(2deg);
  filter: drop-shadow(0 15px 35px rgba(0, 0, 0, 0.4));
}

.brand-text {
  margin-bottom: 25px;
}

.brand-title {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  color: #ffffff;
  margin: 0 0 clamp(8px, 1.5vw, 12px) 0;
  letter-spacing: clamp(-1px, -0.1vw, -2px);
  line-height: 1.2;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #ffffff 0%, #e0f7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.brand-subtitle {
  font-size: clamp(0.9rem, 2.2vw, 1.4rem);
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  margin: 0;
  letter-spacing: clamp(0.5px, 0.08vw, 0.8px);
  line-height: 1.3;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  background: linear-gradient(135deg, #ffffff 0%, #e0f7ff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.decorative-line {
  width: 100px;
  height: 4px;
  background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
  margin: 0 auto;
  border-radius: 2px;
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
.form-section {
  position: absolute;
  top: 50%;
  right: 12%;
  transform: translateY(-50%);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background: transparent;
  box-sizing: border-box;
}


.login-form {
  width: clamp(380px, 45vw, 480px);
  min-width: 380px;
  max-width: 480px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(25px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 28px;
  padding: clamp(30px, 5vw, 40px);
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.4), 
              0 16px 32px rgba(0, 0, 0, 0.25),
              0 8px 16px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.15),
              inset 0 -1px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  position: relative;
  z-index: 2;
  overflow: hidden;
  animation: floatIn 0.8s ease-out;
}

.login-form::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.05) 50%, 
    rgba(255, 255, 255, 0.02) 100%);
  border-radius: 24px;
  pointer-events: none;
}

@keyframes floatIn {
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.login-form:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5), 
              0 20px 40px rgba(0, 0, 0, 0.3),
              0 12px 24px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              inset 0 -1px 0 rgba(0, 0, 0, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(30px) saturate(200%);
}
h2 {
  text-align: center;
  margin-bottom: 36px;
  color: #ffffff;
  font-size: clamp(1.75rem, 3.5vw, 2.25rem);
  font-weight: 600;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  letter-spacing: -0.025em;
  line-height: 1.2;
  position: relative;
  z-index: 1;
}

h2::after {
  content: '';
  position: absolute;
  bottom: -12px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  border-radius: 1px;
}

label {
  font-weight: 500;
  margin-top: 15px;
  margin-bottom: 8px;
  display: block;
  color: rgba(255, 255, 255, 0.95);
  font-size: 15px;
  letter-spacing: 0.025em;
  position: relative;
  z-index: 1;
  text-transform: uppercase;
  font-size: 12px;
  opacity: 0.9;
}
select,
input {
  width: 100%;
  padding: 14px 18px;
  margin-bottom: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  font-size: 15px;
  color: #1f2937;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  box-sizing: border-box;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  font-weight: 500;
  position: relative;
  z-index: 1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

select:focus,
input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.12), 
              0 8px 24px rgba(255, 255, 255, 0.2),
              0 4px 12px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px) scale(1.02);
}

select:hover,
input:hover {
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.85);
}
.actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 32px;
  position: relative;
  z-index: 1;
}
.btn {
  width: 100%;
  max-width: 300px;
  padding: 16px 28px;
  border-radius: 16px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  border: none;
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  letter-spacing: 0.025em;
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  font-size: 13px;
  z-index: 1;
}

.btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
  transition: left 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  z-index: -1;
}

.btn:hover::before {
  left: 100%;
}

.btn:active {
  transform: translateY(1px) scale(0.98);
}

.btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(59, 130, 246, 0.35),
              0 4px 12px rgba(59, 130, 246, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 16px 36px rgba(59, 130, 246, 0.45),
              0 8px 16px rgba(59, 130, 246, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.2);
}

.btn-login {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #ffffff;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25),
              0 4px 12px rgba(0, 0, 0, 0.15),
              inset 0 1px 0 rgba(255, 255, 255, 0.15);
}

.btn-login:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.35);
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.35),
              0 8px 16px rgba(0, 0, 0, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}
@media (max-width: 768px) {
  .login-page {
    position: static;
    height: auto;
    min-height: 100vh;
  }
  
  .container {
    flex-direction: column;
    padding: 20px;
  }
  
  .logo-section {
    position: relative;
    top: auto;
    left: auto;
    transform: none;
    width: 100%;
    height: auto;
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .form-section {
    position: relative;
    top: auto;
    right: auto;
    transform: none;
    width: 100%;
    padding: 0 20px;
  }
  
  .login-form {
    width: 100%;
    min-width: 280px;
    max-width: 400px;
    margin: 0 auto;
    padding: 32px 24px;
  }
}
</style>
