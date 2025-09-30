<template>
  <div class="login-page">
    <!-- SVG Filter para eliminar líneas blancas -->
    <svg width="0" height="0" style="position: absolute;">
      <defs>
        <filter id="remove-white-lines" x="0%" y="0%" width="100%" height="100%">
          <feColorMatrix type="matrix" values="
            1.5 0 0 0 -0.25
            0 1.5 0 0 -0.25
            0 0 1.5 0 -0.25
            0 0 0 1 0
          "/>
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.03 0.08 0.12 0.18 0.22 0.28 0.35 0.45 0.65 0.85 1"/>
            <feFuncG type="discrete" tableValues="0 0.03 0.08 0.12 0.18 0.22 0.28 0.35 0.45 0.65 0.85 1"/>
            <feFuncB type="discrete" tableValues="0 0.03 0.08 0.12 0.18 0.22 0.28 0.35 0.45 0.65 0.85 1"/>
            <feFuncA type="discrete" tableValues="0 0.08 0.15 0.25 0.35 0.45 0.55 0.65 0.75 0.85 0.95 1"/>
          </feComponentTransfer>
          <feConvolveMatrix order="3" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0" preserveAlpha="true"/>
          <feGaussianBlur stdDeviation="0.15"/>
          <feColorMatrix type="saturate" values="1.6"/>
          <feColorMatrix type="matrix" values="
            1.1 0 0 0 0
            0 1.1 0 0 0
            0 0 1.1 0 0
            -1.2 -1.2 -1.2 2.2 0
          "/>
        </filter>
      </defs>
    </svg>


    <div class="container">
      <!-- Logo Section -->
      <div class="logo-brand-container">
        <div class="logo-wrapper">
          <div class="logo-glow"></div>
          <img src="/src/assets/logo1-.png" alt="GateLogix" class="logo-image" />
        </div>
        <div class="brand-text">
          <h1 class="brand-title" data-v-ad129deb="">GateLogix</h1>
          <p class="brand-subtitle" data-v-ad129deb="">Sistema de Registro Avanzado</p>
        </div>
        <div class="decorative-line" data-v-ad129deb=""></div>
      </div>

      <!-- Formulario -->
      <div class="form-section">
        <form @submit.prevent="onSubmit" class="login-form">
          <h2>Iniciar Sesión</h2>

          <!-- Selección tipo -->
          <label for="tipoIngreso">Tipo de Usuario</label>
          <select id="tipoIngreso" v-model="tipoIngreso" style="margin-bottom: 12px;">
            <option disabled value="">Selecciona tipo de usuario</option>
            <option value="admin">Admin</option>
            <option value="guardia">Guardia</option>
          </select>

          <label for="documento">Documento de Identidad</label>
          <input id="documento" v-model="documento" placeholder="Ingresa tu número de documento" />

          <label for="password">Contraseña</label>
          <input type="password" id="password" v-model="password" placeholder="Ingresa tu contraseña" />

          <div v-if="tipoIngreso === 'guardia'">
            <label for="turno">Jornada de Trabajo</label>
            <select id="turno" v-model="turno" style="margin-bottom: 12px;">
              <option disabled value="">Selecciona jornada</option>
              <option value="mañana">Mañana</option>
              <option value="tarde">Tarde</option>
                  <option value="noche">Noche</option>
             </select>
           </div>

           <!-- Botones -->
           <div style="margin-top: 12px; display:flex; flex-direction:column; gap:10px; align-items:center;">
             <button type="submit" class="btn btn-primary">Iniciar Sesión</button>

             <button 
               type="button" 
               class="btn btn-login"
               @click="goToRegister"
             >
               Crear Cuenta Nueva
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
// import logo from '../assets/logo.png' // Comentado para usar ruta directa

const router = useRouter()

const tipoIngreso = ref('')
const documento = ref('')
const password = ref('')
const turno = ref('')
const loading = ref(false)

import { getApiUrl } from '../utils/apiConfig';

