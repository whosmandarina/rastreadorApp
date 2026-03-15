const db = require('../config/db');
const { logAction } = require('../services/audit.service');

exports.createGeofence = async (req, res) => {
    try {
        const { nombre, tipo, coordenadas, radio } = req.body;
        const userId = req.user.id; // Usuario que la crea

        if (!nombre || !tipo || !coordenadas) {
            return res.status(400).json({ message: 'Faltan datos requeridos (nombre, tipo, coordenadas)' });
        }

        if (tipo !== 'CIRCLE' && tipo !== 'POLYGON') {
            return res.status(400).json({ message: 'El tipo debe ser CIRCLE o POLYGON' });
        }

        const [result] = await db.query(
            'INSERT INTO Geofences (nombre, tipo, coordenadas, radio, created_by) VALUES (?, ?, ?, ?, ?)',
            [nombre, tipo, JSON.stringify(coordenadas), radio || null, userId]
        );

        const newGeofenceId = result.insertId;

        logAction({
            id_user_action: userId,
            action_type: 'GEOFENCE_CREATE',
            target_entity: 'Geofences',
            target_id: newGeofenceId,
            details: `El usuario ${userId} creó la geocerca '${nombre}'.`
        });

        res.status(201).json({ message: 'Geocerca creada exitosamente', id: newGeofenceId });
    } catch (error) {
        console.error('Error creando geocerca:', error);
        res.status(500).json({ message: 'Error interno al crear geocerca' });
    }
};

exports.getGeofences = async (req, res) => {
    try {
        const [geofences] = await db.query('SELECT * FROM Geofences');
        
        const geofencesParsed = geofences.map(gf => ({
            ...gf,
            coordenadas: typeof gf.coordenadas === 'string' ? JSON.parse(gf.coordenadas) : gf.coordenadas
        }));

        res.json(geofencesParsed);
    } catch (error) {
        console.error('Error obteniendo geocercas:', error);
        res.status(500).json({ message: 'Error interno al obtener geocercas' });
    }
};

exports.updateGeofence = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, tipo, coordenadas, radio } = req.body;
        const userId = req.user.id;

        if (!nombre || !tipo || !coordenadas) {
            return res.status(400).json({ message: 'Faltan datos requeridos' });
        }

        const [result] = await db.query(
            'UPDATE Geofences SET nombre = ?, tipo = ?, coordenadas = ?, radio = ? WHERE id_geofence = ?',
            [nombre, tipo, JSON.stringify(coordenadas), radio || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Geocerca no encontrada' });
        }

        logAction({
            id_user_action: userId,
            action_type: 'GEOFENCE_UPDATE',
            target_entity: 'Geofences',
            target_id: id,
            details: `El usuario ${userId} actualizó la geocerca ${id} ('${nombre}').`
        });

        res.json({ message: 'Geocerca actualizada exitosamente' });
    } catch (error) {
        console.error('Error actualizando geocerca:', error);
        res.status(500).json({ message: 'Error interno al actualizar geocerca' });
    }
};

exports.deleteGeofence = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [result] = await db.query('DELETE FROM Geofences WHERE id_geofence = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Geocerca no encontrada' });
        }

        logAction({
            id_user_action: userId,
            action_type: 'GEOFENCE_DELETE',
            target_entity: 'Geofences',
            target_id: id,
            details: `El usuario ${userId} eliminó la geocerca ${id}.`
        });

        res.json({ message: 'Geocerca eliminada exitosamente' });
    } catch (error) {
        console.error('Error eliminando geocerca:', error);
        res.status(500).json({ message: 'Error interno al eliminar geocerca' });
    }
};
