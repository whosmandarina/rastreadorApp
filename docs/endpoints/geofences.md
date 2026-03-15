# Geofences (tabla Geofences y Geofence_Events)
Base: http://localhost:3000
Requiere Authorization: Bearer <token>.

## POST /api/geofences
- Rol: ADMIN
- Body ejemplo:
{
  "nombre": "Zona Planta",        // string requerido
  "tipo": "CIRCLE",              // enum: CIRCLE | POLYGON
  "coordenadas": { "lat": 19.4, "lng": -99.1 }, // para CIRCLE
  "radio": 150                     // number requerido si tipo CIRCLE
}
(Para POLYGON, coordenadas es un arreglo de {lat, lng} y radio es opcional.)
- Exito 201: { "message": "Geocerca creada exitosamente", "id": 1 }
- Errores: 400 datos faltantes o tipo invalido; 401/403 auth; 500 error.

## GET /api/geofences
- Roles: ADMIN o SUPERVISOR
- Body: ninguno.
- Exito 200: arreglo de geocercas con coordenadas parseadas.
- Errores: 401/403 auth; 500 error.

## PUT /api/geofences/:id
- Rol: ADMIN
- Actualiza una geocerca existente.
- Body: Mismo formato que el POST.
- Exito 200: { "message": "Geocerca actualizada exitosamente" }
- Errores: 404 no encontrada; 401/403 auth; 500 error.

## DELETE /api/geofences/:id
- Rol: ADMIN
- Elimina una geocerca.
- Body: ninguno.
- Exito 200: { "message": "Geocerca eliminada exitosamente" }
- Errores: 404 no encontrada; 401/403 auth; 500 error.

Notas sobre Geofence_Events:
- No hay endpoints publicos para Geofence_Events.
- Se crean automaticamente cuando se insertan ubicaciones y se detecta ENTER o EXIT; tambien generan Alerts.
