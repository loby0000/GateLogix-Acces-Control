// Script para probar y verificar los datos de equipos en la base de datos
require('dotenv').config();
const mongoose = require('mongoose');
const UsuarioEquipo = require('../models/UsuarioEquipo');

async function testEquiposData() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los usuarios
    console.log('\n📊 Obteniendo todos los usuarios...');
    const usuarios = await UsuarioEquipo.find({}).select('nombre numeroDocumento equipo equipos');
    
    console.log(`\n👥 Total de usuarios encontrados: ${usuarios.length}`);
    
    usuarios.forEach((usuario, index) => {
      console.log(`\n--- Usuario ${index + 1} ---`);
      console.log(`Nombre: ${usuario.nombre}`);
      console.log(`Documento: ${usuario.numeroDocumento}`);
      console.log(`Equipo principal:`, usuario.equipo ? {
        serial: usuario.equipo.serial,
        marca: usuario.equipo.marca
      } : 'No tiene');
      console.log(`Array equipos:`, usuario.equipos ? `${usuario.equipos.length} equipos` : 'No tiene array');
      
      if (usuario.equipos && usuario.equipos.length > 0) {
        console.log('Equipos en array:');
        usuario.equipos.forEach((equipo, i) => {
          console.log(`  ${i + 1}. Serial: ${equipo.serial}, Marca: ${equipo.marca}`);
        });
      }
    });

    // Probar la función equiposPorUsuario manualmente
    if (usuarios.length > 0) {
      const primerUsuario = usuarios[0];
      console.log(`\n🧪 Probando equiposPorUsuario con documento: ${primerUsuario.numeroDocumento}`);
      
      const usuarioCompleto = await UsuarioEquipo.findOne({ numeroDocumento: primerUsuario.numeroDocumento })
        .select('nombre numeroDocumento email tipoUsuario equipo equipos');
      
      console.log('Usuario completo encontrado:', {
        nombre: usuarioCompleto.nombre,
        documento: usuarioCompleto.numeroDocumento,
        equipoPrincipal: usuarioCompleto.equipo,
        equiposArray: usuarioCompleto.equipos
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

testEquiposData();