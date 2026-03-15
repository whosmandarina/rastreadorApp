# Visión General

## Índice de documentación técnica
Para una comprensión profunda del sistema, consulte los siguientes documentos en orden:

1.  **[Visión General y Estructura](01_overview.md)**: Resumen ejecutivo, stack tecnológico y estructura del proyecto.
2.  **[Componentes Clave](02_key_components.md)**: Arquitectura detallada de Frontend y Backend.
3.  **[Flujos y Puntos de Entrada](03_main_flow.md)**: Ciclo de vida de peticiones, API REST y WebSockets.
4.  **[Capa de Datos](04_data_layer.md)**: Entidades y Diagrama Entidad-Relación (MER).
5.  **[Actores y Diagramas](05_actors_and_diagrams.md)**: Roles de usuario y diagramas de secuencia.
6.  **[Referencia de API](06_api_reference.md)**: Contratos REST y formatos JSON.
7.  **[Guía de Pruebas](07_testing_guide.md)**: Cómo ejecutar y crear pruebas automatizadas.

---

## Resumen Ejecutivo
**Rastreador** es una plataforma backend para rastreo de personas y vehículos en tiempo real. Permite gestionar usuarios, dispositivos GPS, geocercas (zonas geográficas), alertas y reportes. El sistema ofrece comunicación en tiempo real mediante WebSockets para visualización live de ubicaciones.

### Funcionalidades Principales
| Módulo | Descripción |
| :--- | :--- |
| **Autenticación** | Registro, login y gestión de sesiones con JWT. Roles: ADMIN, SUPERVISOR, CLIENT, USER. |
| **Ubicación en Tiempo Real** | Recepción de coordenadas GPS vía WebSockets (Socket.io). Sincronización offline para dispositivos que recuperan conexión. |
| **Geocercas** | Definición de zonas circulares o poligonales. Detección automática de entrada/salida y generación de alertas. |
| **Alertas** | Notificaciones por batería baja, pérdida de señal, desconexión y eventos de geocercas. |
| **Reportes** | Generación de reportes en formato PDF y Excel. |
| **Dashboard Web** | Panel de administración para supervisores y administradores con visualización en tiempo real. |

### Características Técnicas
- **Tiempo Real**: WebSockets con salas diferenciadas (dashboard vs usuarios rastreados).
- **Sincronización Offline**: La app móvil puede enviar ubicaciones almacenadas cuando recupera conexión.
- **Sistema de Permisos**: Middleware de autenticación y control de roles por endpoint.
- **Base de Datos**: MySQL con pool de conexiones.

## Stack Tecnológico
- **Backend**: Node.js con Express.
- **Base de Datos**: MySQL (utilizando `mysql2`).
- **Comunicación en Tiempo Real**: Socket.io (WebSockets).
- **Autenticación**: JSON Web Tokens (JWT) y `bcryptjs`.
- **Generación de Archivos**: `pdfkit` (PDF) y `exceljs` (Excel).
- **Utilidades Geográficas**: `geolib`.

## Arquitectura general
El sistema sigue un modelo cliente-servidor con una arquitectura basada en capas en el backend:
- **Capa de rutas**: Define los endpoints de la API REST.
- **Capa de controladores**: Maneja la lógica de las peticiones HTTP.
- **Capa de servicios**: Contiene la lógica de negocio compleja (ej. procesamiento de geocercas).
- **Capa de sockets**: Gestiona la comunicación en tiempo real.
- **Capa de datos**: Interactúa directamente con MySQL.

---

## Estructura del proyecto

```text
├───database/                # Scripts de base de datos y esquemas SQL.
│   └───data/
│       └───schema.sql       # Definición de tablas y relaciones.
├───docs/                    # Documentación técnica del sistema.
├───src/                     # Código fuente del Backend (Node.js/Express).
│   ├───config/              # Configuraciones de conexión a la BD.
│   ├───controllers/         # Controladores de peticiones HTTP.
│   ├───middlewares/         # Middlewares (Auth, Roles).
│   ├───routes/              # Definición de rutas de la API REST.
│   ├───services/            # Lógica de negocio especializada.
│   └───sockets/             # Comunicación en tiempo real.
├───index.js                 # Punto de entrada principal.
└───package.json             # Dependencias y scripts.
```

### Responsabilidades clave

| Directorio | Responsabilidad |
| :--- | :--- |
| **`src/config/`** | Centraliza las configuraciones globales y pool de conexiones. |
| **`src/routes/`** | Expone los endpoints de la API (Auth, Locations, Geofences, Alerts, Reports). |
| **`src/controllers/`** | Implementa la lógica de manejo de cada ruta. |
| **`src/middlewares/`** | Asegura autenticación y validación de roles. |
| **`src/services/`** | Encapsula lógica compleja como detección de geocercas. |
| **`src/sockets/`** | Define eventos para el flujo de ubicaciones en tiempo real. |

---

## Ejecución local
1. Configurar `.env` a partir de `env-ejemplo`.
2. Ejecutar: `docker-compose up --build -d`.
3. Puerto por defecto: **3000**.
