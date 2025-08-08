const axios = require('axios');

const generarCodigoBarras = async (valor) => {
  try {
    const response = await axios.post('http://localhost:5001/generar', { valor });

    return response.data.ruta; // Devuelve la ruta local del PNG generado
  } catch (err) {
    console.error('❌ Error generando código de barras:', err.message);
    return null;
  }
};

module.exports = generarCodigoBarras;