async function onSubmit() {
  if (!tipoIngreso.value) return alert('Por favor, selecciona el tipo de usuario')
  if (!documento.value) return alert('Por favor, ingresa tu usuario o documento')
  if (!password.value) return alert('Por favor, ingresa tu contraseña')
  if (tipoIngreso.value === 'guardia' && !turno.value) return alert('Por favor, selecciona la jornada')

  loading.value = true
  try {
    if (tipoIngreso.value === 'guardia') {
      
      const res = await fetch(getApiUrl('api/guardia/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documento: documento.value,
          clave: password.value,
          jornada: turno.value
        })
      })
      const data = await res.json()
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token)
        router.push({ name: 'registro' })
      } else {
        alert(data.message || 'Credenciales incorrectas')
      }

    } else if (tipoIngreso.value === 'admin') {
      const res = await fetch(getApiUrl('api/admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: documento.value,
          clave: password.value
        })
      })
      const data = await res.json()
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token)
        router.push({ name: 'dashboard' })
      } else {
        alert(data.message || 'Usuario o contraseña de admin incorrectos')
      }
    }

  } catch (e) {
    alert('Error de conexión con el servidor')
  } finally {
    loading.value = false
  }
}

// Función para redirigir a la página de registro de guardia
function goToRegister() {
  router.push({ name: 'registroguardia' })
}
</script>

<style scoped>
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

/* Contenedor principal */
.login-page {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  padding-right: clamp(40px, 8vw, 120px);
  margin: 0;
  padding: 0;
  overflow: hidden;
}



/* Contenedor principal */
.container {
  display: flex;
  flex: 1 1 100%;
  height: 100%;
  width: 100%;
  position: relative;
  z-index: 2;
  box-sizing: border-box;
}

/* Sección del logo */
.logo-brand-container {
  position: absolute;
  top: 50%;
  left: 18%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 3;
  width: auto;
  max-width: 400px;
  height: auto;
  padding: clamp(4px, 1vw, 8px);
  padding-right: clamp(20px, 4vw, 40px);
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
  max-width: 90vw;
  max-height: 90vw;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: -moz-crisp-edges;
  image-rendering: -o-crisp-edges;
  image-rendering: crisp-edges;
  image-rendering: pixelated;
  image-rendering: high-quality;
  image-rendering: optimizeQuality;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-stroke: 0.01em transparent;
  filter: contrast(1.18) brightness(1.1) saturate(1.12) hue-rotate(0deg) blur(0px) sepia(0%) invert(0%) opacity(100%) drop-shadow(0 0 1px rgba(0,0,0,0.1));
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-perspective: 1000px;
  perspective: 1000px;
  object-fit: contain;
  will-change: transform, filter;
  transform: translateZ(0) scale3d(1, 1, 1);
  -webkit-transform: translateZ(0) scale3d(1, 1, 1);
}

.logo-image:hover {
  transform: scale(1.15) translateZ(0);
  filter: contrast(1.2) brightness(1.12) saturate(1.15) sharpen(0.8) drop-shadow(0 0 20px rgba(255, 255, 255, 0.3));
}

.logo-image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: -moz-crisp-edges;
  image-rendering: -o-crisp-edges;
  image-rendering: crisp-edges;
  image-rendering: auto;
  image-rendering: high-quality;
  image-rendering: optimizeQuality;
  image-rendering: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-stroke: 0.005em transparent;
  filter: contrast(1.6) brightness(0.9) saturate(1.5) hue-rotate(0deg) blur(0px) sepia(6%) invert(0%) opacity(100%) drop-shadow(0 0 3px rgba(0,0,0,0.25)) url(#remove-white-lines);
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  transform: translateZ(0) scale3d(1, 1, 1) perspective(1000px);
  -webkit-transform: translateZ(0) scale3d(1, 1, 1) perspective(1000px);
  will-change: filter, transform;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  -webkit-perspective: 1000px;
  perspective: 1000px;
  mix-blend-mode: multiply;
  background: transparent;
  -webkit-mask-composite: subtract;
  mask-composite: subtract;
  -webkit-interpolation-mode: bicubic;
  -ms-interpolation-mode: bicubic;
  transform-style: preserve-3d;
  -webkit-transform-style: preserve-3d;
}

.logo-image:hover img {
  filter: contrast(1.7) brightness(0.95) saturate(1.6) hue-rotate(0deg) blur(0px) sepia(4%) invert(0%) opacity(100%) drop-shadow(0 0 12px rgba(255,255,255,0.3)) url(#remove-white-lines);
  transform: translateZ(0) scale3d(1.03, 1.03, 1) perspective(1000px);
  mix-blend-mode: multiply;
}

.brand-text {
  margin-bottom: 25px;
}

.brand-title {
  font-size: clamp(1.4rem, 4vw, 4.2rem);
  font-weight: 800;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 clamp(8px, 1.5vw, 12px) 0;
  letter-spacing: clamp(-1px, -0.1vw, -2px);
  line-height: 1.2;
}

.brand-subtitle {
  font-size: clamp(0.9rem, 2.2vw, 1.4rem);
  color: var(--text-secondary);
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
  background: var(--primary-gradient);
  margin: 0 auto;
  border-radius: 2px;
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Sección del formulario */
.form-section {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: clamp(4px, 1vw, 8px);
  padding-right: clamp(80px, 10vw, 100px);
  background: transparent;
  box-sizing: border-box;
}

/* Formulario */
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
}

.btn-login {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
}

.btn-login:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}



