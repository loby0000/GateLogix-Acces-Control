// backend/src/controllers/usuarioEquipoController.js
const UsuarioEquipo = require('../models/UsuarioEquipo');
const Guardia = require('../models/Guardia');
const Log = require('../models/Logs');
const { generarCodigoBarras } = require('../utils/barcodeGenerator'); // ✅ Importación corregida

exports.registrar = async (req, res) => {
  const { tipoUsuario, tipoDocumento, numeroDocumento, nombre, email, equipo } = req.body;
  const idGuardia = req.user.id; // 👈 viene del middleware JWT

  try {
    // 🔹 Validaciones básicas
    if (!tipoUsuario) return res.status(400).json({ message: "El tipo de usuario es obligatorio" });
    if (!tipoDocumento) return res.status(400).json({ message: "El tipo de documento es obligatorio" });
    if (!numeroDocumento) return res.status(400).json({ message: "El número de documento es obligatorio" });
    if (!/^\d{10}$/.test(numeroDocumento)) {
      return res.status(400).json({ message: "El documento debe tener exactamente 10 dígitos numéricos" });
    }
    if (!nombre) return res.status(400).json({ message: "El nombre es obligatorio" });
    if (!email) return res.status(400).json({ message: "El correo es obligatorio" });

    // 🔹 Validar equipo
    if (!equipo) return res.status(400).json({ message: "Los datos del equipo son obligatorios" });
    if (!equipo.serial) return res.status(400).json({ message: "El serial del equipo es obligatorio" });
    if (!equipo.marca) return res.status(400).json({ message: "La marca del equipo es obligatoria" });

    // Validar que el guardia existe
    const guardia = await Guardia.findById(idGuardia);
    if (!guardia) return res.status(403).json({ message: 'Guardia no autorizado' });

    // Validar duplicados
    if (await UsuarioEquipo.findOne({ numeroDocumento }))
      return res.status(409).json({ message: 'Este número de documento ya está registrado' });

    if (await UsuarioEquipo.findOne({ 'equipo.serial': equipo.serial }))
      return res.status(409).json({ message: 'Este serial de equipo ya está registrado' });

    if (await UsuarioEquipo.findOne({ email }))
      return res.status(409).json({ message: 'Este correo ya está registrado' });

    // 🔹 URL de referencia (no se usa en el código de barras, solo informativa)
    const frontendUrl = `http://localhost:8080/#/RegistroUsuariosYaResg?serial=${equipo.serial}`;

    // 🔹 Generar código de barras SOLO con el serial (más corto y legible)
    const codigoBarras = await generarCodigoBarras(equipo.serial);

    // Crear usuario con equipo
    const nuevo = await UsuarioEquipo.create({
      tipoUsuario,
      tipoDocumento,
      numeroDocumento,
      nombre,
      email,
      equipo: {
        serial: equipo.serial,
        marca: equipo.marca,
        caracteristicas: equipo.caracteristicas,
        accesorios: {
          mouse: equipo.accesorios?.mouse || false,
          cargador: equipo.accesorios?.cargador || false
        }
      },
      guardiaRegistrador: guardia._id,
      codigoBarras,
      historialModificaciones: [
        {
          cambios: 'Registro inicial',
          registradoPor: guardia.nombre
        }
      ]
    });

    // Log opcional
    await Log.create({
      tipo: 'Registro Usuario',
      detalle: `Guardia ${guardia.nombre} registró a ${numeroDocumento}`,
    });

    // 🚀 Respuesta
    res.status(201).json({
      message: 'Usuario registrado con éxito',
      usuario: nuevo,
      codigoBarrasBase64: codigoBarras.replace(/^data:image\/png;base64,/, ""), // 👈 limpio
      urlReferencia: frontendUrl // 👈 la mando aparte por si la necesitas
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al registrar usuario', error: err.message });
  }
};

exports.buscarPorSerial = async (req, res) => {
  try {
    console.log("=== Buscando usuario por serial ===");
    console.log("Headers recibidos:", req.headers);
    console.log("Parámetros recibidos:", req.params);

    const { serial } = req.params;
    if (!serial) {
      console.warn("No se recibió serial");
      return res.status(400).json({ message: "Debe enviar un serial" });
    }

    const usuario = await UsuarioEquipo.findOne({ "equipo.serial": serial })
      .populate("guardiaRegistrador", "nombre email");

    if (!usuario) {
      console.warn("Usuario no encontrado con serial:", serial);
      return res.status(404).json({ message: "No se encontró ningún registro con ese serial" });
    }

    console.log("Usuario encontrado:", usuario);
    res.json(usuario);

  } catch (err) {
    console.error("Error en buscarPorSerial:", err);
    res.status(500).json({ message: "Error en la búsqueda", error: err.message });
  }
};

exports.buscarPorDocumento = async (req, res) => {
  try {
    console.log("=== Buscando usuario por documento ===");
    console.log("Headers recibidos:", req.headers);
    console.log("Parámetros recibidos:", req.params);

    const { numeroDocumento } = req.params;
    if (!numeroDocumento) {
      console.warn("No se recibió número de documento");
      return res.status(400).json({ message: "Debe enviar un número de documento" });
    }

    const usuario = await UsuarioEquipo.findOne({ numeroDocumento })
      .populate("guardiaRegistrador", "nombre email");

    if (!usuario) {
      console.warn("Usuario no encontrado con documento:", numeroDocumento);
      return res.status(404).json({ message: "No se encontró ningún registro con ese documento" });
    }

    console.log("Usuario encontrado:", usuario);
    res.json(usuario);

  } catch (err) {
    console.error("Error en buscarPorDocumento:", err);
    res.status(500).json({ message: "Error en la búsqueda", error: err.message });
  }
};
