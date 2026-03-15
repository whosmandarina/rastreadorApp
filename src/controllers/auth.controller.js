const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { logAction } = require('../services/audit.service');

// Registro de usuario
exports.register = async (req, res) => {
    try {
        const { nombre, correo, telefono, identificador_interno, password, rol } = req.body;

        // Validar campos requeridos mínimos
        if (!nombre || !correo || !password || !rol) {
            return res.status(400).json({ message: 'Nombre, correo, contraseña y rol son obligatorios' });
        }

        // Verificar si el usuario ya existe
        const [existingUser] = await db.query('SELECT * FROM Users WHERE correo = ?', [correo]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertar usuario
        const [result] = await db.query(
            'INSERT INTO Users (nombre, correo, telefono, identificador_interno, password, rol) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, correo, telefono, identificador_interno || null, hashedPassword, rol]
        );

        const newUserId = result.insertId;

        // Registrar auditoría
        logAction({
            id_user_action: req.user ? req.user.id : null, // Si un admin lo crea, se registra. Si es auto-registro, es null.
            action_type: 'USER_REGISTER',
            target_entity: 'Users',
            target_id: newUserId,
            details: `Se registró un nuevo usuario (${nombre}) con el rol ${rol}.`
        });

        res.status(201).json({ message: 'Usuario registrado exitosamente', userId: newUserId });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ message: 'Error en el servidor al registrar usuario' });
    }
};

// Inicio de sesión
exports.login = async (req, res) => {
    try {
        const { correo, password, device_id } = req.body;

        if (!correo || !password) {
            return res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
        }

        // Buscar usuario
        const [users] = await db.query('SELECT * FROM Users WHERE correo = ? AND is_active = TRUE', [correo]);
        const user = users[0];

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas o usuario inactivo' });
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Control de dispositivos: Bloquear otras sesiones si el usuario es un rastreado (USER)
        if (user.rol === 'USER') {
            await db.query('UPDATE Sessions SET is_active = FALSE WHERE id_user = ? AND is_active = TRUE', [user.id_user]);
        }

        // Generar JWT
        const crypto = require('crypto');
        const token_jti = crypto.randomUUID(); // ID único para el token (para poder revocarlo)
        
        const token = jwt.sign(
            { id: user.id_user, rol: user.rol, jti: token_jti },
            process.env.JWT_SECRET || 'secret_rastreador_development_123', // ¡Asegúrate de definir JWT_SECRET en el .env!
            { expiresIn: '30d' }
        );

        // Registrar nueva sesión
        await db.query(
            'INSERT INTO Sessions (id_user, token_jti, device_id) VALUES (?, ?, ?)',
            [user.id_user, token_jti, device_id || 'UNKNOWN_DEVICE']
        );

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: user.id_user,
                nombre: user.nombre,
                correo: user.correo,
                rol: user.rol
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ message: 'Error en el servidor al iniciar sesión' });
    }
};

// Cerrar sesión
exports.logout = async (req, res) => {
    try {
        const { jti } = req.user; // Obtenido gracias al middleware de autenticación
        
        // Desactivar la sesión actual
        await db.query('UPDATE Sessions SET is_active = FALSE WHERE token_jti = ?', [jti]);

        res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({ message: 'Error al cerrar sesión' });
    }
};
