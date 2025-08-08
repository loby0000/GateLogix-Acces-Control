const mongoose = require('mongoose');

const usuarioEquipoSchema = new mongoose.Schema({
  tipoUsuario: {
    type: String,
    enum: ['empleado', 'visitante', 'otro'],
    required: true
  },
  tipoDocumento: {
    type: String,
    enum: ['DNI', 'pasaporte', 'otro'],
    required: true
  },
  numeroDocumento: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^\S+@\S+\.\S+$/  // Validación de formato
  },
  equipo: {
    serial: {
      type: String,
      required: true,
      unique: true
    },
    marca: String,
    caracteristicas: String,
    accesorios: {
      mouse: { type: Boolean, default: false },
      cargador: { type: Boolean, default: false }
    }
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  guardiaRegistrador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guardia'
  },
  codigoBarras: {
    type: String // ruta del archivo o string base64 (según implementación)
  },
  historialModificaciones: [
    {
      fecha: { type: Date, default: Date.now },
      cambios: String,
      registradoPor: { type: String } // Puede ser usuario o ID del admin/guardia
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('UsuarioEquipo', usuarioEquipoSchema);
