const db = require('../config/db');

exports.getAuditLogs = async (req, res) => {
  try {
    const {
      limit = 100,
      offset = 0,
      action_type,
      startDate,
      endDate,
    } = req.query;

    let query = `
            SELECT 
                al.id_audit,
                al.id_user_action,
                al.action_type,
                al.target_entity,
                al.target_id,
                al.details,
                al.timestamp_action,
                u.nombre as usuario_nombre,
                u.rol as usuario_rol
            FROM Audit_Logs al
            LEFT JOIN Users u ON al.id_user_action = u.id_user
            WHERE 1=1
        `;
    const params = [];

    if (action_type) {
      query += ' AND al.action_type = ?';
      params.push(action_type);
    }
    if (startDate) {
      query += ' AND al.timestamp_action >= ?';
      params.push(new Date(startDate));
    }
    if (endDate) {
      query += ' AND al.timestamp_action <= ?';
      params.push(new Date(endDate));
    }

    query += ' ORDER BY al.timestamp_action DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const [logs] = await db.query(query, params);
    res.json(logs);
  } catch (error) {
    console.error('Error obteniendo audit logs:', error);
    res
      .status(500)
      .json({ message: 'Error interno al obtener registros de auditoría' });
  }
};
