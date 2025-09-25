// Script para probar todas las funcionalidades después de los cambios
const mongoose = require('mongoose');
const UsuarioEquipo = require('./src/models/UsuarioEquipo');
const { equiposPorUsuario } = require('./src/controllers/equiposController');

async function testearFuncionalidades() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/gatelogix');
    console.log('✅ Conectado a MongoDB');

    // 1. Verificar que todos los usuarios tienen equipos en el array
    console.log('\n📋 1. Verificando usuarios y sus equipos...');
    const usuarios = await UsuarioEquipo.find({}).limit(5);
    
    for (const usuario of usuarios) {
      console.log(`\n👤 Usuario: ${usuario.nombre}`);
      console.log(`   Documento: ${usuario.numeroDocumento}`);
      console.log(`   Equipo principal:`, usuario.equipo ? {
        serial: usuario.equipo.serial,
        marca: usuario.equipo.marca
      } : 'No definido');
      console.log(`   Array equipos: ${usuario.equipos?.length || 0} equipos`);
      
      if (usuario.equipos && usuario.equipos.length > 0) {
        usuario.equipos.forEach((equipo, index) => {
          console.log(`     ${index + 1}. ${equipo.marca || 'Sin marca'} (${equipo.serial || 'Sin serial'})`);
        });
      }
    }

    // 2. Probar la función equiposPorUsuario
    console.log('\n📋 2. Probando función equiposPorUsuario...');
    const usuarioTest = usuarios[0];
    if (usuarioTest) {
      console.log(`\nProbando con usuario: ${usuarioTest.nombre} (${usuarioTest.numeroDocumento})`);
      
      // Simular req y res para la función
      const req = { params: { documento: usuarioTest.numeroDocumento } };
      const res = {
        json: (data) => {
          console.log('✅ Respuesta de equiposPorUsuario:');
          console.log(`   Usuario: ${data.usuario}`);
          console.log(`   Documento: ${data.documento}`);
          console.log(`   Equipo principal:`, data.equipoPrincipal);
          console.log(`   Equipos array: ${data.equiposArray?.length || 0} equipos`);
          if (data.equiposArray && data.equiposArray.length > 0) {
            data.equiposArray.forEach((equipo, index) => {
              console.log(`     ${index + 1}. ${equipo.marca || 'Sin marca'} (${equipo.serial || 'Sin serial'})`);
            });
          }
        },
        status: (code) => ({
          json: (data) => {
            console.log(`❌ Error ${code}:`, data);
          }
        })
      };

      await equiposPorUsuario(req, res);
    }

    // 3. Verificar consistencia de datos
    console.log('\n📋 3. Verificando consistencia de datos...');
    const usuariosConProblemas = await UsuarioEquipo.find({
      $and: [
        { 'equipo.serial': { $exists: true, $ne: null } },
        { 
          $expr: {
            $not: {
              $in: ['$equipo.serial', { $ifNull: ['$equipos.serial', []] }]
            }
          }
        }
      ]
    });

    if (usuariosConProblemas.length > 0) {
      console.log(`⚠️  Encontrados ${usuariosConProblemas.length} usuarios con inconsistencias:`);
      usuariosConProblemas.forEach(usuario => {
        console.log(`   - ${usuario.nombre}: Equipo principal ${usuario.equipo.serial} no está en el array`);
      });
    } else {
      console.log('✅ Todos los usuarios tienen datos consistentes');
    }

    // 4. Estadísticas finales
    console.log('\n📊 4. Estadísticas finales...');
    const totalUsuarios = await UsuarioEquipo.countDocuments();
    const usuariosConEquipos = await UsuarioEquipo.countDocuments({
      'equipos.0': { $exists: true }
    });
    const usuariosConEquipoPrincipal = await UsuarioEquipo.countDocuments({
      'equipo.serial': { $exists: true, $ne: null }
    });

    console.log(`   Total usuarios: ${totalUsuarios}`);
    console.log(`   Usuarios con equipos en array: ${usuariosConEquipos}`);
    console.log(`   Usuarios con equipo principal: ${usuariosConEquipoPrincipal}`);
    console.log(`   Porcentaje migrado: ${((usuariosConEquipos / totalUsuarios) * 100).toFixed(1)}%`);

    console.log('\n✅ Pruebas completadas exitosamente');

  } catch (error) {
    console.error('❌ Error durante las pruebas:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

testearFuncionalidades();