// backend/src/scripts/test-redis-connection.js
const { createClient } = require('redis');
require('dotenv').config();

/**
 * Script para probar la conexión a Redis Cloud
 * Ejecutar con: node src/scripts/test-redis-connection.js
 */

(async () => {
  console.log('🧪 Probando conexión a Redis...');
  
  try {
    // Crear cliente con la configuración proporcionada
    const client = createClient({ 
      username: 'default', 
      password: 'Ic5G2TX9afohQ14VNkYALBjlXgrty0CE', 
      socket: { 
        host: 'redis-18535.c124.us-central1-1.gce.redns.redis-cloud.com', 
        port: 18535 
      } 
    });
    
    // Manejar errores
    client.on('error', err => console.log('❌ Redis Client Error', err));
    client.on('connect', () => console.log('🔗 Redis: Conectando...'));
    client.on('ready', () => console.log('✅ Redis: Conexión establecida y lista'));
    
    console.log('🌐 Conectando a Redis en la nube...');
    await client.connect();
    
    console.log('📝 Probando operaciones básicas...');
    await client.set('test:connection', 'Conexión exitosa: ' + new Date().toISOString());
    console.log('✅ SET: Completado');
    
    const value = await client.get('test:connection');
    console.log(`✅ GET: ${value}`);
    
    const info = await client.info();
    console.log('✅ INFO: Obtenido');
    console.log('📊 Versión Redis:', info.split('\n')
      .find(line => line.startsWith('redis_version'))?.split(':')[1] || 'Desconocida');
    console.log(`- Clientes conectados: ${info.split('\n').find(line => line.startsWith('connected_clients')).split(':')[1]}`);
    
    console.log('✅ Conexión a Redis exitosa y operativa');
    
    // Cerrar la conexión
    await client.quit();
    console.log('✅ Conexión cerrada correctamente');
    
    console.log('\n🎉 ¡Prueba completada con éxito! La conexión a Redis Cloud funciona correctamente.');
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error(error);
    console.log('⚠️  Redis no disponible - funcionando sin caché');
    process.exit(1);
  }
})();