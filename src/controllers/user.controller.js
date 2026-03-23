const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { logAction } = require('../services/audit.service');
const {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  getValidationMessage,
} = require('../validators/input.validators');

/**
 * Helper para verificar si un usuario es gestionado por un supervisor específico.
 * @param {number} userId - El ID del usuario a verificar.
 * @param {number} supervisorId - El ID del supervisor.
 * @returns {boolean} - True si el usuario es gestionado por el supervisor.
 */
const isUserManagedBySupervisor = async (userId, supervisorId) => {
  const [link] = await db.query(
    'SELECT * FROM Supervisor_User WHERE id_user = ? AND id_supervisor = ?',
    [userId, supervisorId],
  );
  return link.length > 0;
};

// [ADMIN / SUPERVISOR] Crear un nuevo usuario
exports.createUser = async (req, res) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: getValidationMessage(parsed.error) });
    }

    const { nombre, correo, password, telefono, rol, supervisorId } =
      parsed.data; // supervisorId es para el admin
    const requestingUser = req.user;
    const normalizedEmail = correo.trim().toLowerCase();

    const [existing] = await db.query(
      'SELECT id_user FROM Users WHERE correo = ?',
      [normalizedEmail],
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'El correo ya está en uso.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let finalRol = rol;
    let finalSupervisorId = supervisorId;

    // Lógica específica por rol
    if (requestingUser.rol === 'SUPERVISOR') {
      finalRol = 'USER'; // Un supervisor solo puede crear usuarios
      finalSupervisorId = requestingUser.id; // Se le asigna a él mismo
    } else if (requestingUser.rol === 'ADMIN') {
      if (!rol)
        return res
          .status(400)
          .json({ message: 'El rol es obligatorio para el administrador.' });
      if (rol === 'USER' && !supervisorId) {
        return res.status(400).json({
          message:
            'Para crear un rol USER, debe proporcionar un `supervisorId`.',
        });
      }
      if (rol === 'USER' && supervisorId) {
        const supervisorValidation = userIdSchema.safeParse(supervisorId);
        if (!supervisorValidation.success) {
          return res.status(400).json({
            message: getValidationMessage(supervisorValidation.error),
          });
        }
        const [supervisorExists] = await db.query(
          'SELECT id_user FROM Users WHERE id_user = ? AND rol = ? AND is_active = TRUE',
          [supervisorId, 'SUPERVISOR'],
        );
        if (supervisorExists.length === 0) {
          return res.status(400).json({
            message: 'supervisorId must belong to an active SUPERVISOR user',
          });
        }
      }
    }

    // Insertar usuario
    const [result] = await db.query(
      'INSERT INTO Users (nombre, correo, telefono, password, rol) VALUES (?, ?, ?, ?, ?)',
      [nombre, normalizedEmail, telefono || null, hashedPassword, finalRol],
    );
    const newUserId = result.insertId;

    // Si es un USER, crear el vínculo con su supervisor
    if (finalRol === 'USER' && finalSupervisorId) {
      await db.query(
        'INSERT INTO Supervisor_User (id_supervisor, id_user) VALUES (?, ?)',
        [finalSupervisorId, newUserId],
      );
    }

    logAction({
      id_user_action: requestingUser.id,
      action_type: 'USER_CREATE',
      target_entity: 'Users',
      target_id: newUserId,
      details: `El usuario ${requestingUser.id} (${requestingUser.rol}) creó al usuario ${newUserId} con el rol ${finalRol}.`,
    });

    res
      .status(201)
      .json({ message: 'Usuario creado exitosamente', userId: newUserId });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ message: 'Error interno al crear usuario.' });
  }
};

// [ADMIN / SUPERVISOR] Obtener usuarios
exports.getAllUsers = async (req, res) => {
  try {
    const { rol, id } = req.user;
    let users;

    if (rol === 'ADMIN') {
      [users] = await db.query(
        'SELECT id_user, nombre, correo, telefono, rol, is_active, created_at FROM Users ORDER BY id_user DESC',
      );
    } else if (rol === 'SUPERVISOR') {
      [users] = await db.query(
        `SELECT u.id_user, u.nombre, u.correo, u.telefono, u.rol, u.is_active, u.created_at 
                 FROM Users u
                 JOIN Supervisor_User su ON u.id_user = su.id_user
                 WHERE su.id_supervisor = ? 
                 ORDER BY u.id_user DESC`,
        [id],
      );
    }
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Error interno al obtener usuarios' });
  }
};

