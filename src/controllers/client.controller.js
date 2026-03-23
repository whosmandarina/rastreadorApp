const db = require('../config/db');

// Obtener todos los clientes (Solo ADMIN)
exports.getAllClients = async (req, res) => {
  try {
    const [clients] = await db.query(
      'SELECT * FROM Clients ORDER BY id_client DESC',
    );
    res.json(clients);
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
};

// Obtener un cliente por ID
exports.getClientById = async (req, res) => {
  try {
    const { id } = req.params;
    const [clients] = await db.query(
      'SELECT * FROM Clients WHERE id_client = ?',
      [id],
    );

    if (clients.length === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    res.json(clients[0]);
  } catch (error) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({ message: 'Error al obtener cliente' });
  }
};

// Crear nuevo cliente (Solo ADMIN)
exports.createClient = async (req, res) => {
  try {
    const { nombre_empresa, contacto, id_user_admin } = req.body;

    if (!nombre_empresa) {
      return res
        .status(400)
        .json({ message: 'El nombre de la empresa es obligatorio' });
    }

    const [result] = await db.query(
      'INSERT INTO Clients (nombre_empresa, contacto, id_user_admin) VALUES (?, ?, ?)',
      [nombre_empresa, contacto, id_user_admin || null],
    );

    res
      .status(201)
      .json({ message: 'Cliente creado exitosamente', id: result.insertId });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ message: 'Error al crear cliente' });
  }
};

// Actualizar cliente (Solo ADMIN)
exports.updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_empresa, contacto, id_user_admin } = req.body;

    const [result] = await db.query(
      'UPDATE Clients SET nombre_empresa = ?, contacto = ?, id_user_admin = ? WHERE id_client = ?',
      [nombre_empresa, contacto, id_user_admin, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json({ message: 'Cliente actualizado exitosamente' });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ message: 'Error al actualizar cliente' });
  }
};

// Eliminar cliente (Solo ADMIN)
exports.deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.query('DELETE FROM Clients WHERE id_client = ?', [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }

    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ message: 'Error al eliminar cliente' });
  }
};
