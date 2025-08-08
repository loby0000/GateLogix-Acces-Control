const express = require('express');
const router = express.Router();
const guardiaCtrl = require('../controllers/guardiaController');
const { verifyToken } = require('../middleware/authMiddleware');
// POST /api/guardia/login
router.post('/login', guardiaCtrl.login);

// POST /api/guardia/registrar
router.post('/registrar', guardiaCtrl.registrar);

module.exports = router;

router.get('/perfil', verifyToken, (req, res) => {
  res.json({ message: `Guardia autenticado: ${req.user.documento}` });
});
