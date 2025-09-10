const Historial = require("../models/Historial");
const UsuarioEquipo = require("../models/UsuarioEquipo");
const Guardia = require("../models/Guardia");

// 📌 Registrar entrada o salida - OPTIMIZADO para alta concurrencia
exports.registrarMovimiento = async (req, res) => {
  try {
    const { serial, docGuardia } = req.body;

    // 🚀 Consultas paralelas para mejor rendimiento
    const [usuario, guardia] = await Promise.all([
      UsuarioEquipo.findOne(
        { "equipo.serial": serial },
        { _id: 1, nombre: 1, numeroDocumento: 1 }
      ).lean().maxTimeMS(3000),
      
      Guardia.findOne(
        { documento: docGuardia },
        { _id: 1, documento: 1, nombre: 1 }
      ).lean().maxTimeMS(3000)
    ]);

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado con ese serial" });
    }
    if (!guardia) {
      return res.status(404).json({ msg: "Guardia no encontrado" });
    }

    // 🎯 Buscar entrada activa con índice optimizado
    let historial = await Historial.findOne({
      usuario: usuario._id,
      serial,
      estado: "Adentro",
      salida: null
    }).maxTimeMS(2000);

    const ahora = new Date();

    if (historial) {
      // 🔹 Caso Salida - Actualización atómica
      await Historial.updateOne(
        { _id: historial._id },
        {
          $set: {
            salida: ahora,
            estado: "Afuera",
            guardia: guardia._id,
            docGuardia: guardia.documento
          }
        }
      );

      return res.json({ 
        msg: "✅ Salida registrada", 
        tipo: "salida",
        usuario: usuario.nombre,
        timestamp: ahora
      });
    } else {
      // 🔹 Caso Entrada - Inserción optimizada
      const nuevoHistorial = new Historial({
        usuario: usuario._id,
        serial,
        entrada: ahora,
        estado: "Adentro",
        guardia: guardia._id,
        docGuardia: guardia.documento,
      });

      await nuevoHistorial.save();

      return res.json({ 
        msg: "✅ Entrada registrada", 
        tipo: "entrada",
        usuario: usuario.nombre,
        timestamp: ahora
      });
    }
  } catch (err) {
    console.error("❌ Error registrarMovimiento:", err.message);
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
};

// 📌 Listar todos los registros
exports.listarHistorial = async (req, res) => {
  try {
    const historial = await Historial.find()
      .populate("usuario", "nombre numeroDocumento email")
      .populate("guardia", "nombre documento")
      .sort({ createdAt: -1 });

    res.json(historial);
  } catch (err) {
    console.error("❌ Error listarHistorial:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};

// 📌 Obtener estado actual del usuario por serial - ULTRA OPTIMIZADO
exports.obtenerEstadoPorSerial = async (req, res) => {
  try {
    const { serial } = req.params;

    // 🚀 Primero buscar usuario por serial
    const usuario = await UsuarioEquipo.findOne(
      { "equipo.serial": serial },
      { _id: 1, nombre: 1, numeroDocumento: 1 }
    ).lean().maxTimeMS(2000);

    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado con ese serial" });
    }

    // 🎯 Buscar último historial usando el ID del usuario
    const ultimoHistorial = await Historial.findOne(
      { usuario: usuario._id },
      { estado: 1, entrada: 1, salida: 1, guardia: 1, createdAt: 1 }
    )
    .sort({ createdAt: -1 })
    .populate("guardia", "nombre documento")
    .lean()
    .maxTimeMS(2000);

    if (!ultimoHistorial) {
      // 🎯 Respuesta rápida para usuarios sin historial
      return res.json({
        estado: "Afuera",
        ultimoMovimiento: null,
        usuario: {
          nombre: usuario.nombre,
          numeroDocumento: usuario.numeroDocumento
        }
      });
    }

    // 🎯 Determinar estado basado en si tiene salida registrada
    let estado, ultimoMovimiento;
    
    if (ultimoHistorial.salida) {
      // Si tiene salida registrada, está afuera
      estado = "Afuera";
      ultimoMovimiento = ultimoHistorial.salida;
    } else {
      // Si no tiene salida, está adentro
      estado = "Adentro";
      ultimoMovimiento = ultimoHistorial.entrada;
    }

    res.json({
      estado,
      ultimoMovimiento,
      usuario: {
        nombre: usuario.nombre,
        numeroDocumento: usuario.numeroDocumento
      },
      guardia: ultimoHistorial.guardia
    });

  } catch (err) {
    console.error("❌ Error obtenerEstadoPorSerial:", err.message);
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
};

// 📌 Buscar historial por documento de usuario
exports.buscarPorDocumento = async (req, res) => {
  try {
    const { documento } = req.params;

    const usuario = await UsuarioEquipo.findOne({ numeroDocumento: documento });
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado" });
    }

    const historial = await Historial.find({ usuario: usuario._id })
      .populate("usuario", "nombre numeroDocumento email")
      .populate("guardia", "nombre documento")
      .sort({ createdAt: -1 });

    res.json(historial);
  } catch (err) {
    console.error("❌ Error buscarPorDocumento:", err);
    res.status(500).json({ msg: "Error en el servidor" });
  }
};
