// Script de migración para mover equipos principales al array equipos
require('dotenv').config();
const mongoose = require('mongoose');
const UsuarioEquipo = require('../models/UsuarioEquipo');

async function migrateEquipos() {
  try {
    console.log('🔍 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los usuarios que tienen equipo principal pero no en el array equipos
    console.log('\n📊 Buscando usuarios con equipos principales no migrados...');
    
    const usuarios = await UsuarioEquipo.find({
      'equipo.serial': { $exists: true, $ne: null },
      $or: [
        { equipos: { $exists: false } },
        { equipos: { $size: 0 } },
        { 'equipos.serial': { $ne: '$equipo.serial' } }
      ]
    });

    console.log(`\n👥 Usuarios encontrados para migrar: ${usuarios.length}`);

    let migrados = 0;
    let errores = 0;

    for (const usuario of usuarios) {
      try {
        console.log(`\n🔄 Migrando usuario: ${usuario.nombre} (${usuario.numeroDocumento})`);
        
        // Inicializar array equipos si no existe
        if (!usuario.equipos) {
          usuario.equipos = [];
        }

        // Verificar si el equipo principal ya está en el array
        const equipoExistente = usuario.equipos.find(e => e.serial === usuario.equipo.serial);
        
        if (!equipoExistente) {
          // Crear objeto de equipo para el array
          const equipoParaArray = {
            serial: usuario.equipo.serial,
            marca: usuario.equipo.marca,
            caracteristicas: usuario.equipo.caracteristicas || '',
            accesorios: {
              mouse: usuario.equipo.accesorios?.mouse || false,
              cargador: usuario.equipo.accesorios?.cargador || false
            },
            foto: usuario.equipo.foto || null,
            fechaIngreso: usuario.equipo.fechaIngreso || new Date()
          };

          // Agregar al inicio del array (equipo principal)
          usuario.equipos.unshift(equipoParaArray);

          // Guardar cambios
          await usuario.save();
          
          console.log(`✅ Migrado: ${usuario.equipo.marca} (${usuario.equipo.serial})`);
          migrados++;
        } else {
          console.log(`⚠️  Equipo ya existe en array: ${usuario.equipo.serial}`);
        }

      } catch (error) {
        console.error(`❌ Error migrando usuario ${usuario.nombre}:`, error.message);
        errores++;
      }
    }

    console.log('\n📊 RESUMEN DE MIGRACIÓN:');
    console.log(`✅ Usuarios migrados exitosamente: ${migrados}`);
    console.log(`❌ Errores durante migración: ${errores}`);
    console.log(`📋 Total procesados: ${usuarios.length}`);

    // Verificar migración
    console.log('\n🔍 Verificando migración...');
    const usuariosVerificacion = await UsuarioEquipo.find({}).select('nombre numeroDocumento equipo equipos');
    
    let equiposSinMigrar = 0;
    usuariosVerificacion.forEach(usuario => {
      if (usuario.equipo && usuario.equipo.serial) {
        const equipoEnArray = usuario.equipos?.find(e => e.serial === usuario.equipo.serial);
        if (!equipoEnArray) {
          console.log(`⚠️  Usuario sin migrar: ${usuario.nombre} - ${usuario.equipo.serial}`);
          equiposSinMigrar++;
        }
      }
    });

    if (equiposSinMigrar === 0) {
      console.log('✅ Todos los equipos principales han sido migrados correctamente');
    } else {
      console.log(`❌ Quedan ${equiposSinMigrar} equipos sin migrar`);
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar migración
migrateEquipos();