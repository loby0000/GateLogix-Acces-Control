// Script para limpiar el caché del backend
require('dotenv').config();
const cacheService = require('../utils/cacheService');

async function clearCache() {
  try {
    console.log('🧹 Iniciando limpieza de caché...');
    
    // Limpiar patrones específicos relacionados con usuarios y equipos
    await cacheService.delPattern('users:*');
    console.log('✅ Caché de usuarios limpiado');
    
    await cacheService.delPattern('equipos:*');
    console.log('✅ Caché de equipos limpiado');
    
    await cacheService.delPattern('user:*');
    console.log('✅ Caché de usuario individual limpiado');
    
    await cacheService.delPattern('history:*');
    console.log('✅ Caché de historial limpiado');
    
    console.log('\n🎉 Limpieza de caché completada exitosamente');
    console.log('Los cambios de la migración ahora se reflejarán en las próximas consultas');
    
  } catch (error) {
    console.error('❌ Error al limpiar caché:', error);
  } finally {
    process.exit(0);
  }
}

clearCache();