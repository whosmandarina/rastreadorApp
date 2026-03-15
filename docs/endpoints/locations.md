# Locations (tabla Locations)
Base: http://localhost:3000

## POST /api/locations/sync
- Rol: USER o ADMIN. Requiere header Authorization: Bearer <token> y Content-Type: application/json.
- Body ejemplo (array ordenado de ubicaciones):
{
  "locations": [
    {
      "latitud": 19.4326,          // number requerido
      "longitud": -99.1332,        // number requerido
      "precision_gps": 5.2,        // number opcional
      "velocidad": 20,             // number opcional
      "bateria": 85,               // int opcional
      "senal": "LTE",            // string opcional
      "timestamp_captura": "2026-03-10T10:00:00Z" // string fecha ISO requerido
    }
  ]
}
- Exito 200: { "message": "Sincronizacion offline completada exitosamente", "puntos_guardados": 1 }
- Errores: 400 sin locations o arreglo vacio; 401/403 token/rol invalido; 500 error servidor.

Relacion con reportes: los endpoints de /api/reports leen esta tabla (ver reports.md).
