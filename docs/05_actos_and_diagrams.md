# Actores y Diagramas

## Roles de usuario

El sistema define roles específicos con permisos diferenciados sobre la información y las acciones disponibles.

| Rol | Descripción | Permisos Principales |
| :--- | :--- | :--- |
| **`ADMIN`** | Administrador del sistema global. | Control total (CRUD) de usuarios, clientes, geocercas y reportes. |
| **`SUPERVISOR`** | Personal de monitoreo operativo. | CRUD (Crear, Leer, Actualizar, Eliminar) de los usuarios que tiene asignados. |
| **`CLIENT`** | Representante de una empresa (cliente). | Ver y gestionar al personal y reportes asociados a su organización. |
| **`USER`** | Usuario rastreado (conductor/operario). | Transmitir ubicación, aceptar consentimiento y ver su propio estado. |

## Diagramas de Secuencia (Inferidos)

### Flujo de Inicio de Sesión y Control de Dispositivo (Rol USER)

```mermaid
sequenceDiagram
    participant MobileApp
    participant Backend
    participant DB
    
    MobileApp->>Backend: POST /api/auth/login (correo, password, device_id)
    Backend->>DB: Consultar usuario y verificar contraseña
    DB-->>Backend: Usuario válido (Rol: USER)
    Backend->>DB: Desactivar sesiones previas del usuario (UPDATE Sessions)
    Backend->>DB: Registrar nueva sesión (INSERT Sessions)
    Backend-->>MobileApp: Respuesta 200 OK (JWT + Info Usuario)
```

### Flujo de Sincronización de Ubicaciones Offline

```mermaid
sequenceDiagram
    participant MobileApp
    participant Backend
    participant GeofenceService
    participant DB
    participant DashboardWeb
    
    MobileApp->>Backend: POST /api/locations/sync (Array de ubicaciones)
    loop Cada punto de ubicación
        Backend->>DB: Guardar ubicación (INSERT Locations)
        Backend->>GeofenceService: Evaluar punto contra geocercas
        alt Entrada o Salida detectada
            GeofenceService->>DB: Registrar evento (INSERT Geofence_Events)
            GeofenceService->>DashboardWeb: Emitir evento 'newAlert' via Socket.io
        end
        Backend->>DashboardWeb: Emitir 'updateLocation' via Socket.io
    end
    Backend-->>MobileApp: Respuesta 200 OK (Confirmación de sincronización)
```
