require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const path = require('path');
const historialRoutes = require('./routes/historialRoutes');
const adminRoutes = require('./routes/adminRoutes');
const guardiaRoutes = require('./routes/guardiaRoutes');
const usuarioEquipoRoutes = require('./routes/usuarioEquipoRoutes');
const cacheRoutes = require('./routes/cacheRoutes');
const estadisticasRoutes = require('./routes/estadisticasRoutes');
const equiposRoutes = require('./routes/equiposRoutes');
const initEmergencyAdmin = require('./config/initAdmin');
const { createClient, closeRedisConnection } = require('./config/redis');

const app = express();


// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'https://frontend-app-115351146305.us-central1.run.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'Pragma']
}));
app.use(helmet());
app.use(morgan('dev'));

// Archivos estáticos (códigos de barras)
app.use('/barcodes', express.static(path.join(__dirname, 'barcodes')));

// Rutas
app.use('/api/admin', adminRoutes);
app.use('/api/guardia', guardiaRoutes);
app.use('/api/usuario-equipo', usuarioEquipoRoutes);
app.use('/api/historial', historialRoutes);
app.use('/api/cache', cacheRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/equipos', equiposRoutes);

// Ruta base
app.get('/', (req, res) => res.send('API funcionando'));

// Función para inicializar servicios
console.log('🚀 Iniciando aplicación GateLogix...');
console.log('🔍 Entorno de ejecución:', process.env.NODE_ENV || 'development');

const initializeServices = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Inicializar Redis (opcional - no bloquea si falla)
    await createClient();
    
    // Crear admin de emergencia
    await initEmergencyAdmin();
    
    // Iniciar servidor
    const PORT = process.env.PORT || 8080;
    console.log(`🔍 Intentando iniciar servidor en puerto: ${PORT}`);
    console.log(`🔍 Variables de entorno: NODE_ENV=${process.env.NODE_ENV}, PORT=${process.env.PORT}`);
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor escuchando exitosamente en puerto: ${PORT}`);
      console.log(`🚀 Servidor corriendo en puerto: ${PORT}`);
      console.log(`📊 Dashboard disponible en la ruta raíz`);
      console.log(`🔧 API Base: /api`);
    });
    
    // Manejo de cierre graceful
    process.on('SIGTERM', async () => {
      console.log('🛑 Cerrando servidor...');
      await closeRedisConnection();
      await mongoose.connection.close();
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', async () => {
      console.log('🛑 Cerrando servidor...');
      await closeRedisConnection();
      await mongoose.connection.close();
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Error inicializando servicios:', error);
    console.error('❌ Detalles del error:', error.message);
    console.error('❌ Stack trace:', error.stack);
    process.exit(1);
  }
};

// Inicializar aplicación
initializeServices();
