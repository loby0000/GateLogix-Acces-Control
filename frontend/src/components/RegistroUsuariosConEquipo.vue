<template>
  <div class="registro-usuarios flex flex-col min-h-screen w-full justify-start items-center p-0 m-0" style="min-height:100vh;">
    <!-- Logo fijo arriba a la izquierda -->
    <div style="position:fixed;top:0;left:0;z-index:50;margin:0;padding:0;line-height:0;">
      <img :src="logo" alt="Logo" class="logo logo-xxgrande" style="display:block;" />
    </div>

    <!-- Título centrado arriba -->
  <h1 class="titulo" style="text-align:center;margin-top:2.5rem;margin-bottom:2.5rem;font-size:4rem;">Registro de Usuarios con Equipo</h1>

    <main class="w-full flex flex-col items-center justify-start" style="flex:1;">
      <div class="search-container w-full flex justify-start items-center mb-12 mt-0 gap-8">
        <input type="text" placeholder="Buscar por documento..." class="max-w-xl text-3xl py-6 px-4" />
        <button class="text-3xl py-6 px-12">Buscar</button>
        <select class="w-96 text-3xl py-6 px-4">
          <option>Usuarios Registrados</option>
          <option>Equipos Registrados</option>
        </select>
      </div>

  <table class="w-[96vw] max-w-[1400px] mx-auto text-3xl">
        <thead>
          <tr>
            <th>Tipo De Usuario</th>
            <th>Tipo De Documento</th>
            <th>Documento</th>
            <th>Nombre</th>
            <th>Equipo</th>
            <th>Serial</th>
            <th>Características</th>
          </tr>
        </thead>
        <tbody>
          <!-- Filas dinámicas -->
        </tbody>
      </table>

      <button class="btn-registrar mt-16 text-3xl py-6 px-20">Registrar</button>
    </main>
  </div>
</template>

<script setup>
import logo from '../assets/logo.png'
</script>

<style scoped>
.registro-usuarios {
  font-family: Arial, sans-serif;
  background-color: #fff;
  color: #111;
}

.header {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  border-bottom: 1px solid #ccc;
}

.logo {
  height: 28px;
  width: 28px;
  margin: 0;
  padding: 0;
}
.logo-xxgrande {
  height: 200px !important;
  width: 200px !important;
}

.titulo {
  font-size: 18px;
  margin: 0;
}

main {
  padding: 20px;
}

.search-container {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.search-container input,
.search-container select {
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
}

.search-container button {
  padding: 8px 15px;
  background-color: #111;
  color: #fff;
  border: none;
  cursor: pointer;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

table th,
table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
  font-size: 14px;
}

table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.btn-registrar {
  margin-top: 10px;
  background-color: #111;
  color: #fff;
  padding: 8px 15px;
  border: none;
  cursor: pointer;
}
</style>
