const UsuarioEquipo = require('../models/UsuarioEquipo');
const Historial = require('../models/Historial');
const Guardia = require('../models/Guardia');
const cacheService = require('../utils/cacheService');

// 📊 Obtener estadísticas del dashboard - OPTIMIZADO con caché
exports.obtenerEstadisticasDashboard = async (req, res) => {
  try {
    const cacheKey = 'dashboard:stats';
    
    // 🚀 Intentar obtener del caché
    const cachedStats = await cacheService.getUser(cacheKey);
    if (cachedStats) {
      console.log('📊 Estadísticas obtenidas del caché');
      return res.json(cachedStats);
    }

    console.log('📊 Calculando estadísticas desde la base de datos...');
    
    // Obtener fecha actual para filtros
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(inicioHoy.getTime() + 24 * 60 * 60 * 1000);

    // 🚀 Consultas paralelas para mejor rendimiento
    const [usuariosActivos, guardiasActivos, entradasHoy, salidasHoy, usuariosAdentro] = await Promise.all([
      // Total de usuarios registrados
      UsuarioEquipo.countDocuments(),
      
      // Guardias activos
      Guardia.countDocuments({ estado: 'activo' }),
      
      // Entradas del día
      Historial.countDocuments({
        entrada: { $gte: inicioHoy, $lt: finHoy }
      }),
      
      // Salidas del día
      Historial.countDocuments({
        salida: { $gte: inicioHoy, $lt: finHoy }
      }),
      
      // Usuarios actualmente adentro
      Historial.countDocuments({
        estado: 'Adentro',
        salida: null
      })
    ]);

    // Preparar respuesta
    const estadisticas = {
      usuariosActivos,
      guardiasActivos,
      entradasDia: entradasHoy,
      salidasDia: salidasHoy,
      usuariosAdentro,
      timestamp: new Date().toISOString()
    };

    // 💾 Guardar en caché por 2 minutos (las estadísticas cambian frecuentemente)
    await cacheService.setUser(cacheKey, estadisticas, 120);
    console.log('💾 Estadísticas guardadas en caché por 2 minutos');

    res.json(estadisticas);
  } catch (err) {
    console.error('❌ Error al obtener estadísticas:', err);
    res.status(500).json({ msg: 'Error en el servidor', error: err.message });
  }
};

// 📊 Obtener estadísticas mensuales - OPTIMIZADO con caché
exports.obtenerEstadisticasMensuales = async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const cacheKey = `stats:monthly:${year}`;
    
    // 🚀 Intentar obtener del caché
    const cachedStats = await cacheService.getUser(cacheKey);
    if (cachedStats) {
      console.log(`📊 Estadísticas mensuales ${year} obtenidas del caché`);
      return res.json(cachedStats);
    }

    console.log(`📊 Calculando estadísticas mensuales para ${year}...`);
    
    // Crear array para almacenar estadísticas por mes
    const estadisticasMensuales = [];
    
    // Procesar cada mes del año
    for (let mes = 0; mes < 12; mes++) {
      const inicioMes = new Date(year, mes, 1);
      const finMes = new Date(year, mes + 1, 1);
      
      // Consultas paralelas para cada mes
      const [entradas, salidas] = await Promise.all([
        Historial.countDocuments({
          entrada: { $gte: inicioMes, $lt: finMes }
        }),
        Historial.countDocuments({
          salida: { $gte: inicioMes, $lt: finMes }
        })
      ]);
      
      estadisticasMensuales.push({
        mes: mes + 1,
        nombreMes: new Date(year, mes).toLocaleString('es-ES', { month: 'long' }),
        entradas,
        salidas
      });
    }

    const resultado = {
      year: parseInt(year),
      meses: estadisticasMensuales,
      timestamp: new Date().toISOString()
    };

    // 💾 Guardar en caché por 1 hora (estadísticas históricas cambian poco)
    await cacheService.setUser(cacheKey, resultado, 3600);
    console.log(`💾 Estadísticas mensuales ${year} guardadas en caché por 1 hora`);

    res.json(resultado);
  } catch (err) {
    console.error('❌ Error al obtener estadísticas mensuales:', err);
    res.status(500).json({ msg: 'Error en el servidor', error: err.message });
  }
};

