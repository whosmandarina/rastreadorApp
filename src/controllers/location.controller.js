const db = require('../config/db');
const geofenceService = require('../services/geofence.service');

exports.syncOfflineLocations = async (req, res) => {
    try {
        const { locations } = req.body;
        const userId = req.user.id;
        const io = req.app.get('io'); // Instancia de Socket.io inyectada en index.js

        if (!locations || !Array.isArray(locations) || locations.length === 0) {
            return res.status(400).json({ message: 'Se requiere un array de ubicaciones' });
        }

        // Ordenar ubicaciones por timestamp ascendente para procesarlas en orden cronológico real
        const sortedLocations = locations.sort((a, b) => new Date(a.timestamp_captura) - new Date(b.timestamp_captura));

        // Obtener conexión para usar una transacción (si falla una, no se guarda ninguna de ese lote)
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            for (const loc of sortedLocations) {
                // 1. Guardar en tabla Locations
                await connection.query(
                    `INSERT INTO Locations 
                    (id_user, latitud, longitud, precision_gps, velocidad, bateria, senal, timestamp_captura, estado_sincronizacion) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'OFFLINE_SYNC')`,
                    [
                        userId, 
                        loc.latitud, 
                        loc.longitud, 
                        loc.precision_gps || null, 
                        loc.velocidad || null, 
                        loc.bateria || null, 
                        loc.senal || null, 
                        new Date(loc.timestamp_captura)
                    ]
                );

                // 2. Verificar reglas de geocercas para cada punto histórico (emitiendo alertas si corresponde)
                await geofenceService.checkLocationAgainstGeofences(userId, loc.latitud, loc.longitud, loc.timestamp_captura, io);
            }

            await connection.commit();
            res.json({ message: 'Sincronización offline completada exitosamente', puntos_guardados: sortedLocations.length });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error sincronizando ubicaciones:', error);
        res.status(500).json({ message: 'Error en el servidor al sincronizar ubicaciones' });
    }
};
