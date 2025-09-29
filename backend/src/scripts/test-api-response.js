const axios = require('axios');

async function testApiResponse() {
  try {
    console.log('🔍 Probando respuesta de API para equipos...\n');
    
    // Primero hacer login para obtener token
    console.log('🔐 Obteniendo token de autenticación...');
    const loginResponse = await axios.post('http://localhost:8080/api/admin/login', {
      usuario: 'admin',
      clave: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtenido correctamente\n');
    
    // Simular la misma llamada que hace el frontend
    const response = await axios.get('http://localhost:8080/api/equipos/listar?limit=50', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 Respuesta completa de la API:');
    console.log('Total equipos:', response.data.equipos?.length || 0);
    console.log('Estructura:', Object.keys(response.data));
    
    if (response.data.equipos) {
      console.log('\n🔍 Buscando equipos del usuario 46464646...');
      
      const equipos46464646 = response.data.equipos.filter(equipo => {
        const documento = equipo.usuario?.documento;
        return documento === '5646464646' || documento === '46464646';
      });
      
      console.log(`\n✅ Equipos encontrados para 46464646: ${equipos46464646.length}`);
      
      equipos46464646.forEach((equipo, index) => {
        console.log(`\n📦 Equipo ${index + 1}:`);
        console.log('  - Serial:', equipo.serial);
        console.log('  - Marca:', equipo.marca);
        console.log('  - Usuario documento:', equipo.usuario?.documento);
        console.log('  - Usuario nombre:', equipo.usuario?.nombre);
        console.log('  - ID:', equipo._id);
      });
      
      // Mostrar todos los equipos para verificar
      console.log('\n📋 Todos los equipos en la respuesta:');
      response.data.equipos.forEach((equipo, index) => {
        console.log(`${index + 1}. ${equipo.serial} - Usuario: ${equipo.usuario?.documento} (${equipo.usuario?.nombre})`);
      });
    } else {
      console.log('❌ No se encontraron equipos en la respuesta');
    }
    
  } catch (error) {
    console.error('❌ Error al probar API:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testApiResponse();