/* Fluid Responsive Design */
/* Container Queries Support */
@container (max-width: 600px) {
  .form-container {
    padding: clamp(20px, 4vw, 30px);
    border-radius: clamp(12px, 2vw, 16px);
  }
}

/* Automatic Viewport Adaptation */
.container {
  container-type: inline-size;
}

/* Ultra-wide screens */
@media (min-width: 1920px) {
  .container {
    max-width: 2560px;
    margin: 0 auto;
    padding: 40px;
  }
  
  .logo-brand-container {
    left: 15%;
  }
  
  .logo-image {
    width: clamp(400px, 18vw, 500px);
    height: clamp(400px, 18vw, 500px);
  }
  
  .brand-title {
    font-size: clamp(4rem, 6vw, 5rem);
  }
  
  .brand-subtitle {
    font-size: clamp(1.3rem, 2vw, 1.6rem);
  }
  
  .login-form {
    width: clamp(450px, 30vw, 650px);
    padding: clamp(50px, 4vw, 60px);
  }
  
  .form-title {
    font-size: clamp(2.5rem, 3vw, 3rem);
  }
  
  .form-input,
  .form-select {
    padding: 18px 50px 18px 20px;
    font-size: 1.1rem;
    min-height: 56px;
  }
  
  .btn {
    padding: 18px 28px;
    font-size: 1.1rem;
    min-height: 56px;
  }
}

/* Large Desktop */
@media (max-width: 1400px) {
  .logo-image {
    width: clamp(300px, 25vw, 350px);
    height: clamp(300px, 25vw, 350px);
  }
  
  .form-container {
    width: clamp(350px, 45vw, 500px);
    padding: clamp(35px, 4vw, 45px);
  }
}

/* Laptops pequeños (768px - 1024px) */
@media (max-width: 1024px) and (min-width: 769px) {
  .container {
    padding: 30px;
    gap: 40px;
  }
  
  .logo-brand-container {
    left: 12%;
  }
  
  .logo-image {
    width: clamp(140px, 22vw, 170px);
    height: clamp(140px, 22vw, 170px);
  }
  
  .brand-title {
    font-size: clamp(2.2rem, 4.5vw, 2.8rem);
  }
  
  .brand-subtitle {
    font-size: clamp(1rem, 2.2vw, 1.3rem);
  }
  
  .login-form {
    width: clamp(380px, 40vw, 450px);
    padding: clamp(35px, 4vw, 45px);
  }
  
  h2 {
    font-size: clamp(1.8rem, 3.5vw, 2.2rem);
  }
  
  select,
  input {
    padding: 14px 35px 14px 14px;
    font-size: 1rem;
    min-height: 48px;
  }
  
  .btn {
    padding: 16px 22px;
    font-size: 1rem;
    min-height: 50px;
  }
}

/* Desktop */
@media (max-width: 1200px) {
  .container {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }
  
  .logo-brand-container {
    position: static;
    transform: none;
    margin-bottom: 40px;
    max-width: 100%;
    padding: 0;
  }
  
  .form-section {
    flex: none;
    min-width: 0;
    width: 100%;
    justify-content: center;
    padding: 0;
  }
  
  .logo-image {
    width: clamp(250px, 30vw, 300px);
    height: clamp(250px, 30vw, 300px);
  }
  
  .brand-title {
    font-size: clamp(2.5rem, 5vw, 3rem);
  }
  
  .brand-subtitle {
    font-size: clamp(1rem, 2.5vw, 1.1rem);
  }
  
  .login-form {
    width: clamp(400px, 80vw, 600px);
    min-width: 400px;
    max-width: 600px;
  }
}

