const UsuarioEquipo = require('../models/UsuarioEquipo');
const Guardia = require('../models/Guardia');
const Log = require('../models/Logs');
const generarCodigoBarras = require('../utils/barcodeGenerator');

exports.registrar = async (req, res) => {
  const {
    tipoUsuario,
    tipoDocumento,
    numeroDocumento,
    email,
    equipo
  } = req.body;

  const idGuardia = req.user.id; // viene del middleware JWT

  try {
    const guardia = await Guardia.findById(idGuardia);
    if (!guardia) {
      return res.status(403).json({ message: 'Guardia no autorizado' });
    }

    const existeDocumento = await UsuarioEquipo.findOne({ numeroDocumento });
    if (existeDocumento) {
      return res.status(409).json({ message: 'Este número de documento ya está registrado' });
    }

    const existeSerial = await UsuarioEquipo.findOne({ 'equipo.serial': equipo.serial });
    if (existeSerial) {
      return res.status(409).json({ message: 'Este serial de equipo ya está registrado' });
    }

    const existeEmail = await UsuarioEquipo.findOne({ email });
    if (existeEmail) {
      return res.status(409).json({ message: 'Este correo ya está registrado' });
    }

    // Generar código de barras (lo guarda en /barcodes del backend)
    const codigoBarrasArchivo = await generarCodigoBarras(numeroDocumento);

    // Crear el registro en Mongo
    const nuevo = await UsuarioEquipo.create({
      tipoUsuario,
      tipoDocumento,
      numeroDocumento,
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
      codigoBarras: codigoBarrasArchivo,
      historialModificaciones: [
        {
          cambios: 'Registro inicial',
          registradoPor: guardia.nombre
        }
      ]
    });

    // Registrar log
    await Log.create({
      tipo: 'Registro Usuario',
      detalle: `Guardia ${guardia.nombre} registró a ${numeroDocumento}`,
    });

    // Respuesta con la URL del backend principal (3000)
    res.status(201).json({
      message: 'Usuario registrado con éxito',
      usuario: nuevo,
      codigoBarrasUrl: `http://localhost:3000/barcodes/${codigoBarrasArchivo}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};
