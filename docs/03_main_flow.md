# Flujos y Puntos de Entrada

El sistema "Rastreador" expone dos vías principales de interacción: la API REST y el canal de WebSockets, orquestando el flujo de datos desde la captura hasta la visualización.

## 1. Puntos de entrada

### API REST (HTTP)
El backend escucha peticiones HTTP en el puerto definido (por defecto **3000**). Todos los endpoints están prefijados con `/api`.

| Prefijo | Responsabilidad |
| :--- | :--- |
| **`/api/auth`** | Gestión de sesiones y seguridad. |
| **`/api/locations`** | Recepción de ubicaciones (Real-time y Offline). |
| **`/api/geofences`** | Administración de zonas virtuales. |
| **`/api/alerts`** | Historial de eventos críticos. |
| **`/api/reports`** | Exportación de datos. |

### Tiempo Real (Socket.io)
- **`updateLocation`**: Emite posiciones de usuarios al Dashboard.
- **`newAlert`**: Notifica alertas críticas instantáneamente.

---

## 2. Ciclo de Vida de una Petición

1. **Cliente**: El frontend realiza una petición o emite un evento de socket.
2. **Middleware**: Se valida el JWT y los permisos de rol (`auth.middleware.js`).
3. **Ruta/Controlador**: Se valida la entrada y se coordina la respuesta.
4. **Servicio**: Se ejecuta lógica compleja (ej. `geofence.service.js`).
5. **Base de Datos**: Persistencia de datos en MySQL.
6. **Respuesta/Emisión**: Se confirma al cliente y se actualizan los dashboards vía Socket.

---

## 3. Flujo de Sincronización Offline

Este es un proceso crítico para garantizar la integridad de los datos cuando no hay cobertura de red:

1. **Captura**: La App Móvil guarda coordenadas localmente.
2. **Sincronización**: Al recuperar conexión, envía el lote a `/api/locations/sync`.
3. **Procesamiento**: El backend usa una **transacción SQL** para:
   - Guardar cada punto en la tabla `Locations`.
   - Evaluar retrospectivamente cada punto contra las geocercas.
   - Generar alertas si hubo entradas/salidas durante el periodo offline.
4. **Confirmación**: Se libera la cola local de la aplicación.
