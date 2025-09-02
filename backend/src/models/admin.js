const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  usuario: {
    type: String,
    required: true,
    unique: true
  },
  clave: {
    type: String,
    required: true
  },
  rol: {
    type: String,   
    enum: ['admin', 'SupA'],  // Roles permitidos
    default: 'admin'
  },
  esEmergencia: {  // Identifica admin de emergencia
    type: Boolean,
    default: false
  },
  nombre: {        // 👈 campo nuevo (como aparece en el Vue)
    type: String,
    required: true
  },
  documento: {     // 👈 campo nuevo (como aparece en el Vue)
    type: String,
    required: true,
    unique: true
  }
});

module.exports = mongoose.model('Admin', adminSchema);
