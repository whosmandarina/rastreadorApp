const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { logAction } = require('../services/audit.service');

// Registro de usuario con código de supervisor
exports.register = async (req, res) => {
    try {
        const { nombre, correo, telefono, password, codigo_supervisor } = req.body;

        // HU-02: Validación Global de Entradas
        if (!nombre || !correo || !password || !codigo_supervisor) {
            return res.status(400).json({ message: 'Nombre, correo, contraseña y código de supervisor son obligatorios' });
        }

        // Validación de formato de correo
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            return res.status(400).json({ message: 'El formato del correo electrónico no es válido' });
        }
        
        // Validación de caracteres para nombre y teléfono
        const charsRegex = /^[a-zA-Z0-9\s]+$/;
        if (!charsRegex.test(nombre)) {
            return res.status(400).json({ message: 'El nombre solo puede contener letras, números y espacios.' });
        }
        if (telefono && !/^[0-9+()\s-]+$/.test(telefono)) {
            return res.status(400).json({ message: 'El teléfono contiene caracteres no válidos.' });
        }


        // HU-01: Registro con Código de Supervisor
        // 1. Validar que el código de supervisor existe y corresponde a un SUPERVISOR
        const [supervisors] = await db.query(
            'SELECT * FROM Users WHERE id_user = ? AND rol = ? AND is_active = TRUE',
            [codigo_supervisor, 'SUPERVISOR']
        );

        if (supervisors.length === 0) {
            return res.status(400).json({ message: 'Código de supervisor no válido' });
        }
        const supervisor = supervisors[0];

        // 2. Verificar si el usuario ya existe
        const [existingUser] = await db.query('SELECT * FROM Users WHERE correo = ?', [correo]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        // 3. Crear el nuevo usuario con rol 'USER'
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [result] = await db.query(
            'INSERT INTO Users (nombre, correo, telefono, password, rol) VALUES (?, ?, ?, ?, ?)',
            [nombre, correo, telefono || null, hashedPassword, 'USER']
        );
        const newUserId = result.insertId;

        // 4. Vincular al usuario con su supervisor en la tabla Supervisor_User
        await db.query(
            'INSERT INTO Supervisor_User (id_supervisor, id_user) VALUES (?, ?)',
            [supervisor.id_user, newUserId]
        );

        // Registrar auditoría
        logAction({
            id_user_action: null, // Auto-registro
            action_type: 'USER_REGISTER',
            target_entity: 'Users',
            target_id: newUserId,
            details: `Se registró nuevo usuario (${nombre}) y fue asignado al supervisor ${supervisor.nombre} (ID: ${supervisor.id_user}).`
        });

        res.status(201).json({ 
            message: 'Usuario registrado exitosamente. Ahora puede iniciar sesión.', 
            userId: newUserId 
        });

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