/* Tablets (481px - 768px) */
@media (max-width: 768px) and (min-width: 481px) {
  .container {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 25px;
    gap: 35px;
  }
  
  .logo-brand-container {
    position: static;
    width: 100%;
    max-width: none;
    height: auto;
    padding: 0;
    margin-bottom: 25px;
    text-align: center;
  }
  
  .logo-image {
    width: clamp(120px, 20vw, 160px);
    height: clamp(120px, 20vw, 160px);
    margin: 0 auto 25px;
  }
  
  .brand-title {
    font-size: clamp(2rem, 4.5vw, 2.5rem);
    margin-bottom: 10px;
  }
  
  .brand-subtitle {
    font-size: clamp(0.9rem, 2.5vw, 1.1rem);
  }
  
  .login-form {
    position: static;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    padding: 30px;
  }
  
  h2 {
    font-size: clamp(1.5rem, 3.5vw, 1.8rem);
  }
  
  select,
  input {
    padding: 12px 30px 12px 12px;
    font-size: 0.95rem;
    min-height: 46px;
  }
  
  .btn {
    padding: 14px 18px;
    font-size: 0.95rem;
    min-height: 48px;
  }
}

/* Tablet */
@media (max-width: 992px) {
  .container {
    padding: 15px;
  }
  
  .logo-brand-container {
    margin-bottom: 30px;
  }
  
  .logo-image {
    width: clamp(200px, 25vw, 250px);
    height: clamp(200px, 25vw, 250px);
  }
  
  .brand-title {
    font-size: clamp(2rem, 4vw, 2.5rem);
  }
  
  .brand-subtitle {
    font-size: clamp(0.9rem, 2vw, 1rem);
  }
  
  .login-form {
    width: clamp(350px, 85vw, 500px);
    min-width: 350px;
    max-width: 500px;
    padding: clamp(30px, 5vw, 40px) clamp(25px, 4vw, 35px);
  }
  
  h2 {
    font-size: clamp(1.8rem, 3.5vw, 2.2rem);
  }
  
  select,
  input {
    padding: 14px 45px 14px 18px;
    font-size: 0.95rem;
    min-height: 48px;
  }
  
  .btn {
    padding: 16px 22px;
    font-size: 1rem;
    min-height: 50px;
  }
}

/* Mobile Large */
@media (max-width: 768px) {
  .login-page {
    position: static;
    min-height: 100vh;
    padding: 0;
  }
  
  .container {
    padding: 10px;
    min-height: 100vh;
    justify-content: flex-start;
    padding-top: 20px;
  }
  
  .logo-brand-container {
    margin-bottom: 25px;
  }
  
  .logo-image {
    width: clamp(150px, 20vw, 200px);
    height: clamp(150px, 20vw, 200px);
  }
  
  .brand-title {
    font-size: clamp(1.6rem, 4vw, 2rem);
    letter-spacing: -0.5px;
  }
  
  .brand-subtitle {
    font-size: clamp(0.85rem, 2vw, 1rem);
  }
  
  .form-section {
    padding: 0;
    width: 100%;
  }
  
  .login-form {
    width: clamp(300px, 90vw, 400px);
    max-width: none;
    min-width: 300px;
    padding: clamp(25px, 5vw, 30px) clamp(20px, 4vw, 25px);
    margin: 0 auto;
  }
  
  h2 {
    font-size: clamp(1.5rem, 3vw, 1.8rem);
  }
  
  label {
    font-size: clamp(0.8rem, 2vw, 0.85rem);
  }
  
  select,
  input {
    padding: 14px 40px 14px 16px;
    font-size: clamp(0.85rem, 2vw, 0.9rem);
    min-height: 46px;
  }
  
  .btn {
    padding: 15px 20px;
    font-size: clamp(0.9rem, 2vw, 0.95rem);
    min-height: 48px;
  }
}

