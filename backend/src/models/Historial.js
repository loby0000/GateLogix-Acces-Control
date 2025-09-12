// backend/src/models/Historial.js
const mongoose = require('mongoose');

const historialSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsuarioEquipo',
    required: true
  },
  serial: { type: String, default: '' },
  entrada: { type: Date, default: Date.now },
  salida: { type: Date, default: null },
  guardia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guardia'
  },
  docGuardia: { type: String, default: '' },
  estado: {
    type: String,
    enum: ['Ingreso', 'Egreso'],
    default: 'Ingreso'
  }
}, { timestamps: true });

module.exports = mongoose.model('Historial', historialSchema);
