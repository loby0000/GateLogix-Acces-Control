const mongoose = require('mongoose');

const usuarioEquipoSchema = new mongoose.Schema({
  tipoUsuario: {
    type: String,
    enum: ['Personal de planta', 'Visitante', 'Instructor', 'Aprendiz'],
    required: true
  },
  tipoDocumento: {
    type: String,
    enum: ['Cédula De Ciudadanía', 'Cédula De Extranjería', 'Tarjeta De Identidad'],
    required: true
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio'],
    trim: true,               // 👈 elimina espacios al inicio y final
    minlength: [3, 'El nombre debe tener al menos 3 caracteres'],
    maxlength: [100, 'El nombre no puede exceder 100 caracteres'],
    set: v => v.charAt(0).toUpperCase() + v.slice(1).toLowerCase() 
    // 👆 transforma: primera mayúscula, resto minúsculas
  },
  numeroDocumento: {
  type: String,
  required: [true, 'El número de documento es obligatorio'],
  unique: true,
  minlength: [10, 'El documento debe tener 10 dígitos'],
  maxlength: [10, 'El documento debe tener 10 dígitos'],
  match: [/^\d{10}$/, 'El documento debe contener solo números (10 dígitos)']
  
  },
  email: {
    type: String,
    required: [true, 'El correo es obligatorio'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'El correo no es válido'] // Validación regex
  },
  equipo: {
    serial: {
      type: String,
      required: [true, 'El serial es obligatorio'],
      unique: true
    },
    marca: { type: String, trim: true },
    caracteristicas: { type: String, trim: true },
    accesorios: {
      mouse: { type: Boolean, default: false },
      cargador: { type: Boolean, default: false }
    }
  },
  equipos: [{
    serial: {
      type: String,
      required: [true, 'El serial es obligatorio']
    },
    marca: { type: String, trim: true },
    caracteristicas: { type: String, trim: true },
    accesorios: {
      mouse: { type: Boolean, default: false },
      cargador: { type: Boolean, default: false }
    },
    foto: {
      type: String, // Almacenará la imagen en formato base64
      default: null
    }
  }],
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
  foto: {
    type: String, // Almacenará la imagen en formato base64
    default: null
  },
  historialModificaciones: [
    {
      fecha: { type: Date, default: Date.now },
      cambios: String,
      registradoPor: { type: String }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('UsuarioEquipo', usuarioEquipoSchema);
