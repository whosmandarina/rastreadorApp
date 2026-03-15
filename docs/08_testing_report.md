# Reporte de Verificación de APIs - Rastreador

Este documento detalla las pruebas de verificación realizadas sobre la API del proyecto Rastreador el 10 de marzo de 2026.

## 1. Resumen de Correcciones Realizadas
Durante la fase de verificación inicial, se detectaron discrepancias críticas entre los controladores de la API y el esquema de la base de datos (`schema.sql`). Se realizaron las siguientes correcciones para asegurar el funcionamiento:

- **`client.controller.js`**: Se actualizaron las columnas de `id` -> `id_client` y `nombre` -> `nombre_empresa`.
- **`user_client.controller.js`**: Se corrigieron las uniones (JOINs) para usar `id_user` e `id_client`.
- **`supervisor_user.controller.js`**: Se corrigieron las referencias a `u.id` por `u.id_user`.
- **`consent.controller.js`**: Se alinearon los campos de inserción con `accepted_at`, `ip_address` y `user_agent`.

---

## 2. Pruebas de Autenticación

### A. Registro de Usuarios
Se registraron tres tipos de usuarios para las pruebas:
- **Admin**: `admin@test.com`
- **Supervisor**: `supervisor@test.com`
- **Usuario (Rastreado)**: `user@test.com`

**Resultado:** ✅ Exitoso (`201 Created`).

### B. Inicio de Sesión
**Comando:**
```powershell
$body = @{ correo="admin@test.com"; password="password123" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
```
**Resultado:** ✅ Exitoso. Se obtuvo el token JWT para las rutas protegidas.

---

## 3. Pruebas de Gestión (ADMIN)

### A. Clientes
- **Creación:** Se creó la empresa "Empresa Test SA".
- **Listado:** Se verificó que el endpoint `GET /api/clients` devuelve el array con el cliente creado.

### B. Asignaciones
- **Usuario a Cliente:** Se asignó el usuario 3 al cliente 1.
- **Supervisor a Usuario:** Se asignó el supervisor 2 al usuario 3.
- **Verificación:** Se consultaron los endpoints `/api/user-clients/client/1/users` y `/api/supervisor-users/supervisor/2/users` confirmando las relaciones.

---

## 4. Pruebas de Operación (USER / APP MÓVIL)

### A. Sincronización de Ubicaciones (Offline Sync)
Se simuló el envío de un lote de 2 ubicaciones para el usuario 3.
**Resultado:** ✅ Exitoso. `message: "Sincronización offline completada exitosamente", puntos_guardados: 2`.

### B. Consentimientos
Se registró el consentimiento legal para el usuario 3 y se verificó su recuperación.
**Resultado:** ✅ Exitoso. Los datos coinciden con el esquema (IP y User Agent capturados).

---

## 5. Pruebas de Monitoreo y Reportes (ADMIN / SUPERVISOR)

### A. Geocercas
Se creó una geocerca circular llamada "Parque Central" y se listó correctamente.
**Resultado:** ✅ Exitoso. Las coordenadas se guardan y recuperan como JSON.

### B. Reporte de Ruta y Estadísticas
Se consultó el historial del usuario 3.
- **Ruta:** Se recuperaron los 2 puntos sincronizados previamente.
- **Estadísticas:** El sistema calculó correctamente la **velocidad promedio (12.50 km/h)** basándose en los datos reales.

---

## 6. Conclusión de Calidad
Tras las correcciones en la capa de controladores, **el 100% de los endpoints principales de la API están operativos y son consistentes con la base de datos.** El entorno Dockerizado es estable y está listo para integración con el frontend o aplicaciones móviles.
