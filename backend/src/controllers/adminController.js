const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const Log = require('../models/Logs'); // lo creamos luego

// Iniciar sesión
exports.login = async (req, res) => {
  const { usuario, clave } = req.body;

  try {
    const admin = await Admin.findOne({ usuario });
    if (!admin) return res.status(404).json({ message: 'Usuario no encontrado' });

    const match = await bcrypt.compare(clave, admin.clave);
    if (!match) return res.status(401).json({ message: 'Clave incorrecta' });

    // Generar token
    const token = jwt.sign(
      { id: admin._id, usuario: admin.usuario, rol: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Reemplazar admin (excepto el de emergencia)
exports.reemplazarAdmin = async (req, res) => {
  const { usuarioAnterior, claveAnterior, nuevoUsuario, nuevaClave } = req.body;

  try {
    const admin = await Admin.findOne({ usuario: usuarioAnterior });
    if (!admin || admin.esEmergencia)
      return res.status(403).json({ message: 'No se puede reemplazar este administrador' });

    const valido = await bcrypt.compare(claveAnterior, admin.clave);
    if (!valido)
      return res.status(401).json({ message: 'Credenciales incorrectas' });

    // Eliminar admin anterior
    await Admin.deleteMany({ esEmergencia: false });

    // Crear nuevo admin
    const hashed = await bcrypt.hash(nuevaClave, 10);
    const nuevo = await Admin.create({ usuario: nuevoUsuario, clave: hashed });

    // Guardar log
    await Log.create({
      tipo: 'Cambio de Admin',
      detalle: `Reemplazado ${usuarioAnterior} por ${nuevoUsuario}`,
      fecha: new Date(),
    });

    res.json({ message: 'Administrador reemplazado correctamente' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
