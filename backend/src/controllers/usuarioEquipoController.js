const UsuarioEquipo = require('../models/UsuarioEquipo');
const Guardia = require('../models/Guardia');
const Log = require('../models/Logs');
const generarCodigoBarras = require('../utils/barcodeGenerator'); // 👈 lo creamos luego

exports.registrar = async (req, res) => {
  const {
    tipoUsuario,
    tipoDocumento,
    numeroDocumento,
    email,
    equipo
  } = req.body;

  const idGuardia = req.user.id; // 👈 viene del middleware JWT

  try {
    // Validar que el guardia existe
    const guardia = await Guardia.findById(idGuardia);
    if (!guardia) return res.status(403).json({ message: 'Guardia no autorizado' });

    // Validar duplicados
    const existeDocumento = await UsuarioEquipo.findOne({ numeroDocumento });
    if (existeDocumento)
      return res.status(409).json({ message: 'Este número de documento ya está registrado' });

    const existeSerial = await UsuarioEquipo.findOne({ 'equipo.serial': equipo.serial });
    if (existeSerial)
      return res.status(409).json({ message: 'Este serial de equipo ya está registrado' });

    const existeEmail = await UsuarioEquipo.findOne({ email });
    if (existeEmail)
      return res.status(409).json({ message: 'Este correo ya está registrado' });

    // Generar código de barras
    const codigoBarras = await generarCodigoBarras(numeroDocumento); // imagen o base64

    // Crear usuario con equipo
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
          mouse: equipo.accesorios && equipo.accesorios.mouse || false,
          cargador: equipo.accesorios && equipo.accesorios.cargador || false
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

   res.status(201).json({
  message: 'Usuario registrado con éxito',
  usuario: nuevo,
  codigoBarrasUrl: `http://localhost:5001/barcodes/${numeroDocumento}.png`
});


  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
};
