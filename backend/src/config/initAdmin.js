const bcrypt = require('bcrypt');
const Admin = require('../models/admin');

async function initEmergencyAdmin() {
  try {
    const existeSupA = await Admin.findOne({ rol: 'SupA', esEmergencia: true });

    if (!existeSupA) {
      const clavePlano = 'admin123'; // 👈 clave por defecto
      const hashed = await bcrypt.hash(clavePlano, 10);

      const nuevoAdmin = await Admin.create({
        usuario: 'admin',  // 👈 usuario fijo
        clave: hashed,
        rol: 'SupA',
        esEmergencia: true,   // 👈 marcado como de emergencia
        nombre: 'Administrador de Emergencia',
        documento: '0000000000'
      });

      console.log('⚡ Admin de emergencia creado con éxito:');
      console.log({
        id: nuevoAdmin._id,
        usuario: nuevoAdmin.usuario,
        clave: clavePlano, // 👈 mostramos la clave en texto plano SOLO en consola
        rol: nuevoAdmin.rol,
        esEmergencia: nuevoAdmin.esEmergencia,
        nombre: nuevoAdmin.nombre,
        documento: nuevoAdmin.documento
      });
    } else {
      console.log('✅ SupA de emergencia ya existe, no se crea otro');
    }
  } catch (err) {
    console.error('❌ Error creando admin de emergencia:', err);
  }
}

module.exports = initEmergencyAdmin;
