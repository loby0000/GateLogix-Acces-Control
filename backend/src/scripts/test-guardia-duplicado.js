// Script para probar la validación de documento duplicado en el registro de guardias
const axios = require('axios');

const API_URL = 'http://localhost:3000/api';

async function testGuardiaRegistroDuplicado() {
  try {
    console.log('🧪 Probando registro de guardia con documento duplicado...');
    
    // Datos de prueba (usando documento que ya existe en la base de datos)
    const datosGuardia = {
      documento: '12345', // Documento que ya existe según el error anterior
      nombre: 'Guardia Prueba',
      jornada: 'mañana',
      clave: 'clave123',
      usuarioAdmin: 'admin',
      claveAdmin: 'admin123'
    };
    
    // Intentar registrar guardia con documento duplicado
    const response = await axios.post(`${API_URL}/guardia/registrar`, datosGuardia);
    
    console.log('✅ Respuesta del servidor:', response.data);
    console.log('✅ Registro exitoso (no debería llegar aquí si el documento está duplicado)!');
  } catch (error) {
    if (error.response) {
      console.log('🛑 Error en la respuesta:', error.response.status);
      console.log('🛑 Mensaje de error:', error.response.data);
      
      if (error.response.data.error === 'DUPLICATE_DOCUMENT') {
        console.log('✅ Validación funcionando correctamente: Se detectó documento duplicado');
      } else {
        console.log('❌ Error inesperado:', error.response.data);
      }
    } else {
      console.error('❌ Error al realizar la petición:', error.message);
    }
  }
}

// Ejecutar la prueba
testGuardiaRegistroDuplicado();