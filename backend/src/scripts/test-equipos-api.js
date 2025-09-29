// Script para probar la API de equipos
require('dotenv').config();
const mongoose = require('mongoose');
const UsuarioEquipo = require('./src/models/UsuarioEquipo');

async function probarDatosEquipos() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    console.log('URI:', process.env.MONGODB_URI ? 'Configurada' : 'No configurada');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // 1. Verificar usuarios con equipos
    console.log('\n📋 1. Verificando usuarios con equipos...');
    const usuariosConEquipos = await UsuarioEquipo.find({
      $or: [
        { equipos: { $exists: true, $ne: [] } },
        { equipo: { $exists: true } }
      ]
    })
      .select('nombre numeroDocumento equipos equipo')
      .limit(5)
      .lean();

    console.log(`Encontrados ${usuariosConEquipos.length} usuarios con equipos:`);
    
    usuariosConEquipos.forEach((usuario, index) => {
      console.log(`\n--- Usuario ${index + 1} ---`);
      console.log(`Nombre: ${usuario.nombre}`);
      console.log(`Documento: ${usuario.numeroDocumento}`);
      
      // Mostrar equipo principal
      if (usuario.equipo) {
        console.log(`Equipo principal:`, {
          serial: usuario.equipo.serial,
          marca: usuario.equipo.marca
        });
      } else {
        console.log('Equipo principal: No definido');
      }
      
      // Mostrar array de equipos
      if (usuario.equipos && usuario.equipos.length > 0) {
        console.log(`Array equipos: ${usuario.equipos.length} equipos`);
        usuario.equipos.forEach((equipo, idx) => {
          console.log(`  ${idx + 1}. ${equipo.marca || 'Sin marca'} (${equipo.serial || 'Sin serial'})`);
        });
      } else {
        console.log('Array equipos: Vacío o no definido');
      }
    });

    // 2. Simular la lógica del controlador equiposPorUsuario CORREGIDA
    console.log('\n📋 2. Simulando lógica del controlador CORREGIDA...');
    const equipos = [];
    const serialsVistos = new Set(); // Para evitar duplicados
    
    usuariosConEquipos.forEach(usuario => {
      // Procesar array equipos si existe (prioridad principal)
      if (usuario.equipos && usuario.equipos.length > 0) {
        usuario.equipos.forEach(equipo => {
          // Solo agregar si no hemos visto este serial antes
          if (!serialsVistos.has(equipo.serial)) {
            serialsVistos.add(equipo.serial);
            equipos.push({
              ...equipo,
              usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                documento: usuario.numeroDocumento
              }
            });
          }
        });
      }
      // Solo procesar objeto equipo si NO existe array equipos o está vacío
      else if (usuario.equipo && Object.keys(usuario.equipo).length > 0) {
        // Solo agregar si no hemos visto este serial antes
        if (!serialsVistos.has(usuario.equipo.serial)) {
          serialsVistos.add(usuario.equipo.serial);
          equipos.push({
            _id: usuario.equipo._id || `temp-${Date.now()}`,
            marca: usuario.equipo.marca || 'Equipo',
            serial: usuario.equipo.serial || '',
            caracteristicas: usuario.equipo.caracteristicas || '',
            accesorios: usuario.equipo.accesorios || { mouse: false, cargador: false },
            foto: usuario.equipo.foto || null,
            usuario: {
              id: usuario._id,
              nombre: usuario.nombre,
              documento: usuario.numeroDocumento
            }
          });
        }
      }
    });

    console.log(`\n✅ Total equipos procesados: ${equipos.length}`);
    equipos.forEach((equipo, index) => {
      console.log(`${index + 1}. ${equipo.marca} (${equipo.serial}) - Usuario: ${equipo.usuario.nombre}`);
    });

    // 3. Verificar duplicados
    console.log('\n📋 3. Verificando duplicados...');
    const serialsVerificacion = new Set();
    const duplicados = [];
    
    equipos.forEach(equipo => {
      if (serialsVerificacion.has(equipo.serial)) {
        duplicados.push(equipo.serial);
      } else {
        serialsVerificacion.add(equipo.serial);
      }
    });

    if (duplicados.length > 0) {
      console.log(`⚠️  Encontrados ${duplicados.length} seriales duplicados:`, duplicados);
    } else {
      console.log('✅ No se encontraron duplicados');
    }

    console.log('\n✅ Prueba completada');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

probarDatosEquipos();