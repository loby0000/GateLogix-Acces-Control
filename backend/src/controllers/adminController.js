// Crear nuevo admin y eliminar anteriores
exports.crearAdmin = async (req, res) => {
  try {
    const { usuario, clave } = req.body; // 'usuario' aquí puede venir del campo 'documento' del frontend

    if (!usuario || !clave) {
      return res.status(400).json({ mensaje: 'Usuario y clave son obligatorios' });
    }

    // Eliminar todos los admins anteriores
    await Admin.deleteMany({});

    const hashedClave = await bcrypt.hash(clave, 10);

    const nuevoAdmin = new Admin({ usuario, clave: hashedClave });
    await nuevoAdmin.save();

    res.status(201).json({
      mensaje: 'Administrador creado correctamente, los anteriores fueron eliminados',
      admin: {
        usuario: nuevoAdmin.usuario,
        rol: nuevoAdmin.rol
      }
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al crear el admin', error });
  }
};
