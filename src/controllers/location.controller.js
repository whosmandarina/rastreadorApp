const db = require('../config/db');
const geofenceService = require('../services/geofence.service');

exports.syncOfflineLocations = async (req, res) => {
    try {
        const { locations } = req.body;
        const userId = req.user.id;
        const io = req.app.get('io');

        if (!locations || !Array.isArray(locations) || locations.length === 0) {
            return res.status(400).json({ message: 'Se requiere un array de ubicaciones' });
        }

        const sortedLocations = locations.sort((a, b) => new Date(a.timestamp_captura) - new Date(b.timestamp_captura));

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            for (const loc of sortedLocations) {
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

                await geofenceService.checkLocationAgainstGeofences(userId, loc.latitud, loc.longitud, loc.timestamp_captura, io);
            }

            await connection.commit();

            // ── FIX: Emitir la última ubicación al dashboard después de sincronizar ──
            if (io && sortedLocations.length > 0) {
                const last = sortedLocations[sortedLocations.length - 1];
                io.to('dashboard_room').emit('location_updated', {
                    id_user: userId,
                    latitud: last.latitud,
                    longitud: last.longitud,
                    velocidad: last.velocidad || null,
                    bateria: last.bateria || null,
                    senal: last.senal || null,
                    timestamp_captura: last.timestamp_captura,
                    status: 'ONLINE'
                });

                // También notificar que el usuario está online
                io.to('dashboard_room').emit('user_status_changed', {
                    id_user: userId,
                    status: 'ONLINE',
                    timestamp: new Date()
                });
            }

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