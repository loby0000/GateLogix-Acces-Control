// backend/src/controllers/usuarioEquipoController.js
const UsuarioEquipo = require('../models/UsuarioEquipo');
const Guardia = require('../models/Guardia');
const Log = require('../models/Logs');
const { generarCodigoBarras } = require('../utils/barcodeGenerator'); // ✅ Importación corregida
const { enviarCodigoBarrasEmail } = require('../utils/emailService');
const Historial = require('../models/Historial');
const cacheService = require('../utils/cacheService');
const { invalidarCacheEstadisticas } = require('./estadisticasController');


exports.registrar = async (req, res) => {
  const { tipoUsuario, tipoDocumento, numeroDocumento, nombre, email, equipo, foto } = req.body;
  console.log('Foto recibida:', foto ? 'Foto presente (base64)' : 'Foto null o undefined');
  console.log('Tipo de foto:', typeof foto);
  console.log('Longitud de la foto:', foto ? foto.length : 0);
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
    const equipoData = {
      serial: equipo.serial,
      marca: equipo.marca,
      caracteristicas: equipo.caracteristicas,
      accesorios: {
        mouse: equipo.accesorios?.mouse || false,
        cargador: equipo.accesorios?.cargador || false
      },
      fechaIngreso: new Date().toISOString()
    };

    const usuarioData = {
      tipoUsuario,
      tipoDocumento,
      numeroDocumento,
      nombre,
      email,
      foto, // Añadimos la foto al objeto de usuario
      equipo: equipoData, // Equipo principal (para compatibilidad)
      equipos: [equipoData], // ✅ Inicializar array equipos con el equipo principal
      guardiaRegistrador: guardia._id,
      codigoBarras,
      historialModificaciones: [
        {
          cambios: 'Registro inicial',
          registradoPor: guardia.nombre
        }
      ]
    };

    // Log opcional
    await Log.create({
      tipo: 'Registro Usuario',
      detalle: `Guardia ${guardia.nombre} registró a ${numeroDocumento}`,
    });
    
    // Incrementar el contador de registros del guardia
    await Guardia.findByIdAndUpdate(idGuardia, { $inc: { registros: 1 } });
    
    // Crear el usuario en la base de datos
    const nuevo = await UsuarioEquipo.create(usuarioData);
    
    // Enviar código de barras por correo (best-effort)
    try {
      await enviarCodigoBarrasEmail(email, nombre, equipo.serial, codigoBarras, {
        subject: `Código de barras de su equipo (${equipo.serial})`
      });
      console.log(`📧 Email enviado a ${email} con código de barras`);
    } catch (mailErr) {
      console.error('❌ Error enviando email con código de barras:', mailErr.message);
    }

    // Crear entrada automática en historial (usuario recién registrado)
    try {
      const historialEntrada = await Historial.create({
        usuario: nuevo._id,
        serial: equipo.serial,
        entrada: new Date(),
        salida: null,
        guardia: guardia._id,
        docGuardia: guardia.documento || guardia.numeroDocumento || '',
        estado: "Ingreso"  // Debe ser "Ingreso" según el enum del modelo
      });
      
      console.log('✅ Historial automático creado para nuevo usuario:', historialEntrada._id);
      
      // Invalidar caché de historial para que aparezca en las listas
      await cacheService.delHistoryPattern();
      await invalidarCacheEstadisticas();
    } catch (histErr) {
      console.error('❌ Error al crear historial automático tras registro:', histErr);
      // no rompemos el flujo principal, simplemente logueamos
    }


    // 🔄 Invalidar caché de usuarios
    await cacheService.delUserPattern();
    console.log('🔄 Caché de usuarios invalidado tras registro');

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
    const { serial } = req.params;
    if (!serial) {
      return res.status(400).json({ message: "Debe enviar un serial" });
    }

    // 🚀 Intentar obtener del caché primero
    const cacheKey = `user:serial:${serial}`;
    const cachedUser = await cacheService.get(cacheKey);
    
    if (cachedUser) {
      console.log(`✅ Usuario encontrado en caché: ${serial}`);
      return res.json(cachedUser);
    }

    // 🚀 Optimización: consulta ultra-rápida con índice y proyección mínima
    const usuario = await UsuarioEquipo.findOne({
      $or: [
        { "equipo.serial": serial },
        { "equipos.serial": serial }
      ]
    }, {
      tipoUsuario: 1,
      tipoDocumento: 1,
      numeroDocumento: 1,
      nombre: 1,
      email: 1,
      equipo: 1,
      equipos: 1,
      foto: 1,
      guardiaRegistrador: 1
    })
    .populate("guardiaRegistrador", "nombre email")
    .lean() // 50% más rápido, menos memoria
    .maxTimeMS(5000); // Timeout de 5 segundos

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 💾 Guardar en caché por 10 minutos
    await cacheService.setUser(cacheKey, usuario, 600);
    console.log(`💾 Usuario guardado en caché: ${serial}`);

    // 🎯 Respuesta optimizada sin logs innecesarios
    res.json(usuario);
  } catch (err) {
    console.error("❌ Error buscarPorSerial:", err.message);
    res.status(500).json({ message: "Error en la búsqueda", error: err.message });
  }
};

