// backend/src/controllers/equiposController.js
const UsuarioEquipo = require('../models/UsuarioEquipo');
const Historial = require('../models/Historial');
const Guardia = require('../models/Guardia');
const Log = require('../models/Logs');
const cacheService = require('../utils/cacheService');
const { generarCodigoBarras } = require('../utils/barcodeGenerator');
const { enviarCodigoBarrasEmail } = require('../utils/emailService');
const { invalidarCacheEstadisticas } = require('./estadisticasController');

// Registrar un nuevo equipo para un usuario existente
exports.registrarEquipo = async (req, res) => {
  try {
    const { usuarioId, documento, marca, serial, caracteristicas, accesorios, foto, fechaIngreso } = req.body;
    const idGuardia = req.user.id; // Viene del middleware JWT

    // Validaciones básicas
    if (!documento) return res.status(400).json({ message: "El documento del usuario es obligatorio" });
    if (!marca) return res.status(400).json({ message: "La marca del equipo es obligatoria" });
    if (!serial) return res.status(400).json({ message: "El serial del equipo es obligatorio" });

    // Verificar si el serial ya existe
    const equipoExistente = await UsuarioEquipo.findOne({ 'equipo.serial': serial });
    if (equipoExistente) {
      return res.status(409).json({ message: 'Este serial de equipo ya está registrado' });
    }

    // Buscar el usuario por documento
    const usuario = await UsuarioEquipo.findOne({ numeroDocumento: documento });
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Buscar información del guardia
    const guardia = await Guardia.findById(idGuardia);
    if (!guardia) {
      return res.status(404).json({ message: 'Guardia no encontrado' });
    }

    // 🔹 Generar código de barras automáticamente
    let codigoBarras = null;
    try {
      console.log('🔍 DEBUG - Generando código de barras para serial:', serial);
      codigoBarras = await generarCodigoBarras(serial);
      console.log('✅ Código de barras generado para equipo:', serial);
      console.log('🔍 DEBUG - Código de barras generado:', codigoBarras ? 'SÍ' : 'NO');
    } catch (barcodeError) {
      console.error('❌ Error generando código de barras:', barcodeError);
      // Continuar sin código de barras si hay error
    }

    // Crear el nuevo equipo
    const nuevoEquipo = {
      marca,
      serial,
      caracteristicas,
      accesorios: {
        mouse: accesorios?.mouse || false,
        cargador: accesorios?.cargador || false
      },
      foto: foto, // Guardar la foto del equipo
      fechaIngreso: fechaIngreso || new Date().toISOString(), // Usar la fecha proporcionada o generar una nueva
      codigoBarras: codigoBarras // Agregar código de barras al equipo
    };

    // Si el usuario no tiene un array de equipos, crearlo
    if (!usuario.equipos) {
      usuario.equipos = [];
      
      // Si el usuario tiene un equipo principal, añadirlo primero al array
      if (usuario.equipo && usuario.equipo.serial) {
        usuario.equipos.push({
          marca: usuario.equipo.marca,
          serial: usuario.equipo.serial,
          caracteristicas: usuario.equipo.caracteristicas,
          accesorios: usuario.equipo.accesorios,
          foto: usuario.equipo.foto,
          fechaIngreso: usuario.equipo.fechaIngreso,
          codigoBarras: usuario.equipo.codigoBarras
        });
      }
    }

    // Agregar el nuevo equipo al final del array
    usuario.equipos.push(nuevoEquipo);

    // Registrar en el historial de modificaciones
    usuario.historialModificaciones.push({
      fecha: new Date(),
      cambios: `Equipo agregado: ${marca} (${serial})`,
      registradoPor: req.user.documento || 'Sistema'
    });

    // Guardar los cambios
    await usuario.save();

    // 🔹 Crear entrada automática en historial para el nuevo equipo
    try {
      const historialEntrada = await Historial.create({
        usuario: usuario._id,
        serial: serial,
        entrada: new Date(),
        salida: null,
        guardia: guardia._id,
        docGuardia: guardia.documento || guardia.numeroDocumento || '',
        estado: "Ingreso"
      });
      
      console.log('✅ Entrada automática creada para nuevo equipo:', historialEntrada._id);
      
      // Invalidar caché de historial y estadísticas
      await cacheService.delHistoryPattern();
      await invalidarCacheEstadisticas();
    } catch (histErr) {
      console.error('❌ Error al crear entrada automática para nuevo equipo:', histErr);
      // No interrumpir el flujo principal
    }

    // Limpiar caché relacionada
    await cacheService.delPattern(`users:*`);
    await cacheService.delPattern(`equipos:*`);

    // Registrar log
    await Log.create({
      tipo: 'Registro de equipo',
      detalle: `Equipo ${marca} (${serial}) registrado para usuario ${usuario.nombre} (${documento}) por guardia ${req.user.documento}`,
      usuario: usuario._id,
      guardia: idGuardia
    });

    console.log('🔍 DEBUG - Respuesta que se enviará al frontend:', {
      message: 'Equipo registrado exitosamente',
      equipo: nuevoEquipo,
      codigoBarras: codigoBarras,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        documento: usuario.numeroDocumento
      }
    });

    // Intentar enviar email al usuario con el código de barras del nuevo equipo
    try {
      // Determinar email del usuario
      const toEmail = usuario.email;
      const toName = usuario.nombre;
      if (toEmail && codigoBarras) {
        await enviarCodigoBarrasEmail(toEmail, toName, serial, codigoBarras, {
          subject: `Código de barras del nuevo equipo (${serial})`
        });
        console.log(`📧 Email enviado a ${toEmail} con código de barras del equipo ${serial}`);
      } else {
        console.log('⚠️ No se envía email: falta correo o código de barras');
      }
    } catch (mailErr) {
      console.error('❌ Error enviando email de código de barras:', mailErr.message);
    }

    res.status(201).json({
      message: 'Equipo registrado exitosamente',
      equipo: nuevoEquipo,
      codigoBarras: codigoBarras,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        documento: usuario.numeroDocumento
      }
    });

  } catch (error) {
    console.error('❌ Error al registrar equipo:', error);
    res.status(500).json({ message: 'Error al registrar el equipo', error: error.message });
  }
};

