# Alerts (tabla Alerts)
Base: http://localhost:3000
Requiere Authorization: Bearer <token>. Roles: ADMIN o SUPERVISOR.

## GET /api/alerts
- Query opcionales: limit (default 50), offset (default 0), unreadOnly=true para solo no leidas.
- Body: ninguno.
- Exito 200: lista de alertas con campos de usuario.
- Errores: 401/403 auth; 500 error.

## PUT /api/alerts/:id/read
- Body: ninguno.
- Exito 200: { "message": "Alerta marcada como leida" }
- Errores: 401/403 auth; 500 error.

Origen de alertas: se generan automaticamente desde geofence.service al procesar ubicaciones (enter/exit) y otros tipos como battery/signal si se implementan en el futuro.
