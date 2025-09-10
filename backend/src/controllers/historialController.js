const Historial = require("../models/Historial");
const UsuarioEquipo = require("../models/UsuarioEquipo");
const Guardia = require("../models/Guardia");
const cacheService = require("../utils/cacheService");
const { invalidarCacheEstadisticas } = require('./estadisticasController');

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

      // 🔹 Invalidar caché de historial y estadísticas
      await Promise.all([
        cacheService.delHistoryPattern(),
        invalidarCacheEstadisticas()
      ]);
      console.log('🗑️  Caché de historial y estadísticas invalidado (salida)');

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

      // 🔹 Invalidar caché de historial y estadísticas
      await Promise.all([
        cacheService.delHistoryPattern(),
        invalidarCacheEstadisticas()
      ]);
      console.log('🗑️  Caché de historial y estadísticas invalidado (entrada)');

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

// 📌 Listar historial con paginación y filtros - OPTIMIZADO con Redis
exports.listarHistorial = async (req, res) => {
  try {
    const { page = 1, limit = 50, usuario, fecha, tipo } = req.query;
    const skip = (page - 1) * limit;

    // 🔹 Generar clave de caché
    const cacheKey = `historial:list:${page}:${limit}:${usuario || ''}:${fecha || ''}:${tipo || ''}`;
    
    // 🔹 Intentar obtener del caché
    const cachedData = await cacheService.getHistory(cacheKey);
    if (cachedData) {
      console.log(`⚡ Cache HIT: Lista historial página ${page}`);
      return res.json(cachedData);
    }

    // 🚀 Construir filtros dinámicos
    const filtros = {};
    if (usuario) filtros["usuario.nombre"] = new RegExp(usuario, "i");
    if (fecha) {
      const fechaInicio = new Date(fecha);
      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaFin.getDate() + 1);
      filtros.createdAt = { $gte: fechaInicio, $lt: fechaFin };
    }
    if (tipo) filtros.tipo = tipo;

    const historial = await Historial.find(filtros)
      .populate("usuario", "nombre numeroDocumento email")
      .populate("guardia", "nombre documento")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .maxTimeMS(5000);

    // 🔹 Guardar en caché por 3 minutos
    await cacheService.setHistory(cacheKey, historial, 180);
    console.log(`💾 Historial guardado en caché: página ${page}`);

    res.json(historial);
  } catch (err) {
    console.error("❌ Error listarHistorial:", err.message);
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
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
