// backend/src/middleware/imageOptimizer.js
const sharp = require('sharp');

/**
 * Middleware para optimizar imágenes automáticamente
 * Reduce el tamaño de las fotos de usuarios para mejorar rendimiento
 */

const optimizeImage = async (base64Image, options = {}) => {
  try {
    if (!base64Image || !base64Image.startsWith('data:image/')) {
      return base64Image; // No es una imagen válida
    }

    // Configuración por defecto optimizada para 200K usuarios
    const config = {
      width: options.width || 300,
      height: options.height || 300,
      quality: options.quality || 70,
      format: options.format || 'jpeg',
      ...options
    };

    // Extraer el buffer de la imagen base64
    const base64Data = base64Image.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Verificar tamaño original
    const originalSize = imageBuffer.length;
    console.log(`📸 Imagen original: ${(originalSize / 1024).toFixed(1)}KB`);

    // Optimizar con Sharp
    const optimizedBuffer = await sharp(imageBuffer)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({
        quality: config.quality,
        progressive: true,
        mozjpeg: true // Mejor compresión
      })
      .toBuffer();

    const optimizedSize = optimizedBuffer.length;
    const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ Imagen optimizada: ${(optimizedSize / 1024).toFixed(1)}KB (${reduction}% reducción)`);

    // Convertir de vuelta a base64
    const optimizedBase64 = `data:image/jpeg;base64,${optimizedBuffer.toString('base64')}`;
    
    return optimizedBase64;

  } catch (error) {
    console.error('❌ Error optimizando imagen:', error.message);
    return base64Image; // Devolver original si falla la optimización
  }
};

/**
 * Middleware para procesar automáticamente las fotos en requests
 */
const imageOptimizerMiddleware = async (req, res, next) => {
  try {
    // Verificar si hay foto en el body
    if (req.body && req.body.foto && typeof req.body.foto === 'string') {
      console.log('🔧 Optimizando imagen en request...');
      
      const startTime = Date.now();
      req.body.foto = await optimizeImage(req.body.foto, {
        width: 300,
        height: 300,
        quality: 75
      });
      
      const processingTime = Date.now() - startTime;
      console.log(`⚡ Imagen procesada en ${processingTime}ms`);
    }
    
    next();
  } catch (error) {
    console.error('❌ Error en middleware de optimización:', error.message);
    next(); // Continuar sin optimización si falla
  }
};

/**
 * Optimizar múltiples imágenes en paralelo
 */
const optimizeMultipleImages = async (images, options = {}) => {
  try {
    const promises = images.map(image => optimizeImage(image, options));
    return await Promise.all(promises);
  } catch (error) {
    console.error('❌ Error optimizando múltiples imágenes:', error.message);
    return images; // Devolver originales si falla
  }
};

/**
 * Generar thumbnail rápido para listas
 */
const generateThumbnail = async (base64Image) => {
  return await optimizeImage(base64Image, {
    width: 80,
    height: 80,
    quality: 60
  });
};

/**
 * Validar y limpiar imagen base64
 */
const validateAndCleanImage = (base64Image) => {
  try {
    if (!base64Image || typeof base64Image !== 'string') {
      return null;
    }

    // Verificar formato válido
    if (!base64Image.startsWith('data:image/')) {
      console.warn('⚠️ Formato de imagen inválido');
      return null;
    }

    // Verificar tamaño máximo (5MB)
    const sizeInBytes = (base64Image.length * 3) / 4;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (sizeInBytes > maxSize) {
      console.warn(`⚠️ Imagen demasiado grande: ${(sizeInBytes / 1024 / 1024).toFixed(1)}MB`);
      return null;
    }

    return base64Image;
  } catch (error) {
    console.error('❌ Error validando imagen:', error.message);
    return null;
  }
};

/**
 * Estadísticas de optimización
 */
let optimizationStats = {
  totalProcessed: 0,
  totalSavings: 0,
  averageReduction: 0,
  processingTime: 0
};

const getOptimizationStats = () => {
  return {
    ...optimizationStats,
    averageSavings: optimizationStats.totalProcessed > 0 
      ? (optimizationStats.totalSavings / optimizationStats.totalProcessed).toFixed(1) + 'KB'
      : '0KB',
    averageProcessingTime: optimizationStats.totalProcessed > 0
      ? (optimizationStats.processingTime / optimizationStats.totalProcessed).toFixed(0) + 'ms'
      : '0ms'
  };
};

const resetOptimizationStats = () => {
  optimizationStats = {
    totalProcessed: 0,
    totalSavings: 0,
    averageReduction: 0,
    processingTime: 0
  };
};

module.exports = {
  optimizeImage,
  imageOptimizerMiddleware,
  optimizeMultipleImages,
  generateThumbnail,
  validateAndCleanImage,
  getOptimizationStats,
  resetOptimizationStats
};