// [ADMIN / SUPERVISOR] Obtener un usuario por su ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (requestingUser.rol === 'SUPERVISOR') {
      const isManaged = await isUserManagedBySupervisor(id, requestingUser.id);
      if (!isManaged) {
        return res
          .status(403)
          .json({ message: 'No tiene permiso para ver este usuario.' });
      }
    }

    const [users] = await db.query(
      'SELECT id_user, nombre, correo, telefono, rol, is_active, created_at FROM Users WHERE id_user = ?',
      [id],
    );
    if (users.length === 0)
      return res.status(404).json({ message: 'Usuario no encontrado' });

    res.json(users[0]);
  } catch (error) {
    console.error('Error al obtener usuario por ID:', error);
    res.status(500).json({ message: 'Error interno al obtener usuario' });
  }
};

// [ADMIN / SUPERVISOR] Actualizar un usuario
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ message: getValidationMessage(parsed.error) });
    }

    const { nombre, correo, telefono, rol, is_active } = parsed.data;
    const normalizedEmail = correo.trim().toLowerCase();

    if (requestingUser.rol === 'SUPERVISOR') {
      const isManaged = await isUserManagedBySupervisor(id, requestingUser.id);
      if (!isManaged) {
        return res
          .status(403)
          .json({ message: 'No tiene permiso para actualizar este usuario.' });
      }
      if (rol && rol !== 'USER') {
        return res.status(403).json({
          message: 'Un supervisor no puede cambiar el rol de un usuario.',
        });
      }
    }

    if (requestingUser.rol === 'ADMIN' && rol === undefined) {
      return res
        .status(400)
        .json({ message: 'role is required for ADMIN update' });
    }

    const [targetUsers] = await db.query(
      'SELECT rol FROM Users WHERE id_user = ?',
      [id],
    );
    if (targetUsers.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const targetCurrentRole = targetUsers[0].rol;
    const finalRole = requestingUser.rol === 'ADMIN' ? rol : targetCurrentRole;

    const [existing] = await db.query(
      'SELECT id_user FROM Users WHERE correo = ? AND id_user != ?',
      [normalizedEmail, id],
    );
    if (existing.length > 0)
      return res
        .status(400)
        .json({ message: 'El correo ya está en uso por otro usuario.' });

    const [result] = await db.query(
      'UPDATE Users SET nombre = ?, correo = ?, telefono = ?, rol = ?, is_active = ? WHERE id_user = ?',
      [nombre, normalizedEmail, telefono || null, finalRole, is_active, id],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Usuario no encontrado' });

    logAction({
      id_user_action: requestingUser.id,
      action_type: 'USER_UPDATE',
      target_entity: 'Users',
      target_id: id,
      details: `El usuario ${requestingUser.id} (${requestingUser.rol}) actualizó al usuario ${id}.`,
    });

    res.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ message: 'Error interno al actualizar usuario' });
  }
};

// [ADMIN / SUPERVISOR] Eliminar un usuario
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUser = req.user;

    if (requestingUser.rol === 'SUPERVISOR') {
      const isManaged = await isUserManagedBySupervisor(id, requestingUser.id);
      if (!isManaged) {
        return res
          .status(403)
          .json({ message: 'No tiene permiso para eliminar este usuario.' });
      }
    }

    if (parseInt(id, 10) === 1) {
      // Proteger al super-admin
      return res
        .status(403)
        .json({ message: 'No se puede eliminar al administrador principal.' });
    }

    const [result] = await db.query('DELETE FROM Users WHERE id_user = ?', [
      id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: 'Usuario no encontrado' });

    logAction({
      id_user_action: requestingUser.id,
      action_type: 'USER_DELETE',
      target_entity: 'Users',
      target_id: id,
      details: `El usuario ${requestingUser.id} (${requestingUser.rol}) eliminó al usuario ${id}.`,
    });

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        message:
          'No se puede eliminar el usuario porque tiene datos asociados (reportes, alertas, etc.).',
      });
    }
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Error interno al eliminar usuario' });
  }
};
