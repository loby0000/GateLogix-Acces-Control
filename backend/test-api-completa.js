require('dotenv').config();
const mongoose = require('mongoose');
const UsuarioEquipo = require('./src/models/UsuarioEquipo');

async function testApiCompleta() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Simular exactamente la lógica del controlador corregido
    console.log('\n📋 Simulando controlador equipos/listar...');
    
    // Obtener usuarios con equipos (tanto array equipos como objeto equipo)
    const usuarios = await UsuarioEquipo.find({
      $or: [
        { equipos: { $exists: true, $ne: [] } },
        { equipo: { $exists: true } }
      ]
    })
      .select('nombre numeroDocumento equipos equipo')
      .lean();

    console.log(`Usuarios encontrados: ${usuarios.length}`);

    // Formatear la respuesta
    const equipos = [];
    const serialsVistos = new Set(); // Para evitar duplicados
    
    usuarios.forEach(usuario => {
      console.log(`\n--- Procesando usuario: ${usuario.nombre} (${usuario.numeroDocumento}) ---`);
      
      // Procesar array equipos si existe
      if (usuario.equipos && usuario.equipos.length > 0) {
        console.log(`📦 Array equipos: ${usuario.equipos.length} equipos`);
        usuario.equipos.forEach((equipo, index) => {
          console.log(`  ${index + 1}. ${equipo.marca || 'Sin marca'} (${equipo.serial || 'Sin serial'})`);
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
            console.log(`    ✅ Agregado a la lista`);
          } else {
            console.log(`    ⚠️  Serial duplicado, omitido`);
          }
        });
      } else {
        console.log('📦 No tiene array equipos');
      }
      
      // TAMBIÉN procesar objeto equipo si existe (sin else)
      if (usuario.equipo && Object.keys(usuario.equipo).length > 0) {
        console.log(`🔧 Objeto equipo: ${usuario.equipo.marca || 'Sin marca'} (${usuario.equipo.serial || 'Sin serial'})`);
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
          console.log(`    ✅ Agregado a la lista`);
        } else {
          console.log(`    ⚠️  Serial duplicado, omitido`);
        }
      } else {
        console.log('🔧 No tiene objeto equipo');
      }
    });

    console.log('\n📊 RESULTADO FINAL:');
    console.log(`Total equipos únicos: ${equipos.length}`);
    
    // Agrupar por usuario para mostrar mejor
    const equiposPorUsuario = {};
    equipos.forEach(equipo => {
      const doc = equipo.usuario.documento;
      if (!equiposPorUsuario[doc]) {
        equiposPorUsuario[doc] = {
          nombre: equipo.usuario.nombre,
          documento: doc,
          equipos: []
        };
      }
      equiposPorUsuario[doc].equipos.push({
        marca: equipo.marca,
        serial: equipo.serial
      });
    });

    Object.values(equiposPorUsuario).forEach(usuario => {
      console.log(`\n👤 ${usuario.nombre} (${usuario.documento}): ${usuario.equipos.length} equipos`);
      usuario.equipos.forEach((equipo, index) => {
        console.log(`  ${index + 1}. ${equipo.marca} (${equipo.serial})`);
      });
    });

    console.log('\n✅ Prueba completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

testApiCompleta();