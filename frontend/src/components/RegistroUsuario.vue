<template>
  <div class="registro-container">
    <h2>Registrar Usuario y Equipo</h2>

    <form @submit.prevent="registrar">
      <!-- Tipo de usuario -->
      <label>Tipo de Usuario:</label>
      <select v-model="form.tipoUsuario" required>
        <option value="">Seleccione...</option>
        <option value="empleado">Empleado</option>
        <option value="visitante">Visitante</option>
      </select>

      <!-- Tipo de documento -->
      <label>Tipo de Documento:</label>
      <select v-model="form.tipoDocumento" required>
        <option value="">Seleccione...</option>
        <option value="DNI">DNI</option>
        <option value="pasaporte">Pasaporte</option>
      </select>

      <!-- Número de documento -->
      <label>Número de Documento:</label>
      <input type="text" v-model="form.numeroDocumento" required />

      <!-- Email -->
      <label>Email:</label>
      <input type="email" v-model="form.email" required />

      <!-- Serial del equipo -->
      <label>Serial del Equipo:</label>
      <input type="text" v-model="form.serialEquipo" required />

      <!-- Marca del equipo -->
      <label>Marca del Equipo:</label>
      <input type="text" v-model="form.marcaEquipo" required />

      <!-- Características -->
      <label>Características:</label>
      <textarea v-model="form.caracteristicas" required></textarea>

      <!-- Fecha de registro -->
      <label>Fecha de Registro:</label>
      <input type="date" v-model="form.fechaRegistro" required />

      <!-- Accesorios -->
      <label>Mouse:</label>
      <select v-model="form.mouse" required>
        <option value="sí">Sí</option>
        <option value="no">No</option>
      </select>

      <label>Cargador:</label>
      <select v-model="form.cargador" required>
        <option value="sí">Sí</option>
        <option value="no">No</option>
      </select>

      <button type="submit">Registrar</button>
    </form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        tipoUsuario: '',
        tipoDocumento: '',
        numeroDocumento: '',
        email: '',
        serialEquipo: '',
        marcaEquipo: '',
        caracteristicas: '',
        fechaRegistro: '',
        mouse: 'no',
        cargador: 'no'
      }
    }
  },
  methods: {
    async registrar() {
      try {
        const res = await fetch('http://localhost:5001/api/usuario-equipo/registrar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form)
        })

        if (!res.ok) {
          throw new Error(`Error en el registro: ${res.status}`)
        }

        const data = await res.json()
        alert('Registro exitoso ✅')
        console.log('Respuesta del servidor:', data)
      } catch (err) {
        console.error('Error al registrar:', err)
        alert('Hubo un error al registrar ❌')
      }
    }
  }
}
</script>

<style>
.registro-container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
}
label {
  display: block;
  margin-top: 10px;
}
input, select, textarea, button {
  width: 100%;
  padding: 8px;
  margin-top: 5px;
}
button {
  margin-top: 15px;
  background: #4CAF50;
  color: white;
  border: none;
  cursor: pointer;
}
button:hover {
  background: #45a049;
}
</style>