// Listar todos los equipos
exports.listarEquipos = async (req, res) => {
  try {
    // Parámetros de paginación
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Intentar obtener del caché primero
    const cacheKey = `equipos:list:page:${page}:limit:${limit}`;
    const cachedResult = await cacheService.get(cacheKey);
    
    if (cachedResult) {
      console.log(`✅ Lista de equipos encontrada en caché: página ${page}`);
      return res.json(cachedResult);
    }
    
    // Obtener usuarios con equipos (tanto array equipos como objeto equipo)
    const usuarios = await UsuarioEquipo.find({
      $or: [
        { equipos: { $exists: true, $ne: [] } },
        { equipo: { $exists: true } }
      ]
    })
      .select('nombre numeroDocumento equipos equipo')
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Contar total para paginación
    const total = await UsuarioEquipo.countDocuments({
      $or: [
        { equipos: { $exists: true, $ne: [] } },
        { equipo: { $exists: true } }
      ]
    });
    
    // Formatear la respuesta
    const equipos = [];
    const serialsVistos = new Set(); // Para evitar duplicados
    
    usuarios.forEach(usuario => {
      // Procesar array equipos si existe
      if (usuario.equipos && usuario.equipos.length > 0) {
        usuario.equipos.forEach(equipo => {
          // Solo agregar si no hemos visto este serial antes
          if (!serialsVistos.has(equipo.serial)) {
            serialsVistos.add(equipo.serial);
            equipos.push({
              ...equipo,
              usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                documento: usuario.numeroDocumento
              }
            });
          }
        });
      }
      
      // TAMBIÉN procesar objeto equipo si existe (sin else)
      if (usuario.equipo && Object.keys(usuario.equipo).length > 0) {
        // Solo agregar si no hemos visto este serial antes
        if (!serialsVistos.has(usuario.equipo.serial)) {
          serialsVistos.add(usuario.equipo.serial);
          equipos.push({
            _id: usuario.equipo._id || `temp-${Date.now()}`,
            marca: usuario.equipo.marca || 'Equipo',
            serial: usuario.equipo.serial || '',
            caracteristicas: usuario.equipo.caracteristicas || '',
            accesorios: usuario.equipo.accesorios || { mouse: false, cargador: false },
            foto: usuario.equipo.foto || null,
            usuario: {
              id: usuario._id,
              nombre: usuario.nombre,
              documento: usuario.numeroDocumento
            }
          });
        }
      }
    });
    
    const response = {
      equipos,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
    
    // Guardar en caché
    await cacheService.set(cacheKey, response, 300);
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error al listar equipos:', error);
    res.status(500).json({ message: 'Error al obtener equipos', error: error.message });
  }
};

