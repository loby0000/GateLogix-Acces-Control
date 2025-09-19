// backend/src/controllers/equiposController.js
const UsuarioEquipo = require('../models/UsuarioEquipo');
const Log = require('../models/Logs');
const cacheService = require('../utils/cacheService');

// Registrar un nuevo equipo para un usuario existente
exports.registrarEquipo = async (req, res) => {
  try {
    const { usuarioId, documento, marca, serial, caracteristicas, accesorios } = req.body;
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

    // Crear el nuevo equipo
    const nuevoEquipo = {
      marca,
      serial,
      caracteristicas,
      accesorios: {
        mouse: accesorios?.mouse || false,
        cargador: accesorios?.cargador || false
      }
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
          accesorios: usuario.equipo.accesorios
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

    // Limpiar caché relacionada
    await cacheService.delPattern(`users:*`);
    await cacheService.delPattern(`equipos:*`);

    // Registrar log
    await Log.create({
      tipo: 'Registro de equipo',
      detalle: `Equipo ${marca} (${serial}) registrado para usuario ${usuario.nombre} (${documento})`,
      usuario: req.user.documento,
      ip: req.ip
    });

    res.status(201).json({
      message: 'Equipo registrado exitosamente',
      equipo: nuevoEquipo
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
    usuarios.forEach(usuario => {
      // Procesar array equipos si existe
      if (usuario.equipos && usuario.equipos.length > 0) {
        usuario.equipos.forEach(equipo => {
          equipos.push({
            ...equipo,
            usuario: {
              id: usuario._id,
              nombre: usuario.nombre,
              documento: usuario.numeroDocumento
            }
          });
        });
      }
      
      // Procesar objeto equipo si existe
      if (usuario.equipo && Object.keys(usuario.equipo).length > 0) {
        equipos.push({
          _id: usuario.equipo._id || `temp-${Date.now()}`,
          marca: usuario.equipo.marca || 'Equipo',
          serial: usuario.equipo.serial || '',
          caracteristicas: usuario.equipo.caracteristicas || '',
          accesorios: usuario.equipo.accesorios || { mouse: false, cargador: false },
          usuario: {
            id: usuario._id,
            nombre: usuario.nombre,
            documento: usuario.numeroDocumento
          }
        });
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
    
    // Intentar obtener del caché primero
    const cacheKey = `equipos:usuario:${documento}`;
    const cachedResult = await cacheService.get(cacheKey);
    
    if (cachedResult) {
      console.log(`✅ Equipos de usuario encontrados en caché: ${documento}`);
      return res.json(cachedResult);
    }
    
    // Buscar usuario por documento
    const usuario = await UsuarioEquipo.findOne({ numeroDocumento: documento })
      .select('nombre numeroDocumento equipos')
      .lean();
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Formatear respuesta
    const response = {
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        documento: usuario.numeroDocumento
      },
      equipos: usuario.equipos || []
    };
    
    // Guardar en caché
    await cacheService.set(cacheKey, response, 600);
    
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