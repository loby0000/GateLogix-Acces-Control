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
      UsuarioEquipo.findOne({
        $or: [
          { "equipo.serial": serial },
          { "equipos.serial": serial }
        ]
      }, { _id: 1, nombre: 1, numeroDocumento: 1 }).lean().maxTimeMS(3000),
      
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

    // 🎯 Buscar la última entrada sin salida registrada
    const ultimaEntrada = await Historial.findOne({
      usuario: usuario._id,
      serial,
      salida: null
    }).sort({ entrada: -1 }).maxTimeMS(2000);

    const ahora = new Date();

    if (ultimaEntrada) {
      // 🔹 Caso Salida - Actualizar el registro existente con la salida
      ultimaEntrada.salida = ahora;
      ultimaEntrada.estado = "Egreso";
      ultimaEntrada.guardia = guardia._id;
      ultimaEntrada.docGuardia = guardia.documento;
      
      await ultimaEntrada.save();
      
      // Incrementar el contador de registros del guardia y obtener el valor actualizado
      const guardiaActualizado = await Guardia.findByIdAndUpdate(
        guardia._id, 
        { $inc: { registros: 1 } },
        { new: true }
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
        timestamp: ahora,
        guardiaId: guardia._id,
        registros: guardiaActualizado.registros
      });
    } else {
      // 🔹 Caso Entrada - Inserción optimizada
      const nuevoHistorial = new Historial({
        usuario: usuario._id,
        serial,
        entrada: ahora,
        estado: "Ingreso",
        guardia: guardia._id,
        docGuardia: guardia.documento,
      });

      await nuevoHistorial.save();
      
      // Incrementar el contador de registros del guardia y obtener el valor actualizado
      const guardiaActualizado = await Guardia.findByIdAndUpdate(
        guardia._id, 
        { $inc: { registros: 1 } },
        { new: true }
      );

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
        timestamp: ahora,
        guardiaId: guardia._id,
        registros: guardiaActualizado.registros
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
    const { page = 1, limit = 50, usuario, fecha, tipo, t } = req.query;
    const skip = (page - 1) * limit;

    // 🔹 Generar clave de caché fuera del bloque if-else para que esté disponible en todo el método
    const cacheKey = `historial:list:${page}:${limit}:${usuario || ''}:${fecha || ''}:${tipo || ''}`;

    // Si se proporciona un timestamp (t), forzar recarga desde la base de datos
    // Esto permite evitar la caché cuando se solicita una recarga explícita
    if (t) {
      console.log(`🔄 Forzando recarga desde DB con timestamp: ${t}`);
      console.log(`📊 ACTUALIZACIÓN DB HISTORIAL: Invalidando caché para obtener datos frescos`);
      // Invalidar caché de historial antes de continuar
      await cacheService.delHistoryPattern();
      console.log(`🗑️ ACTUALIZACIÓN DB HISTORIAL: Caché invalidada correctamente`);
    } else {
      // 🔹 Intentar obtener del caché
      const cachedData = await cacheService.getHistory(cacheKey);
      if (cachedData) {
        console.log(`⚡ Cache HIT: Lista historial página ${page}`);
        return res.json(cachedData);
      }
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
    
    console.log(`🔍 ACTUALIZACIÓN DB HISTORIAL: Consultando historial en la base de datos - página ${page}, límite ${limit}`);
    console.log(`🔍 ACTUALIZACIÓN DB HISTORIAL: Filtros aplicados: ${JSON.stringify(filtros)}`);

    const historial = await Historial.find(filtros)
      .populate("usuario", "nombre numeroDocumento email")
      .populate("guardia", "nombre documento")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean()
      .maxTimeMS(5000);

    console.log(`📋 ACTUALIZACIÓN DB HISTORIAL: Recuperados ${historial.length} registros de historial de la base de datos`);
    if (historial.length > 0) {
      console.log(`📝 ACTUALIZACIÓN DB HISTORIAL: Primer registro: ${historial[0].tipo} (${new Date(historial[0].createdAt).toLocaleString()}), último registro: ${historial[historial.length-1].tipo} (${new Date(historial[historial.length-1].createdAt).toLocaleString()})`);
    }
    
    // 🔹 Guardar en caché por 3 minutos
    await cacheService.setHistory(cacheKey, historial, 180);
    console.log(`💾 ACTUALIZACIÓN DB HISTORIAL: Historial guardado en caché: página ${page}`);
    console.log(`✅ ACTUALIZACIÓN DB HISTORIAL: Proceso completado - ${historial.length} registros actualizados de la base de datos`);

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
    const usuario = await UsuarioEquipo.findOne({
      $or: [
        { "equipo.serial": serial },
        { "equipos.serial": serial }
      ]
    }, { _id: 1, nombre: 1, numeroDocumento: 1 }).lean().maxTimeMS(2000);

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
        estado: "Egreso",
        ultimoMovimiento: null,
        usuario: {
          nombre: usuario.nombre,
          numeroDocumento: usuario.numeroDocumento
        }
      });
    }

    // 🎯 Determinar estado basado en el último registro
    let estado, ultimoMovimiento;
    
    // Si el último registro es de tipo salida o tiene salida registrada, está afuera
    if (ultimoHistorial.salida) {
      estado = "Egreso";
      ultimoMovimiento = ultimoHistorial.salida;
    } else {
      // Si el último registro es de tipo entrada, está adentro
      estado = "Ingreso";
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

// 📌 Obtener historial completo por serial de equipo
exports.historialPorSerial = async (req, res) => {
  try {
    const { serial } = req.params;
    
    console.log(`🔍 Buscando historial para equipo con serial: ${serial}`);
    
    // Buscar historial por serial del equipo
    const historial = await Historial.find({ serial: serial })
      .populate("usuario", "nombre numeroDocumento email")
      .populate("guardia", "nombre documento")
      .sort({ createdAt: -1 })
      .lean()
      .maxTimeMS(5000);
    
    if (!historial || historial.length === 0) {
      return res.status(404).json({ 
        msg: "No se encontró historial para este equipo",
        serial: serial 
      });
    }
    
    console.log(`📋 Encontrados ${historial.length} registros de historial para el equipo ${serial}`);
    
    res.json(historial);
  } catch (err) {
    console.error("❌ Error historialPorSerial:", err.message);
    res.status(500).json({ msg: "Error en el servidor", error: err.message });
  }
};
