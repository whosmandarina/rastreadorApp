const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Middleware para verificar que el token es válido y la sesión está activa
exports.verifyToken = async (req, res, next) => {
    try {
        let token = req.headers['authorization'];

        if (!token) {
            return res.status(403).json({ message: 'No se proporcionó un token de autenticación' });
        }

        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length); // Remover 'Bearer '
        }

        // Decodificar token
        const secret = process.env.JWT_SECRET || 'secret_rastreador_development_123';
        const decoded = jwt.verify(token, secret);
        
        // Comprobar en base de datos si esta sesión (JTI) no ha sido revocada
        const [sessions] = await db.query('SELECT is_active FROM Sessions WHERE token_jti = ?', [decoded.jti]);
        
        if (sessions.length === 0 || !sessions[0].is_active) {
            return res.status(401).json({ message: 'Sesión inválida, revocada o ha iniciado sesión en otro dispositivo.' });
        }

        // Agregar los datos del usuario a la request para que los controladores los usen
        req.user = decoded; 
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'El token ha expirado' });
        }
        return res.status(401).json({ message: 'Token inválido' });
    }
};

// Middleware para verificar si el usuario tiene un rol específico
// Uso: router.get('/ruta', verifyToken, checkRole(['ADMIN', 'SUPERVISOR']), controlador)
exports.checkRole = (rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }

        if (rolesPermitidos.includes(req.user.rol)) {
            next(); // El rol está permitido, continuar
        } else {
            return res.status(403).json({ message: 'No tienes permisos suficientes para realizar esta acción' });
        }
    };
};
