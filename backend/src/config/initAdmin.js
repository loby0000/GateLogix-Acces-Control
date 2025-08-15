const Admin = require('../models/admin');
const bcrypt = require('bcrypt');

const initEmergencyAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ usuario: 'admin' });

    if (existingAdmin) {
      console.log('🛡️ Superadmin de emergencia ya existe');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const emergencyAdmin = new Admin({
      usuario: 'admin',
      clave: hashedPassword,
      rol: 'SupA'   // Cambiado a SuperAdmin
    });

    await emergencyAdmin.save();
    console.log('✅ Superadmin de emergencia creado: usuario=admin, clave=admin123, rol=SupA');
  } catch (error) {
    console.error('❌ Error al crear superadmin de emergencia:', error);
  }
};

module.exports = initEmergencyAdmin;
