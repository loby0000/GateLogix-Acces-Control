const Admin = require('../models/admin');
const bcrypt = require('bcrypt');

const initEmergencyAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ usuario: 'admin' });

    if (existingAdmin) {
      console.log('🛡️ Admin de emergencia ya existe');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const emergencyAdmin = new Admin({
      usuario: 'admin',
      clave: hashedPassword,
      rol: 'admin'
    });

    await emergencyAdmin.save();
    console.log('✅ Admin de emergencia creado: usuario=admin, clave=admin123');
  } catch (error) {
    console.error('❌ Error al crear admin de emergencia:', error);
  }
};

module.exports = initEmergencyAdmin;
