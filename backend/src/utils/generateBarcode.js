const axios = require('axios');
const fs = require('fs');
const path = require('path');

const generateBarcode = async (code) => {
  try {
    const response = await axios.post(
      'http://localhost:5001/generate-barcode',
      { code },
      { responseType: 'stream' }
    );

    const filePath = path.join(__dirname, '..', 'barcodes', `${code}.png`);

    // Asegúrate de que la carpeta exista
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error al generar el código de barras:', error.message);
    throw error;
  }
};

module.exports = generateBarcode;