// Obtener equipos por documento de usuario
exports.equiposPorUsuario = async (req, res) => {
  try {
    const { documento } = req.params;
    
    console.log(`🔍 Buscando equipos para usuario con documento: ${documento}`);
    
    // Intentar obtener del caché primero
    const cacheKey = `equipos:usuario:${documento}`;
    const cachedResult = await cacheService.get(cacheKey);
    
    if (cachedResult) {
      console.log(`✅ Equipos de usuario encontrados en caché: ${documento}`);
      return res.json(cachedResult);
    }
    
    // Buscar usuario por documento - SIN LEAN para poder acceder a todos los campos
    const usuario = await UsuarioEquipo.findOne({ numeroDocumento: documento });
    
    if (!usuario) {
      console.log(`❌ Usuario no encontrado con documento: ${documento}`);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    console.log(`👤 Usuario encontrado: ${usuario.nombre}`);
    console.log(`📋 Equipo principal:`, usuario.equipo);
    console.log(`📋 Array equipos:`, usuario.equipos);
    
    // Inicializar array de equipos
    let equipos = [];
    
    // Primero agregar todos los equipos del array equipos si existe
    if (usuario.equipos && Array.isArray(usuario.equipos) && usuario.equipos.length > 0) {
      equipos = usuario.equipos.map(equipo => ({
        _id: equipo._id,
        marca: equipo.marca || 'Equipo',
        serial: equipo.serial || '',
        caracteristicas: equipo.caracteristicas || '',
        accesorios: equipo.accesorios || { mouse: false, cargador: false },
        foto: equipo.foto || null,
        fechaIngreso: equipo.fechaIngreso || null
      }));
      console.log(`📦 Equipos del array: ${equipos.length}`);
    }
    
    // Luego agregar el equipo principal si existe y no está ya en el array
    if (usuario.equipo && usuario.equipo.serial) {
      const equipoPrincipal = {
        _id: usuario.equipo._id || `temp-principal-${Date.now()}`,
        marca: usuario.equipo.marca || 'Equipo',
        serial: usuario.equipo.serial || '',
        caracteristicas: usuario.equipo.caracteristicas || '',
        accesorios: usuario.equipo.accesorios || { mouse: false, cargador: false },
        foto: usuario.equipo.foto || null,
        fechaIngreso: usuario.equipo.fechaIngreso || null,
        principal: true
      };
      
      // Verificar si el equipo principal ya existe en el array por serial
      const equipoExistente = equipos.find(e => e.serial === equipoPrincipal.serial);
      if (!equipoExistente) {
        equipos.unshift(equipoPrincipal); // Agregar al inicio
        console.log(`➕ Equipo principal agregado: ${equipoPrincipal.serial}`);
      } else {
        console.log(`⚠️ Equipo principal ya existe en el array: ${equipoPrincipal.serial}`);
      }
    }
    
    // También verificar campos legacy (serialEquipo, marcaEquipo, etc.)
    if (usuario.serialEquipo && !equipos.find(e => e.serial === usuario.serialEquipo)) {
      const equipoLegacy = {
        _id: `temp-legacy-${Date.now()}`,
        marca: usuario.marcaEquipo || 'Equipo',
        serial: usuario.serialEquipo,
        caracteristicas: usuario.caracteristicas || '',
        accesorios: { 
          mouse: usuario.mouse || false, 
          cargador: usuario.cargador || false 
        },
        foto: null,
        fechaIngreso: null,
        legacy: true
      };
      equipos.unshift(equipoLegacy);
      console.log(`➕ Equipo legacy agregado: ${equipoLegacy.serial}`);
    }
    
    console.log(`📊 Total equipos encontrados: ${equipos.length}`);
    
    const response = {
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        documento: usuario.numeroDocumento
      },
      equipos: equipos
    };
    
    // Guardar en caché por menos tiempo para debugging
    await cacheService.set(cacheKey, response, 60);
    
    res.json(response);
  } catch (error) {
    console.error('❌ Error al obtener equipos por usuario:', error);
    res.status(500).json({ message: 'Error al obtener equipos', error: error.message });
  }
};