exports.buscarPorDocumento = async (req, res) => {
  try {
    const { numeroDocumento } = req.params;
    if (!numeroDocumento) {
      return res.status(400).json({ message: "Debe enviar un número de documento" });
    }

    // 🚀 Intentar obtener del caché primero
    const cacheKey = `user:doc:${numeroDocumento}`;
    const cachedUser = await cacheService.get(cacheKey);
    
    if (cachedUser) {
      console.log(`✅ Usuario encontrado en caché: ${numeroDocumento}`);
      return res.json(cachedUser);
    }

    // 🚀 Optimización: consulta ultra-rápida con índice único
    const usuario = await UsuarioEquipo.findOne(
      { numeroDocumento },
      {
        tipoUsuario: 1,
        tipoDocumento: 1,
        numeroDocumento: 1,
        nombre: 1,
        email: 1,
        equipo: 1,
        foto: 1,
        guardiaRegistrador: 1
      }
    )
    .populate("guardiaRegistrador", "nombre documento")
    .lean() // Reducir uso de memoria
    .maxTimeMS(3000); // Timeout más agresivo para documento (índice único)

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // 💾 Guardar en caché por 10 minutos
    await cacheService.setUser(cacheKey, usuario, 600);
    console.log(`💾 Usuario guardado en caché: ${numeroDocumento}`);

    res.json(usuario);
  } catch (err) {
    console.error("❌ Error buscarPorDocumento:", err.message);
    res.status(500).json({ message: "Error en la búsqueda", error: err.message });
  }
};

