const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminController');

// POST /api/admin/login
router.post('/login', adminCtrl.login);

// POST /api/admin/reemplazar
router.post('/reemplazar', adminCtrl.reemplazarAdmin);

module.exports = router;
    

