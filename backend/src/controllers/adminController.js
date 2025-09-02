const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../models/admin');
const Log = require('../models/Logs');

// Iniciar sesión
exports.login = async (req, res) => {
  const { usuario, clave } = req.body;

  try {
    const admin = await Admin.findOne({ usuario });
    if (!admin) return res.status(404).json({ message: 'Usuario no encontrado' });

    const match = await bcrypt.compare(clave, admin.clave);
    if (!match) return res.status(401).json({ message: 'Clave incorrecta' });

    // Generar token con rol
    const token = jwt.sign(
      { id: admin._id, usuario: admin.usuario, rol: admin.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Reemplazar o crear admin (manteniendo SupA intocable)
exports.reemplazarAdmin = async (req, res) => {
  const { usuario, clave, nombre, documento, usuarioExistente, claveExistente } = req.body;

  try {
    // Validar credenciales del admin existente
    const adminExistente = await Admin.findOne({ usuario: usuarioExistente });
    if (!adminExistente) return res.status(404).json({ message: 'Admin existente no encontrado' });

    const match = await bcrypt.compare(claveExistente, adminExistente.clave);
    if (!match) return res.status(401).json({ message: 'Clave del admin existente incorrecta' });

    // Validar que la nueva clave y usuario estén presentes
    if (!usuario || !clave) {
      return res.status(400).json({ message: 'Debe enviar usuario y clave del nuevo admin' });
    }

    // Hashear la nueva clave
    const hashed = await bcrypt.hash(clave, 10);

    // Eliminar todos los admins que no sean SupA
    await Admin.deleteMany({ rol: 'admin' });

    // Crear el nuevo admin
    const nuevoAdmin = await Admin.create({
      usuario,
      clave: hashed,
      rol: 'admin',
      nombre,
      documento
    });

    // Guardar log
    await Log.create({
      tipo: 'Cambio de Admin',
      detalle: `Se reemplazaron los administradores por ${usuario}`,
      fecha: new Date(),
    });

    res.json({ message: 'Administrador reemplazado correctamente (SupA preservado)', admin: nuevoAdmin });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
