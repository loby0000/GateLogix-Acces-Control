// Script para probar el registro de nuevos usuarios y equipos
require('dotenv').config();
const mongoose = require('mongoose');
const UsuarioEquipo = require('../models/UsuarioEquipo');

async function testNuevoRegistro() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Simular datos de un nuevo usuario
    const equipoData = {
      serial: 'TEST-SERIAL-' + Date.now(),
      marca: 'HP',
      caracteristicas: 'Laptop de prueba',
      accesorios: {
        mouse: true,
        cargador: true
      },
      fechaIngreso: new Date().toISOString()
    };

    const usuarioData = {
      tipoUsuario: 'Aprendiz', // ✅ Valor válido del enum
      tipoDocumento: 'Cédula De Ciudadanía', // ✅ Valor válido del enum
      numeroDocumento: '9999999999',
      nombre: 'Usuario de Prueba',
      email: 'prueba@test.com',
      equipo: equipoData, // Equipo principal (para compatibilidad)
      equipos: [equipoData], // Array equipos inicializado
      historialModificaciones: [
        {
          cambios: 'Registro inicial de prueba',
          registradoPor: 'Sistema de prueba'
        }
      ]
    };

    console.log('\n📝 Creando usuario de prueba...');
    const nuevoUsuario = await UsuarioEquipo.create(usuarioData);
    console.log('✅ Usuario creado exitosamente');

    console.log('\n📊 Verificando estructura de datos:');
    console.log('Nombre:', nuevoUsuario.nombre);
    console.log('Documento:', nuevoUsuario.numeroDocumento);
    console.log('Equipo principal:', nuevoUsuario.equipo ? 
      `${nuevoUsuario.equipo.marca} (${nuevoUsuario.equipo.serial})` : 'No definido');
    console.log('Array equipos:', nuevoUsuario.equipos ? 
      `${nuevoUsuario.equipos.length} equipos` : 'Array no definido');
    
    if (nuevoUsuario.equipos && nuevoUsuario.equipos.length > 0) {
      nuevoUsuario.equipos.forEach((equipo, index) => {
        console.log(`  ${index + 1}. ${equipo.marca} (${equipo.serial})`);
      });
    }

    console.log('\n🧪 Probando función equiposPorUsuario simulada...');
    const usuario = await UsuarioEquipo.findOne({ numeroDocumento: usuarioData.numeroDocumento })
      .select('nombre numeroDocumento equipo equipos');

    let equipoPrincipal = null;
    let equiposArray = [];

    // Procesar array equipos primero
    if (usuario.equipos && usuario.equipos.length > 0) {
      equiposArray = usuario.equipos;
      equipoPrincipal = usuario.equipos[0]; // El primer equipo del array
    }

    // Si no hay equipos en el array pero hay equipo principal, usarlo
    if (equiposArray.length === 0 && usuario.equipo) {
      equipoPrincipal = usuario.equipo;
    }

    console.log('Resultado de equiposPorUsuario simulado:');
    console.log('- Equipo principal:', equipoPrincipal ? 
      `${equipoPrincipal.marca} (${equipoPrincipal.serial})` : 'No encontrado');
    console.log('- Equipos en array:', equiposArray.length);

    console.log('\n🧹 Limpiando datos de prueba...');
    await UsuarioEquipo.deleteOne({ numeroDocumento: usuarioData.numeroDocumento });
    console.log('✅ Datos de prueba eliminados');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    console.log('\n🔌 Desconectando de MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
  }
}

testNuevoRegistro();