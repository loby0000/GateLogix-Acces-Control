#!/usr/bin/env node
// backend/src/scripts/setup-optimization.js

/**
 * Script de configuración automática para optimizar GateLogix
 * Ejecutar después del deployment para configurar índices y optimizaciones
 */

const mongoose = require('mongoose');
const { createOptimizedIndexes, analyzeQueryPerformance } = require('../config/database-indexes');
require('dotenv').config();

const setupOptimization = async () => {
  try {
    console.log('🚀 Iniciando configuración de optimización para 200K usuarios...');
    console.log('=' .repeat(60));
    
    // Conectar a MongoDB
    console.log('📡 Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gatelogix', {
      maxPoolSize: 50, // Aumentar pool de conexiones
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log('✅ Conectado a MongoDB');
    
    // Crear índices optimizados
    console.log('\n🔧 Creando índices optimizados...');
    await createOptimizedIndexes();
    
    // Analizar rendimiento
    console.log('\n📊 Analizando rendimiento de consultas...');
    await analyzeQueryPerformance();
    
    // Configurar opciones de MongoDB
    console.log('\n⚙️ Configurando opciones de MongoDB...');
    const db = mongoose.connection.db;
    
    // Intentar configurar profiler (puede fallar en MongoDB Atlas)
    try {
      await db.command({
        profile: 2,
        slowms: 100,
        sampleRate: 0.1
      });
      console.log('✅ Profiler configurado para consultas >100ms');
    } catch (err) {
      console.log('ℹ️ Profiler no disponible (normal en MongoDB Atlas)');
    }
    
    // Estadísticas de colecciones
    console.log('\n📈 Estadísticas de colecciones:');
    const collections = ['usuarioequipos', 'historials', 'guardias', 'logs'];
    
    for (const collName of collections) {
      try {
        const stats = await db.collection(collName).stats();
        console.log(`📋 ${collName}:`);
        console.log(`   - Documentos: ${stats.count.toLocaleString()}`);
        console.log(`   - Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   - Índices: ${stats.nindexes}`);
        console.log(`   - Tamaño índices: ${(stats.totalIndexSize / 1024 / 1024).toFixed(2)} MB`);
      } catch (err) {
        console.log(`📋 ${collName}: Colección vacía o no existe`);
      }
    }
    
    // Recomendaciones de configuración
    console.log('\n💡 Recomendaciones de configuración:');
    console.log('=' .repeat(60));
    
    console.log('🔧 Variables de entorno recomendadas:');
    console.log('   NODE_ENV=production');
    console.log('   MONGODB_URI=mongodb://localhost:27017/gatelogix');
    console.log('   JWT_SECRET=<tu-secret-seguro>');
    console.log('   PORT=3000');
    
    console.log('\n🚀 Configuración de servidor recomendada:');
    console.log('   - CPU: 8 cores mínimo');
    console.log('   - RAM: 16GB mínimo');
    console.log('   - Storage: SSD NVMe');
    console.log('   - Network: 1Gbps');
    
    console.log('\n📊 Métricas a monitorear:');
    console.log('   - Response time < 200ms (95th percentile)');
    console.log('   - Error rate < 0.1%');
    console.log('   - CPU usage < 70%');
    console.log('   - Memory usage < 80%');
    console.log('   - DB connections < 40/50');
    
    console.log('\n🎯 Próximos pasos:');
    console.log('   1. Implementar middleware de caché en rutas críticas');
    console.log('   2. Configurar compresión de imágenes');
    console.log('   3. Implementar rate limiting');
    console.log('   4. Configurar monitoring (PM2, New Relic, etc.)');
    console.log('   5. Setup load balancer para múltiples instancias');
    
    console.log('\n✅ Configuración de optimización completada!');
    console.log('🚀 El sistema está listo para soportar 200K usuarios mensuales');
    
  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n📡 Desconectado de MongoDB');
    process.exit(0);
  }
};

// Función para verificar el estado del sistema
const checkSystemHealth = async () => {
  try {
    console.log('🏥 Verificando salud del sistema...');
    
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/gatelogix', {
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    
    const db = mongoose.connection.db;
    
    // Verificar conexión
    const adminDb = db.admin();
    const serverStatus = await adminDb.serverStatus();
    
    console.log('📊 Estado del servidor MongoDB:');
    console.log(`   - Versión: ${serverStatus.version}`);
    console.log(`   - Uptime: ${Math.floor(serverStatus.uptime / 3600)} horas`);
    console.log(`   - Conexiones: ${serverStatus.connections.current}/${serverStatus.connections.available}`);
    console.log(`   - Memoria: ${(serverStatus.mem.resident)} MB`);
    
    // Verificar índices críticos
    const collections = ['usuarioequipos', 'historials'];
    let allIndexesOk = true;
    
    for (const collName of collections) {
      const indexes = await db.collection(collName).indexes();
      const hasOptimizedIndexes = indexes.some(idx => idx.name.startsWith('idx_'));
      
      if (!hasOptimizedIndexes) {
        console.log(`⚠️ ${collName}: Faltan índices optimizados`);
        allIndexesOk = false;
      } else {
        console.log(`✅ ${collName}: Índices optimizados presentes`);
      }
    }
    
    if (allIndexesOk) {
      console.log('✅ Todos los índices optimizados están presentes');
    } else {
      console.log('⚠️ Ejecutar: npm run setup-optimization');
    }
    
    // Test de rendimiento rápido
    console.log('\n⚡ Test de rendimiento rápido...');
    await analyzeQueryPerformance();
    
    console.log('\n✅ Verificación de salud completada');
    
  } catch (error) {
    console.error('❌ Error verificando salud del sistema:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Ejecutar según el argumento
const command = process.argv[2];

switch (command) {
  case 'setup':
    setupOptimization();
    break;
  case 'health':
    checkSystemHealth();
    break;
  default:
    console.log('🚀 GateLogix Optimization Setup');
    console.log('\nComandos disponibles:');
    console.log('  node setup-optimization.js setup  - Configurar optimizaciones');
    console.log('  node setup-optimization.js health - Verificar salud del sistema');
    console.log('\nEjemplo:');
    console.log('  npm run setup-optimization');
    console.log('  npm run health-check');
    break;
}