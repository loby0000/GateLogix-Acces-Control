// backend/src/scripts/test-historial-registro.js
// Verificación por consola: registrar entrada/salida con un equipo (principal u otro) y comprobar visibilidad en los historiales
// Ejecutar: node src/scripts/test-historial-registro.js

require('dotenv').config();
const axios = require('axios');

const API_BASE = process.env.API_BASE || 'http://localhost:8080/api';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

async function loginAdmin() {
  console.log('🔐 Iniciando sesión de admin...');
  const { data } = await axios.post(`${API_BASE}/admin/login`, {
    usuario: ADMIN_USER,
    clave: ADMIN_PASS,
  });
  if (!data || !data.token) throw new Error('No se recibió token de admin');
  console.log('✅ Token de admin obtenido');
  return data.token;
}

async function ensureGuardia(token) {
  console.log('\n🛡️ Buscando guardias existentes...');
  try {
    const res = await axios.get(`${API_BASE}/guardia/listar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const guardias = Array.isArray(res.data) ? res.data : res.data.guardias || [];
    if (guardias.length > 0) {
      const doc = guardias[0].documento;
      console.log(`✅ Guardia encontrado: ${doc}`);
      return doc;
    }
    console.log('ℹ️ No hay guardias, se registrará uno de prueba...');
  } catch (err) {
    console.log('⚠️ No se pudo listar guardias, se intentará registrar uno de prueba...');
  }

  const documentoUnico = `${Date.now().toString().slice(-8)}`;
  const datosGuardia = {
    documento: documentoUnico,
    nombre: 'Guardia Script Test',
    jornada: 'mañana',
    clave: 'clave123',
    usuarioAdmin: ADMIN_USER,
    claveAdmin: ADMIN_PASS,
  };
  const resp = await axios.post(`${API_BASE}/guardia/registrar`, datosGuardia);
  if (!resp.data) throw new Error('No se pudo registrar guardia de prueba');
  console.log(`✅ Guardia de prueba registrado: ${documentoUnico}`);
  return documentoUnico;
}

async function pickUsuarioYSerial(token) {
  console.log('\n🧭 Listando equipos para seleccionar usuario y serial...');
  const res = await axios.get(`${API_BASE}/equipos/listar?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const equipos = res.data?.equipos || [];
  if (!equipos.length) throw new Error('No hay equipos disponibles en la API');

  // Agrupar por documento de usuario
  const map = new Map();
  for (const eq of equipos) {
    const doc = eq.usuario?.documento || eq.usuario?.numeroDocumento || eq.documento || 'desconocido';
    if (!map.has(doc)) map.set(doc, []);
    map.get(doc).push(eq);
  }

  // Seleccionar el primer usuario con al menos 1 equipo
  const [documento, lista] = Array.from(map.entries()).find(([doc, arr]) => doc !== 'desconocido' && arr.length > 0) || [];
  if (!documento) throw new Error('No se encontró usuario válido con equipos');

  console.log(`✅ Usuario seleccionado: ${documento} (tiene ${lista.length} equipo(s))`);

  // Obtener info de equipos del usuario (principal y otros)
  let equipoPrincipal = null;
  let otrosEquipos = [];
  try {
    const resp = await axios.get(`${API_BASE}/equipos/usuario/${documento}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    equipoPrincipal = resp.data?.equipoPrincipal || resp.data?.equipo || null;
    otrosEquipos = resp.data?.otrosEquipos || resp.data?.equipos || [];
  } catch (err) {
    console.log('⚠️ No se pudo obtener equipos por usuario, se usará la lista general.');
  }

  // Serial a probar: preferir "otro equipo" si existe, si no usar el principal o el primero de la lista
  let serialPrueba = null;
  if (otrosEquipos && otrosEquipos.length > 0 && otrosEquipos[0]?.serial) {
    serialPrueba = otrosEquipos[0].serial;
    console.log(`🔧 Seleccionado serial de "otro equipo": ${serialPrueba}`);
  } else if (equipoPrincipal?.serial) {
    serialPrueba = equipoPrincipal.serial;
    console.log(`🔧 Seleccionado serial del equipo principal: ${serialPrueba}`);
  } else {
    serialPrueba = lista[0]?.serial;
    console.log(`🔧 Seleccionado serial desde lista general: ${serialPrueba}`);
  }

  if (!serialPrueba) throw new Error('No se pudo determinar un serial para la prueba');

  const principalSerial = equipoPrincipal?.serial || null;
  return { documento, serialPrueba, principalSerial };
}

async function registrarMovimiento(token, serial, docGuardia) {
  console.log(`\n📝 Registrando movimiento para serial ${serial} con guardia ${docGuardia}...`);
  const { data } = await axios.post(
    `${API_BASE}/historial/registrar`,
    { serial, docGuardia },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  console.log('✅ Movimiento registrado:', {
    tipo: data?.tipo || data?.estado,
    entrada: data?.entrada,
    salida: data?.salida,
    createdAt: data?.createdAt,
  });
  return data;
}

async function obtenerHistorialEquipo(token, serial) {
  const res = await axios.get(`${API_BASE}/historial/equipo/${encodeURIComponent(serial)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res.data) ? res.data : [];
}

async function obtenerHistorialUsuario(token, documento) {
  const res = await axios.get(`${API_BASE}/historial/buscar/${encodeURIComponent(documento)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res.data) ? res.data : [];
}

async function verificarVisibilidad(token, documento, serialPrueba, principalSerial) {
  console.log('\n🔎 Verificando visibilidad en historiales...');
  const historialEquipo = await obtenerHistorialEquipo(token, serialPrueba).catch(err => {
    console.log('⚠️ No se pudo obtener historial por serial:', err.response?.data || err.message);
    return [];
  });
  console.log(`📦 Historial de equipo (${serialPrueba}): ${historialEquipo.length} registro(s)`);

  const historialUsuario = await obtenerHistorialUsuario(token, documento).catch(err => {
    console.log('⚠️ No se pudo obtener historial por usuario:', err.response?.data || err.message);
    return [];
  });
  console.log(`👤 Historial completo del usuario (${documento}): ${historialUsuario.length} registro(s)`);

  // Simular filtro del modal de usuario (solo equipo principal)
  const historialUsuarioFiltrado = principalSerial
    ? historialUsuario.filter(r => r.serial === principalSerial)
    : historialUsuario;

  console.log(`🎛️ Historial del usuario filtrado por equipo principal (${principalSerial || 'sin principal'}): ${historialUsuarioFiltrado.length} registro(s)`);

  const apareceEnModalEquipo = historialEquipo.some(r => r.serial === serialPrueba);
  const apareceEnModalUsuarioPrincipal = historialUsuarioFiltrado.some(r => r.serial === serialPrueba);

  console.log(`\n📊 Resultado:`);
  console.log(`- Aparece en "Historial de equipo" (${serialPrueba}): ${apareceEnModalEquipo ? 'Sí' : 'No'}`);
  if (principalSerial) {
    console.log(`- Aparece en "Historial completo" filtrado por principal (${principalSerial}): ${apareceEnModalUsuarioPrincipal ? 'Sí' : 'No'}`);
    if (serialPrueba !== principalSerial) {
      console.log('  ℹ️ Como el serial de la prueba NO es el principal, en el modal del usuario solo aparecerá si ese equipo llega a ser principal.');
    }
  } else {
    console.log('- Usuario sin equipo principal; el modal mostraría todos los movimientos.');
  }
}

(async () => {
  try {
    const token = await loginAdmin();
    const docGuardia = await ensureGuardia(token);
    const { documento, serialPrueba, principalSerial } = await pickUsuarioYSerial(token);

    // Registrar ENTRADA o cerrar SALIDA según estado actual
    await registrarMovimiento(token, serialPrueba, docGuardia);
    await verificarVisibilidad(token, documento, serialPrueba, principalSerial);

    // Registrar segundo movimiento (salida si hay entrada abierta)
    console.log('\n🔁 Registrando segundo movimiento para alternar estado...');
    await registrarMovimiento(token, serialPrueba, docGuardia);
    await verificarVisibilidad(token, documento, serialPrueba, principalSerial);

    console.log('\n✅ Verificación de historial completada');
  } catch (error) {
    console.error('\n❌ Error en la verificación:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
})();