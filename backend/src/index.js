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
const initEmergencyAdmin = require('./config/initAdmin');
const { createRedisClient, closeRedisConnection } = require('./config/redis');

const app = express();


// Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());
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

// Ruta base
app.get('/', (req, res) => res.send('API funcionando'));

// Función para inicializar servicios
const initializeServices = async () => {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Inicializar Redis (opcional - no bloquea si falla)
    await createRedisClient();
    
    // Crear admin de emergencia
    await initEmergencyAdmin();
    
    // Iniciar servidor
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`🔧 API Base: http://localhost:${PORT}/api`);
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
    process.exit(1);
  }
};

// Inicializar aplicación
initializeServices();
