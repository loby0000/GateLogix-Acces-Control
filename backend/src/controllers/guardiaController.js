const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Guardia = require('../models/Guardia');
const Admin = require('../models/admin');
const Log = require('../models/Logs');

const generateBarcode = require('../utils/generateBarcode'); // tu función que genera código de barras

// Iniciar sesión (guardia)
exports.login = async (req, res) => {
  const { documento, clave } = req.body;

  try {
    const guardia = await Guardia.findOne({ documento });
    if (!guardia) return res.status(404).json({ message: 'Documento no encontrado' });

    const match = await bcrypt.compare(clave, guardia.clave);
    if (!match) return res.status(401).json({ message: 'Clave incorrecta' });

    const token = jwt.sign(
      { id: guardia._id, documento: guardia.documento, rol: 'guardia' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Error en login de guardia:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Registrar guardia (autenticación admin requerida)
exports.registrar = async (req, res) => {
  const { documento, nombre, jornada, claveGuardia, usuarioAdmin, claveAdmin } = req.body;

  try {
    const admin = await Admin.findOne({ usuario: usuarioAdmin });
    if (!admin) return res.status(404).json({ message: 'Admin no encontrado' });

    const validaClave = await bcrypt.compare(claveAdmin, admin.clave);
    if (!validaClave) return res.status(401).json({ message: 'Credenciales de admin incorrectas' });

    const hashed = await bcrypt.hash(claveGuardia, 10);

    const guardia = await Guardia.create({
      documento,
      nombre,
      jornada,
      clave: hashed
    });

    await Log.create({
      tipo: 'Registro de guardia',
      detalle: `Guardia ${nombre} (${documento}) registrado por ${usuarioAdmin}`,
    });

    res.json({ message: 'Guardia registrado exitosamente', guardia });
  } catch (err) {
    console.error('Error al registrar guardia:', err);
    res.status(500).json({ message: 'Error al registrar guardia' });
  }
};

// Registrar usuario con equipo y generar código de barras
exports.registrarUsuarioConEquipo = async (req, res) => {
  const { nombre, documento, tipoEquipo, serialEquipo } = req.body;

  try {
    // Guardar usuario y su equipo
    const usuario = await Usuario.create({
      nombre,
      documento,
      tipoEquipo,
      serialEquipo
    });

    // Generar el código de barras usando el serial o documento como identificador
    const filePath = await generateBarcode(serialEquipo);

    await Log.create({
      tipo: 'Registro de usuario con equipo',
      detalle: `Usuario ${nombre} (${documento}) registrado con equipo ${serialEquipo}`
    });

    res.json({
      message: 'Usuario y equipo registrados exitosamente',
      usuario,
      codigoBarras: filePath // ruta donde se guardó el código
    });
  } catch (err) {
    console.error('Error al registrar usuario con equipo:', err);
    res.status(500).json({ message: 'Error al registrar usuario con equipo' });
  }
};
