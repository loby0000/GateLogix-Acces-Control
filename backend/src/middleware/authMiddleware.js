const jwt = require('jsonwebtoken');

// Autenticación general (admin o guardia)
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'Token no proporcionado' });

  // Extraer el token si viene como "Bearer <token>"
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
