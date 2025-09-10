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
const initEmergencyAdmin = require('./config/initAdmin');

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

// Ruta base
app.get('/', (req, res) => res.send('API funcionando'));

// Conexión a MongoDB y creación del admin de emergencia
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Conectado a MongoDB');
    await initEmergencyAdmin(); // 👈 Aquí se crea el admin si no existe
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err);
  });
