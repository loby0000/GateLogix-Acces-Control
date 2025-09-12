const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Guardia = require('../models/Guardia');
const Admin = require('../models/admin');
const Log = require('../models/Logs');
const cacheService = require('../utils/cacheService');


const generateBarcode = require('../utils/barcodeGenerator.js'); // tu función que genera código de barras

// Iniciar sesión (guardia)
exports.login = async (req, res) => {
  const { documento, clave } = req.body;

  try {
    // 🚀 Intentar obtener guardia del caché primero
    const cacheKey = `guard:doc:${documento}`;
    let guardia = await cacheService.get(cacheKey);
    
    if (!guardia) {
      // Si no está en caché, buscar en BD
      guardia = await Guardia.findOne({ documento }).lean();
      if (!guardia) return res.status(404).json({ message: 'Documento no encontrado' });
      
      // 💾 Guardar en caché por 15 minutos
      await cacheService.setGuard(cacheKey, guardia, 900);
      console.log(`💾 Guardia guardado en caché: ${documento}`);
    } else {
      console.log(`✅ Guardia encontrado en caché: ${documento}`);
    }
    
    if (!guardia) return res.status(404).json({ message: 'Documento no encontrado' });

    // Verificar si el guardia está activo
    if (guardia.estado === 'inactivo') {
      return res.status(403).json({ message: 'Guardia inactivo. Acceso denegado.' });
    }

    // Validar jornada del guardia en la base de datos
    const jornadasValidas = ['mañana', 'tarde', 'noche'];
    const jornadaGuardia = (guardia.jornada || '').trim().toLowerCase();
    if (!jornadasValidas.includes(jornadaGuardia)) {
      return res.status(403).json({ message: 'Guardia sin jornada válida. Acceso denegado.' });
    }

    // Validar jornada si viene del frontend
    if (req.body.jornada) {
      const jornadaInput = req.body.jornada.trim().toLowerCase();
      if (jornadaInput !== jornadaGuardia) {
        return res.status(403).json({ message: 'La jornada ingresada no coincide con la registrada. Acceso denegado.' });
      }
    }

    const match = await bcrypt.compare(clave, guardia.clave);
    if (!match) return res.status(401).json({ message: 'Clave incorrecta' });

    const token = jwt.sign(
      { id: guardia._id, documento: guardia.documento, rol: 'guardia' },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Error en login de guardia:', err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Registrar guardia (autenticación admin requerida)
exports.registrar = async (req, res) => {
  const { documento, nombre, jornada, clave, usuarioAdmin, claveAdmin } = req.body;
  console.log("Datos recibidos en registrar guardia:", req.body);

  if (!clave) {
    return res.status(400).json({ message: 'La clave del guardia es requerida' });
  }

  try {
    const admin = await Admin.findOne({ usuario: usuarioAdmin });
    if (!admin) return res.status(404).json({ message: 'Admin no encontrado' });

    console.log("Admin encontrado:", admin);

    const validaClave = await bcrypt.compare(claveAdmin, admin.clave);
    if (!validaClave) return res.status(401).json({ message: 'Credenciales de admin incorrectas' });

    // Verificar si ya existe un guardia con el mismo documento
    const guardiaExistente = await Guardia.findOne({ documento });
    if (guardiaExistente) {
      return res.status(400).json({ 
        message: 'Ya existe un guardia registrado con este documento',
        error: 'DUPLICATE_DOCUMENT'
      });
    }

    const hashed = await bcrypt.hash(clave, 10);

    const guardia = await Guardia.create({
      documento,
      nombre,
      jornada,
      clave: hashed
    });

    console.log("Guardia creado:", guardia);

    await Log.create({
      tipo: 'Registro de guardia',
      detalle: `Guardia ${nombre} (${documento}) registrado por ${usuarioAdmin}`,
    });

    // 🔄 Invalidar caché de guardias y cualquier caché específica del guardia
    await cacheService.delGuardPattern();
    // Invalidar también cualquier caché de API que pueda contener listas de guardias
    await cacheService.delPattern('api:*:/api/guardia/listar*');
    console.log('🔄 Caché de guardias y listas invalidado tras registro');

    res.json({ message: 'Guardia registrado exitosamente', guardia });
  } catch (err) {
    console.error('Error al registrar guardia:', err.message, err.stack);
    res.status(500).json({ message: 'Error al registrar guardia', error: err.message });
  }
};

// Registrar usuario con equipo y generar código de barras
exports.registrarUsuarioConEquipo = async (req, res) => {
  const { nombre, documento, tipoEquipo, serialEquipo } = req.body;

  try {
    // Guardar usuario y su equipo
    const usuario = await Usuario.create({
      nombre,
      documento,
      tipoEquipo,
      serialEquipo
    });

    // Generar el código de barras usando el serial o documento como identificador
    const filePath = await generateBarcode(serialEquipo);

    await Log.create({
      tipo: 'Registro de usuario con equipo',
      detalle: `Usuario ${nombre} (${documento}) registrado con equipo ${serialEquipo}`
    });

    res.json({
      message: 'Usuario y equipo registrados exitosamente',
      usuario,
      codigoBarras: filePath
    });
  } catch (err) {
    console.error('Error al registrar usuario con equipo:', err);
    res.status(500).json({ message: 'Error al registrar usuario con equipo' });
  }
};

// Listar todos los guardias con caché
exports.listarTodos = async (req, res) => {
  try {
    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const timestamp = req.query.t;
    const skip = (page - 1) * limit;
    
    // Definir cacheKey fuera del bloque if-else para que esté disponible en todo el método
    const cacheKey = `api:${req.user ? req.user.id : 'anon'}:/api/guardia/listar?page=${page}&limit=${limit}`;
    
    // Si se proporciona un timestamp (t), forzar recarga desde la base de datos
    // Esto permite evitar la caché cuando se solicita una recarga explícita
    if (timestamp) {
      console.log(`🔄 Forzando recarga de guardias desde DB con timestamp: ${timestamp}`);
      console.log(`📊 ACTUALIZACIÓN DB: Invalidando caché para obtener datos frescos`);
      // Invalidar caché de guardias antes de continuar
      await cacheService.delGuardPattern();
      await cacheService.delPattern('api:*:/api/guardia/listar*');
      console.log(`🗑️ ACTUALIZACIÓN DB: Caché invalidada correctamente`);
    } else {
      // 🚀 Intentar obtener del caché primero
      // Usar el formato api:*:/api/guardia/listar* para que sea consistente con la invalidación
      const cachedResult = await cacheService.get(cacheKey);
      
      if (cachedResult) {
        console.log(`✅ Lista de guardias encontrada en caché: página ${page}`);
        return res.json(cachedResult);
      }
    }
    
    // Contar total de documentos
    const total = await Guardia.countDocuments();
    
    console.log(`🔍 ACTUALIZACIÓN DB: Consultando guardias en la base de datos - página ${page}, límite ${limit}`);
    // Consulta paginada
    const guardias = await Guardia.find(
      {},
      { documento: 1, nombre: 1, jornada: 1, estado: 1, registros: 1, createdAt: 1 }
    )
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
    
    console.log(`📋 ACTUALIZACIÓN DB: Recuperados ${guardias.length} registros de guardias de la base de datos`);
    if (guardias.length > 0) {
      console.log(`📝 ACTUALIZACIÓN DB: Primer registro: ${guardias[0].nombre} (${guardias[0].documento}), último registro: ${guardias[guardias.length-1].nombre} (${guardias[guardias.length-1].documento})`);
    }
    
    // Preparar respuesta
    const response = {
      guardias,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
    
    // 💾 Guardar en caché por 10 minutos
    await cacheService.set(cacheKey, response, 600);
    console.log(`💾 ACTUALIZACIÓN DB: Lista de guardias guardada en caché: página ${page}`);
    console.log(`✅ ACTUALIZACIÓN DB: Proceso completado - ${guardias.length} registros actualizados de la base de datos`);
    
    res.json(response);
  } catch (err) {
    console.error('❌ Error al listar guardias:', err);
    res.status(500).json({ message: 'Error al obtener guardias' });
  }
};

// Buscar guardia por documento con caché
exports.buscarPorDocumento = async (req, res) => {
  try {
    const { documento } = req.params;
    if (!documento) {
      return res.status(400).json({ message: 'Debe enviar un documento' });
    }
    
    // 🚀 Intentar obtener del caché primero
    const cacheKey = `guard:doc:${documento}`;
    const cachedGuard = await cacheService.get(cacheKey);
    
    if (cachedGuard) {
      console.log(`✅ Guardia encontrado en caché: ${documento}`);
      return res.json(cachedGuard);
    }
    
    // Buscar en BD
    const guardia = await Guardia.findOne(
      { documento },
      { documento: 1, nombre: 1, jornada: 1, estado: 1, registros: 1, createdAt: 1 }
    ).lean();
    
    if (!guardia) {
      return res.status(404).json({ message: 'Guardia no encontrado' });
    }
    
    // 💾 Guardar en caché por 15 minutos
    await cacheService.setGuard(cacheKey, guardia, 900);
    console.log(`💾 Guardia guardado en caché: ${documento}`);
    
    res.json(guardia);
  } catch (err) {
    console.error('❌ Error al buscar guardia:', err);
    res.status(500).json({ message: 'Error en la búsqueda' });
  }
};

// Actualizar estado de guardia
exports.actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    if (!['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }
    
    const guardia = await Guardia.findByIdAndUpdate(
      id,
      { estado },
      { new: true, select: 'documento nombre jornada estado registros' }
    ).lean();
    
    if (!guardia) {
      return res.status(404).json({ message: 'Guardia no encontrado' });
    }
    
    // 🔄 Invalidar caché de guardias y cualquier caché específica del guardia
    await cacheService.delGuardPattern();
    // Invalidar también cualquier caché de API que pueda contener listas de guardias
    await cacheService.delPattern('api:*:/api/guardia/listar*');
    console.log('🔄 Caché de guardias y listas invalidado tras actualización');
    
    res.json({ message: 'Estado actualizado', guardia });
  } catch (err) {
    console.error('❌ Error al actualizar guardia:', err);
    res.status(500).json({ message: 'Error al actualizar guardia' });
  }
};

// Incrementar registros de guardia
exports.incrementarRegistros = async (req, res) => {
  try {
    const { id } = req.params;
    
    const guardia = await Guardia.findByIdAndUpdate(
      id,
      { $inc: { registros: 1 } },
      { new: true, select: 'documento nombre jornada estado registros' }
    ).lean();
    
    if (!guardia) {
      return res.status(404).json({ message: 'Guardia no encontrado' });
    }
    
    // 🔄 Invalidar caché de guardias y cualquier caché específica del guardia
    await cacheService.delGuardPattern();
    // Invalidar también cualquier caché de API que pueda contener listas de guardias
    await cacheService.delPattern('api:*:/api/guardia/listar*');
    console.log('🔄 Caché de guardias y listas invalidado tras incremento de registros');
    
    res.json({ message: 'Registros incrementados', guardia });
  } catch (err) {
    console.error('❌ Error al incrementar registros:', err);
    res.status(500).json({ message: 'Error al incrementar registros' });
  }
};

// Actualizar datos de guardia (nombre y jornada)
exports.actualizarGuardia = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, jornada } = req.body;
    
    // Validar que se proporcionen los campos requeridos
    if (!nombre || !jornada) {
      return res.status(400).json({ message: 'Nombre y jornada son requeridos' });
    }
    
    const guardia = await Guardia.findByIdAndUpdate(
      id,
      { nombre, jornada },
      { new: true, select: 'documento nombre jornada estado registros' }
    ).lean();
    
    if (!guardia) {
      return res.status(404).json({ message: 'Guardia no encontrado' });
    }
    
    // 🔄 Invalidar caché de guardias y cualquier caché específica del guardia
    await cacheService.delGuardPattern();
    // Invalidar también cualquier caché de API que pueda contener listas de guardias
    await cacheService.delPattern('api:*:/api/guardia/listar*');
    console.log('🔄 Caché de guardias y listas invalidado tras actualización de datos');
    
    res.json({ message: 'Datos actualizados', guardia });
  } catch (err) {
    console.error('❌ Error al actualizar datos del guardia:', err);
    res.status(500).json({ message: 'Error al actualizar datos del guardia' });
  }
};
