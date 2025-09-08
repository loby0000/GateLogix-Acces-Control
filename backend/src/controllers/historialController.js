const Historial = require("../models/Historial");
const UsuarioEquipo = require("../models/UsuarioEquipo");
const Guardia = require("../models/Guardia");

// 📌 Registrar entrada o salida
exports.registrarMovimiento = async (req, res) => {
  try {
    const { serial, docGuardia } = req.body;

    // 1️⃣ Verificar usuario por serial
    const usuario = await UsuarioEquipo.findOne({ "equipo.serial": serial });
    if (!usuario) {
      return res.status(404).json({ msg: "Usuario no encontrado con ese serial" });
    }

    // 2️⃣ Verificar guardia
    const guardia = await Guardia.findOne({ documento: docGuardia });
    if (!guardia) {
      return res.status(404).json({ msg: "Guardia no encontrado" });
    }

    // 3️⃣ Buscar si el usuario ya tiene entrada abierta (estado "Adentro")
    let historial = await Historial.findOne({
      usuario: usuario._id,
      serial,
      salida: null,
      estado: "Adentro",
    });

    if (historial) {
      // 🔹 Caso Salida
      historial.salida = new Date();
      historial.estado = "Afuera";
      historial.guardia = guardia._id;
      historial.docGuardia = guardia.documento;
      await historial.save();

      return res.json({ msg: "✅ Salida registrada", historial });
    } else {
      // 🔹 Caso Entrada
      historial = new Historial({
        usuario: usuario._id,
        serial,
        entrada: new Date(),
        estado: "Adentro",
        guardia: guardia._id,
        docGuardia: guardia.documento,
      });

      await historial.save();

      return res.json({ msg: "✅ Entrada registrada", historial });
    }
  } catch (err) {
    console.error("❌ Error registrarMovimiento:", err);
    res.status(500).json({ msg: "Error en el servidor" });
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
