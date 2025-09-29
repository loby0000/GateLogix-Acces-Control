require('dotenv').config();
const mongoose = require('mongoose');
const UsuarioEquipo = require('./src/models/UsuarioEquipo');

async function investigarUsuario46464646() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    console.log('URI:', process.env.MONGODB_URI ? 'Configurada' : 'No configurada');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Buscar específicamente el usuario 46464646
    console.log('\n📋 Buscando usuario 46464646...');
    let usuario = await UsuarioEquipo.findOne({ numeroDocumento: '46464646' });
    
    if (!usuario) {
      console.log('❌ Usuario con documento 46464646 no encontrado');
      console.log('🔍 Buscando por nombre que contenga 46464646...');
      usuario = await UsuarioEquipo.findOne({ nombre: { $regex: '46464646', $options: 'i' } });
    }
    
    if (!usuario) {
      console.log('❌ Usuario con nombre 46464646 no encontrado');
      console.log('🔍 Listando todos los usuarios para verificar...');
      const todosUsuarios = await UsuarioEquipo.find({}, { nombre: 1, numeroDocumento: 1 }).limit(20);
      console.log('Usuarios encontrados:');
      todosUsuarios.forEach(u => {
        console.log(`- ${u.nombre} (${u.numeroDocumento})`);
      });
      return;
    }

    console.log('\n--- Datos completos del usuario 46464646 ---');
    console.log('Nombre:', usuario.nombre);
    console.log('Documento:', usuario.numeroDocumento);
    console.log('ID:', usuario._id);
    
    // Verificar objeto equipo
    console.log('\n🔍 Objeto equipo:');
    if (usuario.equipo) {
      console.log('Existe objeto equipo:', JSON.stringify(usuario.equipo, null, 2));
    } else {
      console.log('No tiene objeto equipo');
    }
    
    // Verificar array equipos
    console.log('\n🔍 Array equipos:');
    if (usuario.equipos) {
      console.log('Existe array equipos:', usuario.equipos.length, 'elementos');
      usuario.equipos.forEach((equipo, index) => {
        console.log(`  ${index + 1}. ${equipo.marca || 'Sin marca'} (${equipo.serial || 'Sin serial'})`);
        console.log('     Datos completos:', JSON.stringify(equipo, null, 2));
      });
    } else {
      console.log('No tiene array equipos');
    }

    // Verificar campos separados
    console.log('\n🔍 Campos separados:');
    console.log('serialEquipo:', usuario.serialEquipo || 'No definido');
    console.log('marcaEquipo:', usuario.marcaEquipo || 'No definido');
    console.log('caracteristicasEquipo:', usuario.caracteristicasEquipo || 'No definido');

    // Simular la lógica del frontend
    console.log('\n🔄 Simulando lógica del frontend...');
    const equiposFinales = [];
    
    // Inicializar array equipos si no existe
    if (!usuario.equipos) {
      usuario.equipos = [];
    }
    
    // Procesar equipo principal si existe
    if (usuario.equipo && typeof usuario.equipo === 'object' && usuario.equipo.serial) {
      console.log('📦 Procesando objeto equipo principal...');
      const equipoExiste = usuario.equipos.some(eq => eq.serial === usuario.equipo.serial);
      if (!equipoExiste) {
        usuario.equipos.unshift(usuario.equipo);
        console.log('✅ Equipo principal agregado al inicio del array');
      } else {
        console.log('⚠️  Equipo principal ya existe en el array');
      }
    }
    
    // Procesar campos separados si existen
    if (usuario.serialEquipo) {
      console.log('📦 Procesando campos separados...');
      const equipoExiste = usuario.equipos.some(eq => eq.serial === usuario.serialEquipo);
      if (!equipoExiste) {
        const equipoSeparado = {
          serial: usuario.serialEquipo,
          marca: usuario.marcaEquipo || 'Equipo',
          caracteristicas: usuario.caracteristicasEquipo || '',
          _id: `temp-${Date.now()}`
        };
        usuario.equipos.unshift(equipoSeparado);
        console.log('✅ Equipo de campos separados agregado');
      } else {
        console.log('⚠️  Equipo de campos separados ya existe en el array');
      }
    }
    
    console.log('\n📊 Resultado final:');
    console.log('Total equipos después del procesamiento:', usuario.equipos.length);
    usuario.equipos.forEach((equipo, index) => {
      console.log(`  ${index + 1}. ${equipo.marca || 'Sin marca'} (${equipo.serial || 'Sin serial'})`);
    });

    console.log('\n✅ Investigación completada');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

investigarUsuario46464646();