// Obtener todos los usuarios con paginación
exports.listarTodos = async (req, res) => {
  try {
    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // 🚀 Intentar obtener del caché primero
    const cacheKey = `users:list:page:${page}:limit:${limit}`;
    const cachedResult = await cacheService.get(cacheKey);
    
    if (cachedResult) {
      console.log(`✅ Lista de usuarios encontrada en caché: página ${page}`);
      return res.json(cachedResult);
    }
    
    // Contar total de documentos para metadata de paginación
    const total = await UsuarioEquipo.countDocuments();
    
    // Consulta paginada
    const usuarios = await UsuarioEquipo.find()
      .sort({ createdAt: -1 }) // Ordenar por fecha de creación, más recientes primero
      .skip(skip)
      .limit(limit);

    // Aplana la estructura de equipo y accesorios
    const usuariosPlanos = usuarios.map(u => ({
      _id: u._id,
      tipoUsuario: u.tipoUsuario,
      tipoDocumento: u.tipoDocumento,
      nombre: u.nombre,
      numeroDocumento: u.numeroDocumento,
      email: u.email,
      marcaEquipo: u.equipo?.marca || "",
      serialEquipo: u.equipo?.serial || "",
      caracteristicas: u.equipo?.caracteristicas || "",
      mouse: u.equipo?.accesorios?.mouse || false,
      cargador: u.equipo?.accesorios?.cargador || false,
      foto: u.foto || null,
    }));

    // Preparar respuesta con metadata de paginación
    const response = {
      usuarios: usuariosPlanos,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
    
    // 💾 Guardar en caché por 5 minutos
    await cacheService.setUser(cacheKey, response, 300);
    console.log(`💾 Lista de usuarios guardada en caché: página ${page}`);
    
    // Enviar respuesta
    res.json(response);
  } catch (err) {
    console.error("❌ Error al listar usuarios:", err);
    res.status(500).json({ message: "Error al obtener usuarios" });
  }
};

// Actualizar usuario por ID
exports.actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // buscamos el usuario
    const usuario = await UsuarioEquipo.findById(id);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // actualizamos campos principales
    usuario.tipoUsuario = data.tipoUsuario || usuario.tipoUsuario;
    usuario.tipoDocumento = data.tipoDocumento || usuario.tipoDocumento;
    usuario.numeroDocumento = data.numeroDocumento || usuario.numeroDocumento; // Corregido: usar numeroDocumento en lugar de documento
    usuario.nombre = data.nombre || usuario.nombre;
    usuario.email = data.email || usuario.email;
    
    // Actualizar la foto solo si se proporciona una nueva
    if (data.foto) {
      console.log('Actualizando foto de usuario');
      usuario.foto = data.foto;
    }

    // actualizamos equipo principal y array de equipos
    if (!usuario.equipo) usuario.equipo = {};
    usuario.equipo.serial = data.serialEquipo || usuario.equipo.serial;
    usuario.equipo.marca = data.marcaEquipo || usuario.equipo.marca;
    usuario.equipo.caracteristicas = data.caracteristicas || usuario.equipo.caracteristicas;

    if (!usuario.equipo.accesorios) usuario.equipo.accesorios = {};
    usuario.equipo.accesorios.mouse = data.mouse ?? usuario.equipo.accesorios.mouse;
    usuario.equipo.accesorios.cargador = data.cargador ?? usuario.equipo.accesorios.cargador;

    // Sincronizar con el array de equipos
    if (!usuario.equipos) usuario.equipos = [];
    
    // Buscar el equipo principal en el array
    const equipoPrincipalIndex = usuario.equipos.findIndex(e => e.serial === usuario.equipo.serial);
    
    if (equipoPrincipalIndex !== -1) {
      // Actualizar el equipo existente en el array
      usuario.equipos[equipoPrincipalIndex] = {
        ...usuario.equipos[equipoPrincipalIndex],
        serial: usuario.equipo.serial,
        marca: usuario.equipo.marca,
        caracteristicas: usuario.equipo.caracteristicas,
        accesorios: usuario.equipo.accesorios,
        foto: usuario.equipo.foto
      };
    } else if (usuario.equipo.serial) {
      // Agregar el equipo principal al array si no existe
      usuario.equipos.push({
        _id: usuario.equipo._id || `temp-principal-${Date.now()}`,
        serial: usuario.equipo.serial,
        marca: usuario.equipo.marca,
        caracteristicas: usuario.equipo.caracteristicas,
        accesorios: usuario.equipo.accesorios,
        foto: usuario.equipo.foto,
        fechaIngreso: usuario.equipo.fechaIngreso || new Date()
      });
    }

    // historial
    usuario.historialModificaciones.push({
      cambios: "Edición de usuario",
      registradoPor: req.user?.nombre || "Desconocido",
    });

    await usuario.save();
    
    // 🔄 Invalidar caché de usuarios
    await cacheService.delUserPattern();
    console.log('🔄 Caché de usuarios invalidado tras actualización');
    
    console.log('Usuario actualizado con éxito, foto:', usuario.foto ? 'Presente' : 'No presente');

    // devolvemos aplanado (como listarTodos)
    res.json({
      _id: usuario._id,
      tipoUsuario: usuario.tipoUsuario,
      tipoDocumento: usuario.tipoDocumento,
      nombre: usuario.nombre,
      documento: usuario.numeroDocumento,
      email: usuario.email,
      marcaEquipo: usuario.equipo?.marca || "",
      serialEquipo: usuario.equipo?.serial || "",
      caracteristicas: usuario.equipo?.caracteristicas || "",
      mouse: usuario.equipo?.accesorios?.mouse || false,
      cargador: usuario.equipo?.accesorios?.cargador || false,
      foto: usuario.foto || null,
    });

  } catch (err) {
    console.error("❌ Error al actualizar usuario:", err);
    res.status(500).json({ message: "Error al actualizar usuario", error: err.message });
  }
};