// 📊 Obtener estadísticas de guardias - OPTIMIZADO con caché
exports.obtenerEstadisticasGuardias = async (req, res) => {
  try {
    const cacheKey = 'stats:guardias';
    
    // 🚀 Intentar obtener del caché
    const cachedStats = await cacheService.getGuard(cacheKey);
    if (cachedStats) {
      console.log('📊 Estadísticas de guardias obtenidas del caché');
      return res.json(cachedStats);
    }

    console.log('📊 Calculando estadísticas de guardias...');
    
    // 🚀 Consultas paralelas
    const [totalGuardias, guardiasActivos, guardiasInactivos, guardiasPorJornada] = await Promise.all([
      Guardia.countDocuments(),
      Guardia.countDocuments({ estado: 'activo' }),
      Guardia.countDocuments({ estado: 'inactivo' }),
      Guardia.aggregate([
        {
          $group: {
            _id: '$jornada',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Calcular porcentaje de guardias activos
    const porcentajeActivos = totalGuardias > 0 ? Math.round((guardiasActivos / totalGuardias) * 100) : 0;

    const estadisticas = {
      totalGuardias,
      guardiasActivos,
      guardiasInactivos,
      porcentajeActivos,
      guardiasPorJornada: guardiasPorJornada.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    };

    // 💾 Guardar en caché por 5 minutos
    await cacheService.setGuard(cacheKey, estadisticas, 300);
    console.log('💾 Estadísticas de guardias guardadas en caché por 5 minutos');

    res.json(estadisticas);
  } catch (err) {
    console.error('❌ Error al obtener estadísticas de guardias:', err);
    res.status(500).json({ msg: 'Error en el servidor', error: err.message });
  }
};

// 📊 Invalidar caché de estadísticas (útil cuando se registran nuevos movimientos)
exports.invalidarCacheEstadisticas = async () => {
  try {
    // Invalidar cachés relacionados con estadísticas
    await Promise.all([
      cacheService.delUserPattern('dashboard:*'),
      cacheService.delUserPattern('stats:*'),
      cacheService.delGuardPattern('stats:*')
    ]);
    console.log('🗑️ Caché de estadísticas invalidado');
  } catch (err) {
    console.error('❌ Error invalidando caché de estadísticas:', err);
  }
};

// 📊 Obtener resumen de actividad reciente - OPTIMIZADO con caché
exports.obtenerActividadReciente = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const cacheKey = `activity:recent:${limit}`;
    
    // 🚀 Intentar obtener del caché
    const cachedActivity = await cacheService.getUser(cacheKey);
    if (cachedActivity) {
      console.log('📊 Actividad reciente obtenida del caché');
      return res.json(cachedActivity);
    }

    console.log('📊 Obteniendo actividad reciente...');
    
    // Obtener últimos movimientos
    const actividadReciente = await Historial.find()
      .populate('usuario', 'nombre numeroDocumento')
      .populate('guardia', 'nombre documento')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    const resultado = {
      actividades: actividadReciente.map(actividad => ({
        id: actividad._id,
        usuario: actividad.usuario?.nombre || 'Usuario desconocido',
        documento: actividad.usuario?.numeroDocumento || 'N/A',
        guardia: actividad.guardia?.nombre || 'Guardia desconocido',
        tipo: actividad.salida ? 'Salida' : 'Entrada',
        fecha: actividad.salida || actividad.entrada,
        estado: actividad.estado,
        serial: actividad.serial
      })),
      timestamp: new Date().toISOString()
    };

    // 💾 Guardar en caché por 1 minuto (actividad reciente cambia frecuentemente)
    await cacheService.setUser(cacheKey, resultado, 60);
    console.log('💾 Actividad reciente guardada en caché por 1 minuto');

    res.json(resultado);
  } catch (err) {
    console.error('❌ Error al obtener actividad reciente:', err);
    res.status(500).json({ msg: 'Error en el servidor', error: err.message });
  }
};