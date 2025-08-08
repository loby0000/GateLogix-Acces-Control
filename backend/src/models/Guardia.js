const mongoose = require('mongoose');

const guardiaSchema = new mongoose.Schema({
  documento: {
    type: String,
    required: true,
    unique: true,
  },
  nombre: {
    type: String,
    required: true,
  },
  jornada: {
    type: String,
    enum: ['mañana', 'tarde', 'noche'],
    required: true,
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo',
  },
  clave: {
    type: String,
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('Guardia', guardiaSchema);
