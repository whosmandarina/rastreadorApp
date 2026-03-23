const db = require('../config/db');

// Asignar un usuario (rastreado) a un supervisor
exports.assignSupervisorToUser = async (req, res) => {
  try {
    const { id_supervisor, id_user } = req.body;

    if (!id_supervisor || !id_user) {
      return res
        .status(400)
        .json({ message: 'id_supervisor e id_user son requeridos' });
    }

    // Evitar duplicados
    const [existing] = await db.query(
      'SELECT * FROM Supervisor_User WHERE id_supervisor = ? AND id_user = ?',
      [id_supervisor, id_user],
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: 'El usuario ya está asignado a este supervisor' });
    }

    await db.query(
      'INSERT INTO Supervisor_User (id_supervisor, id_user) VALUES (?, ?)',
      [id_supervisor, id_user],
    );
    res
      .status(201)
      .json({ message: 'Usuario asignado al supervisor exitosamente' });
  } catch (error) {
    console.error('Error al asignar usuario a supervisor:', error);
    res.status(500).json({ message: 'Error al asignar usuario a supervisor' });
  }
};

// Obtener los usuarios asignados a un supervisor
exports.getUsersBySupervisor = async (req, res) => {
  try {
    const { id_supervisor } = req.params;

    // Validar que el supervisor que pide sea el mismo (o sea ADMIN)
    if (
      req.user.rol === 'SUPERVISOR' &&
      req.user.id !== parseInt(id_supervisor)
    ) {
      return res.status(403).json({
        message: 'No tienes permiso para ver los usuarios de otro supervisor',
      });
    }

    const [users] = await db.query(
      `SELECT u.id_user, u.nombre, u.correo, u.rol FROM Users u
             JOIN Supervisor_User su ON u.id_user = su.id_user
             WHERE su.id_supervisor = ?`,
      [id_supervisor],
    );

    res.json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios del supervisor:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// Obtener los supervisores de un usuario
exports.getSupervisorsByUser = async (req, res) => {
  try {
    const { id_user } = req.params;

    const [supervisors] = await db.query(
      `SELECT u.id_user, u.nombre, u.correo, u.rol FROM Users u
             JOIN Supervisor_User su ON u.id_user = su.id_supervisor
             WHERE su.id_user = ?`,
      [id_user],
    );

    res.json(supervisors);
  } catch (error) {
    console.error('Error obteniendo supervisores del usuario:', error);
    res.status(500).json({ message: 'Error al obtener supervisores' });
  }
};

// Eliminar asignación
exports.removeAssignment = async (req, res) => {
  try {
    const { id_supervisor, id_user } = req.params;

    const [result] = await db.query(
      'DELETE FROM Supervisor_User WHERE id_supervisor = ? AND id_user = ?',
      [id_supervisor, id_user],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Asignación no encontrada' });
    }

    res.json({ message: 'Asignación removida exitosamente' });
  } catch (error) {
    console.error('Error removiendo asignación de supervisor:', error);
    res.status(500).json({ message: 'Error al remover asignación' });
  }
};
