# Capa de Acceso a Datos

## Herramientas de conexión
- **MySQL2**: Librería utilizada para establecer el pool de conexiones.
- **Transacciones SQL**: Se emplean para asegurar que los lotes de ubicaciones (sincronización offline) se guarden de forma atómica.

## Entidades principales (Basadas en `schema.sql`)

1. **`Users`**: Usuarios registrados con roles (ADMIN, SUPERVISOR, CLIENT, USER). PK: `id_user`.
2. **`Clients`**: Empresas u organizaciones. PK: `id_client`. Contiene `nombre_empresa` e `id_user_admin`.
3. **`User_Client`**: Relación entre un usuario rastreado (USER) y un cliente (CLIENT).
4. **`Supervisor_User`**: Asignación de usuarios a supervisores para su monitoreo.
5. **`Locations`**: Historial de coordenadas. Campos clave: `latitud`, `longitud`, `velocidad`, `bateria`, `timestamp_captura`, `estado_sincronizacion`.
6. **`Geofences`**: Zonas virtuales (CIRCLE o POLYGON). Coordenadas almacenadas como JSON.
7. **`Geofence_Events`**: Registro histórico de entradas y salidas de geocercas.
8. **`Alerts`**: Alertas críticas (BATTERY_LOW, SIGNAL_LOST, GEOFENCE_ENTER, etc.).
9. **`Consents`**: Registro de aceptación legal. Campos: `accepted_at`, `ip_address`, `user_agent`.
10. **`Sessions`**: Control de sesiones activas por dispositivo mediante `token_jti`.

## Diagrama entidad-relación

```mermaid
erDiagram
    USERS ||--o{ LOCATIONS : transmits
    USERS ||--o{ GEOFENCES : creates
    USERS ||--o{ GEOFENCE_EVENTS : triggers
    USERS ||--o{ ALERTS : has
    USERS ||--o{ CONSENTS : gives
    USERS ||--o{ SESSIONS : starts
    
    USERS ||--o{ SUPERVISOR_USER : supervises_as_supervisor
    USERS ||--o{ SUPERVISOR_USER : is_supervised_as_user
    
    USERS ||--o{ USER_CLIENT : belongs_to_as_user
    CLIENTS ||--o{ USER_CLIENT : has_as_client
    
    CLIENTS }o--|| USERS : managed_by_client_admin
    
    GEOFENCES ||--o{ GEOFENCE_EVENTS : defines

    CLIENTS {
        INT id_client
        VARCHAR nombre_empresa
        VARCHAR contacto
        INT id_user_admin
        DATETIME created_at
    }

    USER_CLIENT {
        INT id
        INT id_user
        INT id_client
    }

    SUPERVISOR_USER {
        INT id
        INT id_supervisor
        INT id_user
    }

    GEOFENCES {
        INT id_geofence
        VARCHAR nombre
        ENUM tipo
        JSON coordenadas
        FLOAT radio
        INT created_by
        DATETIME created_at
    }

    GEOFENCE_EVENTS {
        BIGINT id_event
        INT id_user
        INT id_geofence
        ENUM tipo_evento
        DATETIME timestamp_evento
    }

    ALERTS {
        BIGINT id_alert
        INT id_user
        ENUM tipo_alerta
        TEXT descripcion
        DATETIME timestamp_alerta
        BOOLEAN is_read
    }

    CONSENTS {
        INT id_consent
        INT id_user
        DATETIME accepted_at
        VARCHAR ip_address
        TEXT user_agent
    }

    SESSIONS {
        INT id_session
        INT id_user
        VARCHAR token_jti
        VARCHAR device_id
        DATETIME login_time
        BOOLEAN is_active
    }
    
    LOCATIONS {
        BIGINT id_location
        INT id_user
        DECIMAL latitud
        DECIMAL longitud
        FLOAT precision_gps
        FLOAT velocidad
        INT bateria
        VARCHAR senal
        DATETIME timestamp_captura
        TIMESTAMP timestamp_recepcion
        ENUM estado_sincronizacion
    }
    
    USERS {
        INT id_user
        VARCHAR nombre
        VARCHAR correo
        VARCHAR telefono
        VARCHAR identificador_interno
        VARCHAR password
        ENUM rol
        BOOLEAN is_active
    }

    CLIENTS {
        INT id_client
        VARCHAR nombre_empresa
        VARCHAR contacto
        INT id_user_admin
    }

    GEOFENCES {
        INT id_geofence
        VARCHAR nombre
        ENUM tipo
        JSON coordenadas
        FLOAT radio
        INT created_by
    }
```

