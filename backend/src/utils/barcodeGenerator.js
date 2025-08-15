const axios = require('axios');
const fs = require('fs');
const path = require('path');

const generarCodigoBarras = async (codigo) => {
  try {
    // Llamamos al servidor que genera el código de barras (puerto 5001)
    const response = await axios.post(
      'http://localhost:5001/generate-barcode',
      { code: codigo },
      { responseType: 'arraybuffer' } // Recibimos el binario
    );

    // Carpeta para guardar los códigos (dentro del backend principal)
    const barcodeDir = path.resolve(__dirname, '../barcodes');
    if (!fs.existsSync(barcodeDir)) {
      fs.mkdirSync(barcodeDir);
    }

    // Guardar el archivo PNG
    const outputPath = path.join(barcodeDir, `${codigo}.png`);
    fs.writeFileSync(outputPath, response.data);

    // Retornamos solo el nombre del archivo
    return `${codigo}.png`;
  } catch (error) {
    console.error('❌ Error al generar código de barras:', error.message);
    throw new Error('No se pudo generar el código de barras');
  }
};

module.exports = generarCodigoBarras;
