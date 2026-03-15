const db = require('../config/db');

exports.getAlerts = async (req, res) => {
    try {
        const { limit = 50, offset = 0, unreadOnly = false } = req.query;
        let query = `
            SELECT a.*, u.nombre as usuario_nombre 
            FROM Alerts a
            JOIN Users u ON a.id_user = u.id_user
        `;
        const queryParams = [];

        if (unreadOnly === 'true') {
            query += ' WHERE a.is_read = FALSE';
        }

        query += ' ORDER BY a.timestamp_alerta DESC LIMIT ? OFFSET ?';
        queryParams.push(Number(limit), Number(offset));

        const [alerts] = await db.query(query, queryParams);
        res.json(alerts);
    } catch (error) {
        console.error('Error obteniendo alertas:', error);
        res.status(500).json({ message: 'Error interno al obtener alertas' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE Alerts SET is_read = TRUE WHERE id_alert = ?', [id]);
        res.json({ message: 'Alerta marcada como leída' });
    } catch (error) {
        console.error('Error actualizando alerta:', error);
        res.status(500).json({ message: 'Error al actualizar la alerta' });
    }
};
