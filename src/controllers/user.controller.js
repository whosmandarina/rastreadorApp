const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { logAction } = require('../services/audit.service');

// [ADMIN] Obtener todos los usuarios
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query('SELECT id_user, nombre, correo, telefono, rol, is_active, created_at FROM Users ORDER BY id_user DESC');
        res.json(users);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error interno al obtener usuarios' });
    }
};

// [ADMIN] Obtener un usuario por su ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const [users] = await db.query('SELECT id_user, nombre, correo, telefono, rol, is_active, created_at FROM Users WHERE id_user = ?', [id]);
        
        if (users.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(users[0]);
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        res.status(500).json({ message: 'Error interno al obtener usuario' });
    }
};

// [ADMIN] Actualizar un usuario
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, correo, telefono, rol, is_active } = req.body;

        if (!nombre || !correo || !rol || is_active === undefined) {
            return res.status(400).json({ message: 'Nombre, correo, rol y is_active son campos requeridos.' });
        }

        // Verificar que el nuevo correo no esté en uso por OTRO usuario
        const [existing] = await db.query('SELECT id_user FROM Users WHERE correo = ? AND id_user != ?', [correo, id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'El correo electrónico ya está en uso por otro usuario.' });
        }

        const [result] = await db.query(
            'UPDATE Users SET nombre = ?, correo = ?, telefono = ?, rol = ?, is_active = ? WHERE id_user = ?',
            [nombre, correo, telefono, rol, is_active, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Registrar auditoría
        logAction({
            id_user_action: req.user.id,
            action_type: 'USER_UPDATE',
            target_entity: 'Users',
            target_id: id,
            details: `El administrador ${req.user.id} actualizó al usuario ${id}.`
        });

        res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error interno al actualizar usuario' });
    }
};

// [ADMIN] Eliminar un usuario
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Opcional: Verificar que no se pueda eliminar al usuario ADMIN principal (si existe, ej: id 1)
        if (parseInt(id, 10) === 1) {
            return res.status(403).json({ message: 'No se puede eliminar al administrador principal.' });
        }

        const [result] = await db.query('DELETE FROM Users WHERE id_user = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Registrar auditoría
        logAction({
            id_user_action: req.user.id,
            action_type: 'USER_DELETE',
            target_entity: 'Users',
            target_id: id,
            details: `El administrador ${req.user.id} eliminó al usuario ${id}.`
        });

        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        // Manejar error de clave foránea si el usuario está referenciado en otras tablas
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: 'No se puede eliminar el usuario porque está asignado a otras entidades (reportes, alertas, etc.). Primero debe reasignar o eliminar esas dependencias.' });
        }
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ message: 'Error interno al eliminar usuario' });
    }
};
