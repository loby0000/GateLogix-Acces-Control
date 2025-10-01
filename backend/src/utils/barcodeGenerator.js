const bwipjs = require("bwip-js");

// 🔹 Genera un código de barras en Base64
const generarCodigoBarras = async (texto) => {
  try {
    console.log('🏷️  BARCODE DEBUG - Iniciando generación de código de barras para texto:', texto);
    
    const buffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: texto,
      scale: 3,
      height: 10,
      includetext: true,
      textxalign: 'center',
    });

    const base64 = buffer.toString('base64');
    const resultado = `data:image/png;base64,${base64}`;
    
    console.log('✅ BARCODE DEBUG - Código de barras generado exitosamente, longitud base64:', base64.length);
    console.log('🔍 BARCODE DEBUG - Primeros 50 caracteres del resultado:', resultado.substring(0, 50));
    
    return resultado;
  } catch (error) {
    console.error('❌ BARCODE DEBUG - Error generando código de barras:', error);
    console.error('❌ BARCODE DEBUG - Texto que causó el error:', texto);
    throw error;
  }
};

module.exports = { generarCodigoBarras };