// Actualizar un equipo
exports.actualizarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    const { marca, serial, caracteristicas, accesorios } = req.body;
    
    // Buscar el usuario que tiene el equipo con ese ID
    const usuario = await UsuarioEquipo.findOne({ 'equipos._id': id });
    
    if (!usuario) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }
    
    // Encontrar el índice del equipo en el array
    const equipoIndex = usuario.equipos.findIndex(e => e._id.toString() === id);
    
    if (equipoIndex === -1) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }
    
    // Actualizar los campos del equipo
    if (marca) usuario.equipos[equipoIndex].marca = marca;
    if (serial) usuario.equipos[equipoIndex].serial = serial;
    if (caracteristicas) usuario.equipos[equipoIndex].caracteristicas = caracteristicas;
    
    if (accesorios) {
      if (!usuario.equipos[equipoIndex].accesorios) {
        usuario.equipos[equipoIndex].accesorios = {};
      }
      
      if (accesorios.mouse !== undefined) {
        usuario.equipos[equipoIndex].accesorios.mouse = accesorios.mouse;
      }
      
      if (accesorios.cargador !== undefined) {
        usuario.equipos[equipoIndex].accesorios.cargador = accesorios.cargador;
      }
    }
    
    // Registrar en el historial de modificaciones
    usuario.historialModificaciones.push({
      fecha: new Date(),
      cambios: `Equipo actualizado: ${usuario.equipos[equipoIndex].marca} (${usuario.equipos[equipoIndex].serial})`,
      registradoPor: req.user.documento || 'Sistema'
    });
    
    // Guardar los cambios
    await usuario.save();
    
    // Limpiar caché relacionada
    await cacheService.delPattern(`equipos:*`);
    await cacheService.delPattern(`users:*`);
    
    res.json({
      message: 'Equipo actualizado exitosamente',
      equipo: usuario.equipos[equipoIndex]
    });
  } catch (error) {
    console.error('❌ Error al actualizar equipo:', error);
    res.status(500).json({ message: 'Error al actualizar el equipo', error: error.message });
  }
};

// Eliminar un equipo
exports.eliminarEquipo = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar el usuario que tiene el equipo con ese ID
    const usuario = await UsuarioEquipo.findOne({ 'equipos._id': id });
    
    if (!usuario) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }
    
    // Encontrar el equipo para registrar su información antes de eliminarlo
    const equipo = usuario.equipos.find(e => e._id.toString() === id);
    
    if (!equipo) {
      return res.status(404).json({ message: 'Equipo no encontrado' });
    }
    
    // Guardar información del equipo para el log
    const equipoInfo = {
      marca: equipo.marca,
      serial: equipo.serial
    };
    
    // Eliminar el equipo del array
    usuario.equipos = usuario.equipos.filter(e => e._id.toString() !== id);
    
    // Registrar en el historial de modificaciones
    usuario.historialModificaciones.push({
      fecha: new Date(),
      cambios: `Equipo eliminado: ${equipoInfo.marca} (${equipoInfo.serial})`,
      registradoPor: req.user.documento || 'Sistema'
    });
    
    // Guardar los cambios
    await usuario.save();
    
    // Limpiar caché relacionada
    await cacheService.delPattern(`equipos:*`);
    await cacheService.delPattern(`users:*`);
    
    // Registrar log
    await Log.create({
      tipo: 'Eliminación de equipo',
      detalle: `Equipo ${equipoInfo.marca} (${equipoInfo.serial}) eliminado del usuario ${usuario.nombre} (${usuario.numeroDocumento})`,
      usuario: req.user.documento,
      ip: req.ip
    });
    
    res.json({
      message: 'Equipo eliminado exitosamente',
      equipo: equipoInfo
    });
  } catch (error) {
    console.error('❌ Error al eliminar equipo:', error);
    res.status(500).json({ message: 'Error al eliminar el equipo', error: error.message });
  }
};