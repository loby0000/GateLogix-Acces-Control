// backend/src/scripts/redis-connection-persistent.js
const { createClient } = require('redis');
require('dotenv').config();

/**
 * Script para mantener una conexión persistente a Redis Cloud
 * Ejecutar con: node src/scripts/redis-connection-persistent.js
 */

(async () => {
  console.log('🧪 Iniciando conexión persistente a Redis...');
  
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
    
    // Manejar errores y eventos
    client.on('error', err => console.log('❌ Redis Client Error', err));
    client.on('connect', () => console.log('🔗 Redis: Conectando...'));
    client.on('ready', () => console.log('✅ Redis: Conexión establecida y lista'));
    client.on('end', () => console.log('🔌 Redis: Conexión cerrada'));
    
    console.log('🌐 Conectando a Redis en la nube...');
    await client.connect();
    
    console.log('📝 Probando operaciones básicas...');
    await client.set('test:connection', 'Conexión persistente iniciada: ' + new Date().toISOString());
    console.log('✅ SET: Completado');
    
    const value = await client.get('test:connection');
    console.log(`✅ GET: ${value}`);
    
    const info = await client.info();
    console.log('✅ INFO: Obtenido');
    console.log('📊 Versión Redis:', info.split('\n')
      .find(line => line.startsWith('redis_version'))?.split(':')[1] || 'Desconocida');
    console.log(`- Clientes conectados: ${info.split('\n').find(line => line.startsWith('connected_clients')).split(':')[1]}`);
    
    console.log('✅ Conexión a Redis exitosa y operativa');
    console.log('\n🔄 Manteniendo conexión abierta. Presiona Ctrl+C para terminar.');
    
    // Mantener el script en ejecución
    setInterval(async () => {
      try {
        // Actualizar timestamp para verificar que la conexión sigue activa
        await client.set('test:heartbeat', new Date().toISOString());
        const heartbeat = await client.get('test:heartbeat');
        console.log(`💓 Heartbeat: ${heartbeat}`);
      } catch (error) {
        console.error('❌ Error en heartbeat:', error.message);
      }
    }, 5000); // Cada 5 segundos
    
    // Manejar cierre del proceso
    process.on('SIGINT', async () => {
      console.log('\n👋 Cerrando conexión a Redis...');
      await client.quit();
      console.log('✅ Conexión cerrada correctamente');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message);
    console.error(error);
    console.log('⚠️  Redis no disponible - funcionando sin caché');
    process.exit(1);
  }
})();