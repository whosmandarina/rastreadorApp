const db = require('../config/db');
const geolib = require('geolib');

exports.checkLocationAgainstGeofences = async (
  userId,
  lat,
  lng,
  timestamp,
  io,
) => {
  try {
    // Obtener todas las geocercas activas
    const [geofences] = await db.query('SELECT * FROM Geofences');

    for (const geofence of geofences) {
      let isInside = false;

      if (geofence.tipo === 'CIRCLE') {
        const center = geofence.coordenadas; // Se asume formato JSON { "lat": X, "lng": Y }
        const distance = geolib.getDistance(
          { latitude: lat, longitude: lng },
          { latitude: center.lat, longitude: center.lng },
        );
        isInside = distance <= geofence.radio;
      } else if (geofence.tipo === 'POLYGON') {
        const polygon = geofence.coordenadas; // Se asume array JSON [{ "lat": X, "lng": Y }, ...]
        const formattedPolygon = polygon.map((p) => ({
          latitude: p.lat,
          longitude: p.lng,
        }));
        isInside = geolib.isPointInPolygon(
          { latitude: lat, longitude: lng },
          formattedPolygon,
        );
      }

      // Buscar último evento de este usuario en esta geocerca
      const [lastEventRows] = await db.query(
        'SELECT tipo_evento FROM Geofence_Events WHERE id_user = ? AND id_geofence = ? ORDER BY timestamp_evento DESC LIMIT 1',
        [userId, geofence.id_geofence],
      );

      let lastEventType =
        lastEventRows.length > 0 ? lastEventRows[0].tipo_evento : null;
      let newEventType = null;

      if (isInside && lastEventType !== 'ENTER') {
        newEventType = 'ENTER';
      } else if (!isInside && lastEventType === 'ENTER') {
        newEventType = 'EXIT';
      }

      if (newEventType) {
        // 1. Registrar evento en BD
        await db.query(
          'INSERT INTO Geofence_Events (id_user, id_geofence, tipo_evento, timestamp_evento) VALUES (?, ?, ?, ?)',
          [userId, geofence.id_geofence, newEventType, new Date(timestamp)],
        );

        // 2. Crear alerta en BD
        const alertType =
          newEventType === 'ENTER' ? 'GEOFENCE_ENTER' : 'GEOFENCE_EXIT';
        const accion = newEventType === 'ENTER' ? 'entrado a' : 'salido de';
        const descripcion = `El usuario ha ${accion} la geocerca: ${geofence.nombre}`;

        const [alertResult] = await db.query(
          'INSERT INTO Alerts (id_user, tipo_alerta, descripcion, timestamp_alerta) VALUES (?, ?, ?, ?)',
          [userId, alertType, descripcion, new Date(timestamp)],
        );

        // 3. Emitir alerta en tiempo real al dashboard (si io está disponible)
        if (io) {
          io.to('dashboard_room').emit('new_alert', {
            id_alert: alertResult.insertId,
            id_user: userId,
            tipo_alerta: alertType,
            descripcion,
            timestamp_alerta: timestamp,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error verificando geocercas:', error);
  }
};
