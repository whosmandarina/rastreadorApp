# Componentes Clave

La arquitectura del sistema se divide en componentes modulares, cada uno con una responsabilidad clara en el procesamiento del flujo de rastreo.

## Backend (Node.js/Express)

### 1. Controladores (Controllers)
Encargados de recibir las peticiones HTTP, extraer los datos del cuerpo o parámetros, y orquestar la respuesta.
- **`auth.controller.js`**: Gestiona el ciclo de vida del usuario (registro, login, logout).
- **`location.controller.js`**: Maneja la recepción de ubicaciones, en especial el proceso de sincronización offline.
- **`geofence.controller.js`**: Operaciones CRUD sobre las geocercas configuradas.
- **`alert.controller.js`**: Consulta y gestión de las alertas generadas por el sistema.
- **`report.controller.js`**: Generación de reportes PDF y Excel sobre la actividad de los usuarios.

### 2. Middlewares
Capas intermedias que filtran o transforman las peticiones antes de llegar al controlador.
- **`auth.middleware.js`**: Verifica la validez del JWT y comprueba los permisos de rol (ADMIN, SUPERVISOR, etc.).

### 3. Servicios (Services)
Lógica de negocio especializada.
- **`geofence.service.js`**: Contiene el motor de cálculo espacial que determina si un punto (lat, lng) entra o sale de una geocerca, emitiendo alertas en tiempo real.

### 4. Sockets
Gestión de eventos en tiempo real.
- **`location.socket.js`**: Define el canal `updateLocation` que emite las nuevas posiciones de los usuarios hacia el dashboard web.

### 5. Configuración (Config)
- **`db.js`**: Establece el pool de conexiones hacia MySQL, optimizando el rendimiento mediante la reutilización de conexiones.
