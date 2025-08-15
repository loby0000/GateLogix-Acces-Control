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

exports.reemplazarAdmin = async (req, res) => {
  const { usuario, clave } = req.body; // usa los nombres del modelo

  try {
    if (!usuario || !clave) {
      return res.status(400).json({ message: 'Faltan datos: usuario y clave son requeridos' });
    }

    // Buscar admin existente con rol 'admin' (dejando SupA intactos)
    const adminExistente = await Admin.findOne({ rol: 'admin' });

    if (adminExistente) {
      // Eliminar admin existente
      await Admin.deleteOne({ _id: adminExistente._id });
    }

    // Crear nuevo admin
    const hashed = await bcrypt.hash(clave, 10);
    const nuevo = await Admin.create({ usuario, clave: hashed, rol: 'admin' });

    // Guardar log
    await Log.create({
      tipo: 'Creación/Reemplazo de Admin',
      detalle: adminExistente
        ? `Reemplazado ${adminExistente.usuario} por ${usuario}`
        : `Creado nuevo admin ${usuario}`,
      fecha: new Date(),
    });

    res.json({
      message: adminExistente
        ? 'Administrador reemplazado correctamente'
        : 'Administrador creado correctamente',
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};