/* Mobile (≤480px) */
@media (max-width: 480px) {
  .container {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 15px;
    gap: 25px;
    min-height: 100vh;
    min-height: 100dvh;
  }
  
  .logo-brand-container {
    position: static;
    width: 100%;
    max-width: none;
    height: auto;
    padding: 0;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .logo-image {
    width: clamp(90px, 18vw, 130px);
    height: clamp(90px, 18vw, 130px);
    margin: 0 auto 20px;
  }
  
  .brand-title {
    font-size: clamp(1.6rem, 4vw, 2rem);
    margin-bottom: 8px;
  }
  
  .brand-subtitle {
    font-size: clamp(0.8rem, 2.2vw, 0.95rem);
  }
  
  .login-form {
    position: static;
    width: 100%;
    max-width: 320px;
    margin: 0 auto;
    padding: 20px;
    border-radius: 16px;
  }
  
  h2 {
    font-size: clamp(1.3rem, 3.2vw, 1.6rem);
    margin-bottom: 18px;
  }
  
  select,
  input {
    padding: 10px 25px 10px 10px;
    font-size: 0.9rem;
    min-height: 44px;
  }
  
  .btn {
    padding: 12px 16px;
    font-size: 0.9rem;
    min-height: 46px;
  }
}

/* Mobile Medium */
@media (max-width: 480px) {
  .container {
    padding: 8px;
    padding-top: 15px;
  }
  
  .logo-brand-container {
    margin-bottom: 20px;
  }
  
  .logo-image {
    width: clamp(120px, 18vw, 160px);
    height: clamp(120px, 18vw, 160px);
  }
  
  .brand-title {
    font-size: clamp(1.4rem, 3.5vw, 1.6rem);
  }
  
  .brand-subtitle {
    font-size: clamp(0.8rem, 2vw, 0.9rem);
  }
  
  .login-form {
    width: clamp(280px, 95vw, 350px);
    padding: clamp(20px, 4vw, 25px) clamp(15px, 3vw, 20px);
  }
  
  h2 {
    font-size: clamp(1.3rem, 3vw, 1.5rem);
  }
  
  select,
  input {
    padding: 12px 35px 12px 14px;
    font-size: clamp(0.8rem, 2vw, 0.85rem);
    min-height: 44px;
  }
  
  .btn {
    padding: 14px 18px;
    font-size: clamp(0.85rem, 2vw, 0.9rem);
    min-height: 46px;
  }
  
  .actions {
    margin-top: 20px;
  }
}

/* Mobile Small */
@media (max-width: 360px) {

  
  .logo-image {
    width: clamp(120px, 30vw, 140px);
    height: clamp(120px, 30vw, 140px);
  }
  
  .brand-title {
    font-size: clamp(1.2rem, 4vw, 1.4rem);
  }
  
  .form-container {
    width: clamp(280px, 98vw, 320px);
    padding: clamp(15px, 4vw, 20px);
  }
  
  .form-title {
    font-size: clamp(1.1rem, 4vw, 1.3rem);
  }
  
  .form-input,
  .form-select {
    padding: clamp(10px, 2vw, 11px) clamp(25px, 6vw, 30px) clamp(10px, 2vw, 11px) clamp(10px, 2vw, 12px);
    font-size: clamp(0.75rem, 2vw, 0.8rem);
    min-height: clamp(36px, 8vw, 40px);
  }
  
  .btn {
    padding: clamp(10px, 2.5vw, 12px) clamp(14px, 3vw, 16px);
    font-size: clamp(0.8rem, 2vw, 0.85rem);
    min-height: clamp(40px, 8vw, 44px);
  }
}

/* Extra Small Devices */
@media (max-width: 320px) {
  .container {
    min-height: 100svh; /* Use small viewport height */
  }
  

  
  .logo-image {
    width: clamp(100px, 28vw, 120px);
    height: clamp(100px, 28vw, 120px);
  }
  
  .form-container {
    width: clamp(260px, 96vw, 300px);
    padding: clamp(12px, 3vw, 18px);
    margin: clamp(5px, 1vw, 10px);
  }
  
  .input-group {
    margin-bottom: clamp(12px, 3vw, 18px);
  }
}

/* Mobile Landscape */
@media (max-width: 768px) and (orientation: landscape) {
  .container {
    padding: 15px 25px;
    gap: 20px;
  }
  
  .logo-image {
    width: clamp(80px, 12vw, 110px);
    height: clamp(80px, 12vw, 110px);
    margin-bottom: 15px;
  }
  
  .brand-title {
    font-size: clamp(1.4rem, 3vw, 1.8rem);
    margin-bottom: 6px;
  }
  
  .brand-subtitle {
    font-size: clamp(0.75rem, 1.8vw, 0.9rem);
  }
  
  .login-form {
    max-width: 350px;
    padding: 18px;
  }
  
  .form-title {
    font-size: clamp(1.2rem, 2.8vw, 1.4rem);
    margin-bottom: 15px;
  }
  
  .form-input,
  .form-select {
    padding: 8px 20px 8px 8px;
    font-size: 0.85rem;
    min-height: 40px;
  }
  
  .btn {
    padding: 10px 14px;
    font-size: 0.85rem;
    min-height: 42px;
  }
  
  .input-group {
    margin-bottom: 12px;
  }
}

/* Landscape Mobile */
@media (max-height: 600px) and (orientation: landscape) {
  .login-page {
    overflow-y: auto;
    min-height: 100lvh;
  }
  
  .container {
    flex-direction: row;
    min-height: 100lvh;
    padding: clamp(10px, 2vh, 15px);
    align-items: center;
    justify-content: space-between;
  }
  
  .logo-brand-container {
    position: static;
    transform: none;
    flex: 0 0 clamp(35%, 40vw, 45%);
    margin-bottom: 0;
    margin-right: clamp(15px, 3vw, 25px);
    padding: clamp(10px, 2vh, 15px);
  }
  
  .logo-image {
    width: clamp(80px, 12vh, 120px);
    height: clamp(80px, 12vh, 120px);
  }
  
  .brand-title {
    font-size: clamp(1.2rem, 2.5vh, 1.5rem);
  }
  
  .brand-subtitle {
    font-size: clamp(0.7rem, 1.2vh, 0.8rem);
  }
  
  .form-section {
    flex: 1;
    padding: 0;
    justify-content: center;
  }
  
  .login-form {
    width: clamp(280px, 90%, 400px);
    max-width: none;
    padding: clamp(15px, 3vh, 20px) clamp(15px, 3vw, 20px);
  }
  
  .form-title {
    font-size: clamp(1.2rem, 2.5vh, 1.4rem);
  }
  
  .input-group {
    margin-bottom: clamp(8px, 1.5vh, 12px);
  }
  
  .form-input,
  .form-select {
    padding: clamp(8px, 1.2vh, 10px) clamp(30px, 5vw, 35px) clamp(8px, 1.2vh, 10px) clamp(12px, 2vw, 14px);
    min-height: clamp(32px, 5vh, 38px);
    font-size: clamp(0.8rem, 1.5vh, 0.85rem);
  }
  
  .btn {
    padding: clamp(8px, 1.5vh, 12px) clamp(16px, 3vw, 18px);
    min-height: clamp(36px, 5vh, 42px);
    font-size: clamp(0.8rem, 1.5vh, 0.9rem);
  }
}

/* Foldable and Narrow Screens */
@media (max-width: 280px) {
  .container {
    min-height: 100svh;
    padding: 5px;
    padding-top: 10px;
  }
  
  .logo-brand-container {
    margin-bottom: 15px;
  }
  
  .form-section {
    padding: 0;
  }
  
  .logo-image {
    width: clamp(70px, 22vw, 90px);
    height: clamp(70px, 22vw, 90px);
  }
  
  .login-form {
    width: clamp(240px, 94vw, 270px);
    padding: clamp(8px, 2vw, 12px);
  }
  
  .brand-title {
    font-size: clamp(1rem, 3.2vw, 1.1rem);
  }
  
  .brand-subtitle {
    font-size: clamp(0.7rem, 2vw, 0.8rem);
  }
  
  .form-title {
    font-size: clamp(1rem, 3.2vw, 1.1rem);
  }
  
  .form-input,
  .form-select {
    padding: 10px 25px 10px 10px;
    font-size: clamp(0.75rem, 2vw, 0.8rem);
    min-height: 38px;
  }
  
  .btn {
    padding: 12px 14px;
    font-size: clamp(0.75rem, 2vw, 0.8rem);
    min-height: 42px;
  }
  
  .input-group {
    margin-bottom: 12px;
  }
}

/* High DPI Displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .logo-image img {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
  
  .login-form {
    border-width: 0.5px;
  }
}

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  
  .logo-glow {
    animation: none !important;
  }
  
  .decorative-line {
    animation: none !important;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .login-form {
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .form-input,
  .form-select {
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.15);
    color: rgba(255, 255, 255, 0.9);
  }
  
  .form-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  .input-label {
    color: rgba(255, 255, 255, 0.8);
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .form-input,
  .form-select {
    min-height: 48px;
    font-size: max(16px, 1rem);
  }
  
  .btn {
    min-height: 48px;
    padding: 14px 20px;
  }
  
  .logo-image:hover {
    transform: none;
  }
}

/* Print Styles */
@media print {
  .login-page {
    background: white !important;
  }
  
  .container {
    flex-direction: column;
    align-items: center;
  }
  
  .logo-glow,
  .decorative-line {
    display: none;
  }
  
  .login-form {
    background: white;
    border: 2px solid #000;
    box-shadow: none;
  }
}
</style>
