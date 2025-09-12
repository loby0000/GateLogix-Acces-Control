// Script para probar el registro de un nuevo guardia con documento único
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testGuardiaRegistroNuevo() {
  try {
    console.log('🧪 Probando registro de guardia con documento nuevo...');
    
    // Generar un documento único usando timestamp
    const documentoUnico = `${Date.now().toString().slice(-8)}`;
    
    // Datos de prueba con documento único
    const datosGuardia = {
      documento: documentoUnico,
      nombre: 'Guardia Nuevo Test',
      jornada: 'tarde',
      clave: 'clave123',
      usuarioAdmin: 'admin',
      claveAdmin: 'admin123'
    };
    
    console.log(`📝 Intentando registrar guardia con documento: ${documentoUnico}`);
    
    // Intentar registrar guardia con documento único
    const response = await axios.post(`${API_URL}/guardia/registrar`, datosGuardia);
    
    console.log('✅ Respuesta del servidor:', response.data);
    console.log('✅ Registro exitoso!');
  } catch (error) {
    if (error.response) {
      console.log('🛑 Error en la respuesta:', error.response.status);
      console.log('🛑 Mensaje de error:', error.response.data);
    } else {
      console.error('❌ Error al realizar la petición:', error.message);
    }
  }
}

// Ejecutar la prueba
testGuardiaRegistroNuevo();