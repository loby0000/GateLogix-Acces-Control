const axios = require('axios');
const fs = require('fs');
const path = require('path');

const generarCodigoBarras = async (codigo) => {
  try {
    const response = await axios.post('http://localhost:5001/generate-barcode', {
      code: codigo
    }, {
      responseType: 'arraybuffer' // Importante para que reciba la imagen como buffer
    });

  // Guardar la imagen en la carpeta 'barcodes' exactamente en la raíz del proyecto
  const barcodeDir = path.resolve(__dirname, '../../../barcodes');
    if (!fs.existsSync(barcodeDir)) {
      fs.mkdirSync(barcodeDir);
    }

    const outputPath = path.join(barcodeDir, `${codigo}.png`);
  console.log('Guardando código de barras en:', outputPath);
  fs.writeFileSync(outputPath, response.data);

    return `${codigo}.png`; // Esto es lo que se guarda en Mongo (opcional)
  } catch (error) {
    console.error('❌ Error al generar código de barras:', error.message);
    throw new Error('No se pudo generar el código de barras');
  }
};

module.exports = generarCodigoBarras;
