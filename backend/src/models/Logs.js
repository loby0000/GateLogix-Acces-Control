
// src/models/Log.js
const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  tipo: String,
  detalle: String,
  fecha: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

module.exports = mongoose.model('Log', logSchema);
