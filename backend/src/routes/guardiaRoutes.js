const express = require('express');
const router = express.Router();
const guardiaCtrl = require('../controllers/guardiaController');
const { verifyToken } = require('../middleware/authMiddleware');
const { cacheMiddleware } = require('../middleware/cacheMiddleware');

// POST /api/guardia/login
router.post('/login', guardiaCtrl.login);

// POST /api/guardia/registrar
router.post('/registrar', guardiaCtrl.registrar);

// GET /api/guardia/listar - Con caché de 5 minutos
router.get('/listar', verifyToken, cacheMiddleware(300), guardiaCtrl.listarTodos);

// GET /api/guardia/buscar/:documento - Con caché de 10 minutos
router.get('/buscar/:documento', verifyToken, cacheMiddleware(600), guardiaCtrl.buscarPorDocumento);

// PUT /api/guardia/estado/:id - Actualizar estado de guardia
router.put('/estado/:id', verifyToken, guardiaCtrl.actualizarEstado);

// GET /api/guardia/perfil - Perfil del guardia autenticado
router.get('/perfil', verifyToken, (req, res) => {
  res.json({ message: `Guardia autenticado: ${req.user.documento}` });
});

module.exports = router;
