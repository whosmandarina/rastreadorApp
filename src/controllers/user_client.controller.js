const db = require('../config/db');

// Asignar un usuario a un cliente
exports.assignUserToClient = async (req, res) => {
  try {
    const { id_user, id_client } = req.body;

    if (!id_user || !id_client) {
      return res
        .status(400)
        .json({ message: 'id_user e id_client son requeridos' });
    }

    // Evitar duplicados
    const [existing] = await db.query(
      'SELECT * FROM User_Client WHERE id_user = ? AND id_client = ?',
      [id_user, id_client],
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: 'El usuario ya está asignado a este cliente' });
    }

    await db.query(
      'INSERT INTO User_Client (id_user, id_client) VALUES (?, ?)',
      [id_user, id_client],
    );
    res
      .status(201)
      .json({ message: 'Usuario asignado al cliente exitosamente' });
  } catch (error) {
    console.error('Error al asignar usuario a cliente:', error);
    res.status(500).json({ message: 'Error al asignar usuario a cliente' });
  }
};

// Obtener los clientes de un usuario
exports.getClientsByUser = async (req, res) => {
  try {
    const { id_user } = req.params;

    const [clients] = await db.query(
      `SELECT c.* FROM Clients c
             JOIN User_Client uc ON c.id_client = uc.id_client
             WHERE uc.id_user = ?`,
      [id_user],
    );

    res.json(clients);
  } catch (error) {
    console.error('Error obteniendo clientes del usuario:', error);
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
};

// Obtener los usuarios de un cliente
exports.getUsersByClient = async (req, res) => {
  try {
    const { id_client } = req.params;

    const [users] = await db.query(
      `SELECT u.id_user, u.nombre, u.correo, u.rol FROM Users u
             JOIN User_Client uc ON u.id_user = uc.id_user
             WHERE uc.id_client = ?`,
      [id_client],
    );

    res.json(users);
  } catch (error) {
    console.error('Error obteniendo usuarios del cliente:', error);
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
};

// Eliminar asignación
exports.removeAssignment = async (req, res) => {
  try {
    const { id_user, id_client } = req.params;

    const [result] = await db.query(
      'DELETE FROM User_Client WHERE id_user = ? AND id_client = ?',
      [id_user, id_client],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Asignación no encontrada' });
    }

    res.json({ message: 'Asignación removida exitosamente' });
  } catch (error) {
    console.error('Error removiendo asignación:', error);
    res.status(500).json({ message: 'Error al remover asignación' });
  }
};
