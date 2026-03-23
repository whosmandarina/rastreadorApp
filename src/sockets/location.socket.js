const db = require('../config/db');
const geofenceService = require('../services/geofence.service');
const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // 1. Middleware de Socket.IO para proteger las conexiones en tiempo real
  io.use((socket, next) => {
    const token =
      socket.handshake.auth.token || socket.handshake.headers['authorization'];

    if (!token) {
      return next(new Error('Autenticación fallida: Token no proporcionado'));
    }

    try {
      const secret =
        process.env.JWT_SECRET || 'secret_rastreador_development_123';
      const decoded = jwt.verify(token.replace('Bearer ', ''), secret);
      socket.user = decoded; // Guardar datos del usuario dentro del socket
      next();
    } catch (err) {
      return next(
        new Error('Autenticación fallida: Token inválido o expirado'),
      );
    }
  });

  // 2. Manejo de la conexión aceptada
  io.on('connection', (socket) => {
    console.log(
      `🔌 [Socket.IO] Cliente conectado: ${socket.id} (Rol: ${socket.user.rol})`,
    );

    // Organizamos a los clientes en "salas" (rooms) según su rol
    if (socket.user.rol === 'ADMIN' || socket.user.rol === 'SUPERVISOR') {
      socket.join('dashboard_room'); // Los del dashboard escuchan todo el tráfico
      console.log(`📡 Dashboard suscrito (ID: ${socket.user.id})`);
    } else if (socket.user.rol === 'USER') {
      // Un usuario rastreado también notifica cuando se conecta (reconexión)
      io.to('dashboard_room').emit('user_status_changed', {
        id_user: socket.user.id,
        status: 'ONLINE',
      });
    }

    // 3. Evento: Recibir ubicación en tiempo real desde la App Móvil
    socket.on('update_location', async (data) => {
      try {
        const userId = socket.user.id;
        const timestamp = data.timestamp_captura || new Date();

        // 3.1 Guardar en base de datos
        await db.query(
          `INSERT INTO Locations 
                    (id_user, latitud, longitud, precision_gps, velocidad, bateria, senal, timestamp_captura, estado_sincronizacion) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REALTIME')`,
          [
            userId,
            data.latitud,
            data.longitud,
            data.precision_gps || null,
            data.velocidad || null,
            data.bateria || null,
            data.senal || null,
            new Date(timestamp),
          ],
        );

        // 3.2 Verificar reglas de geocercas (si entró o salió) y disparar alertas si es necesario
        await geofenceService.checkLocationAgainstGeofences(
          userId,
          data.latitud,
          data.longitud,
          timestamp,
          io,
        );

        // 3.3 Re-transmitir la ubicación solo a los usuarios del dashboard web (Administradores/Supervisores)
        io.to('dashboard_room').emit('location_updated', {
          id_user: userId,
          latitud: data.latitud,
          longitud: data.longitud,
          velocidad: data.velocidad,
          bateria: data.bateria,
          senal: data.senal,
          timestamp_captura: timestamp,
          status: 'ONLINE',
        });
      } catch (error) {
        console.error('❌ Error procesando evento update_location:', error);
      }
    });

    // 4. Manejo de desconexiones
    socket.on('disconnect', () => {
      console.log(`🔌 [Socket.IO] Cliente desconectado: ${socket.id}`);

      if (socket.user.rol === 'USER') {
        // Notificar al dashboard que el usuario perdió la conexión (posible pérdida de señal o app cerrada)
        io.to('dashboard_room').emit('user_status_changed', {
          id_user: socket.user.id,
          status: 'OFFLINE',
          timestamp: new Date(),
        });
      }
    });
  });
};
