const bwipjs = require("bwip-js");

// 🔹 Genera un código de barras en Base64
const generarCodigoBarras = async (texto) => {
  return new Promise((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: "code128",    // Tipo de código de barras
        text: texto,        // Contenido (ej: URL con serial)
        scale: 2,           // Escala (2 = más compacto)
        height: 10,         // Altura de las barras
        includetext: false, // No mostrar el texto debajo
      },
      (err, png) => {
        if (err) {
          return reject(err);
        }
        // Convertir a Base64 para enviarlo al frontend
        resolve(`data:image/png;base64,${png.toString("base64")}`);
      }
    );
  });
};

module.exports = { generarCodigoBarras };
