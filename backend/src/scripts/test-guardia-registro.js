// Script para probar el registro de un guardia
const axios = require('axios');

async function testRegistroGuardia() {
  try {
    const response = await axios.post('http://localhost:3000/api/guardia/registrar', {
      documento: '54321',
      nombre: 'Guardia Test',
      jornada: 'mañana',
      clave: '123456',
      usuarioAdmin: '0',  // Usar credenciales de admin existentes
      claveAdmin: '0'
    });
    
    console.log('Respuesta:', response.data);
    console.log('✅ Registro exitoso!');
  } catch (error) {
    console.error('❌ Error en el registro:', error.response ? error.response.data : error.message);
  }
}

testRegistroGuardia();