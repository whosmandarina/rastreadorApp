# Reports (usa tabla Locations)
Base: http://localhost:3000
Roles: ADMIN o SUPERVISOR, requiere Authorization: Bearer <token>.

## GET /api/reports/route/:userId
- Query obligatorios: startDate, endDate (ISO o yyyy-mm-dd).
- Body: ninguno.
- Exito 200: arreglo de ubicaciones ordenadas por timestamp.
- Errores: 400 faltan fechas; 401/403 auth; 500 error.

## GET /api/reports/stats/:userId
- Query: startDate, endDate obligatorios.
- Exito 200 ejemplo:
{
  "velocidad_promedio": "18.42",
  "tiempo_total_parado_minutos": "12.00",
  "paradas": [ { "start": "2026-03-10T09:00:00Z", "end": "2026-03-10T09:05:00Z", "lat": 19.1, "lng": -99.1, "duracion_minutos": 5 } ]
}
- Errores: 400 faltan fechas; 500 error interno; 401/403 auth.

## GET /api/reports/export/pdf/:userId
- Query: startDate, endDate obligatorios.
- Exito 200: descarga de PDF (Content-Type application/pdf).
- Errores: 404 usuario no existe; 401/403 auth; 500 error.

## GET /api/reports/export/excel/:userId
- Query: startDate, endDate obligatorios.
- Exito 200: descarga de Excel (xlsx) con ubicaciones.
- Errores: 401/403 auth; 500 error.
