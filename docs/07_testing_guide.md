# Pruebas de la API REST - Rastreador

Este documento contiene los comandos de PowerShell para probar rápidamente los endpoints principales de nuestra API. Esto es útil para el equipo de backend para verificar que todo funciona correctamente después de levantar los contenedores de Docker.

Asegúrate de que tus contenedores están corriendo antes de ejecutar estas pruebas (`docker compose up -d`).

> Nota importante: el endpoint `/api/auth/register` **no crea ADMIN**. El registro público crea usuarios `USER` y requiere `codigo_supervisor` válido.

---

## 1. Verificar estado del servidor

Verifica si la API está respondiendo en la ruta raíz.

\`\`\`powershell
Invoke-RestMethod -Uri "http://localhost:3000" -Method Get
\`\`\`
**Respuesta esperada:** `Servidor API Rastreador en funcionamiento 🚀`

---

## 2. Flujo de autenticación

### A. Crear usuario ADMIN inicial (SQL directo)

Si aún no existe un administrador, créalo directamente en BD (el password debe ir en hash bcrypt).

\`\`\`powershell

# 1) Generar hash bcrypt dentro del contenedor backend

$hash = docker compose exec backend node -e "const b=require('bcryptjs'); b.hash('Admin123\*',10).then(h=>console.log(h))"

# 2) Insertar ADMIN (ajusta DB según tus variables)

docker compose exec db mysql -uroot -p"$env:MYSQL_ROOT_PASSWORD" -D "$env:MYSQL_DATABASE" -e "INSERT INTO Users (nombre, correo, telefono, password, rol, is_active) VALUES ('Admin','admin@rastreador.local',NULL,'$hash','ADMIN',1);"
\`\`\`

### B. Iniciar Sesión y obtener JWT (ADMIN)

Inicia sesión para obtener el token necesario para acceder a las rutas protegidas.

\`\`\`powershell
$body = @{
correo="admin@rastreador.local";
password="Admin123\*"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"

# Guardar el token en una variable para las siguientes pruebas

$token = $response.token
Write-Host "Token obtenido: $token"
\`\`\`
**Respuesta esperada:** Mensaje de éxito, los datos del usuario y el string largo del Token.

---

### C. Registro público USER con código de supervisor

El registro requiere `codigo_supervisor` de un usuario `SUPERVISOR` activo.

\`\`\`powershell
$body = @{
nombre="Usuario Demo";
correo="usuario.demo@test.com";
password="Password123";
telefono="3121234567";
codigo_supervisor=2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
\`\`\`

---

## 3. Pruebas de Validación (Zod)

### A. Login inválido (password corto)

\`\`\`powershell
$body = @{
correo="test@test.com";
password="123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"
\`\`\`
**Respuesta esperada:** HTTP 400 con mensaje: `password must have at least 8 characters`.

### B. Registro inválido (email mal formato)

\`\`\`powershell
$body = @{
nombre="Usuario Prueba";
correo="correo-invalido";
password="Password123";
codigo_supervisor=2
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
\`\`\`
**Respuesta esperada:** HTTP 400 con mensaje: `email must be valid`.

### C. Geocerca inválida (lat/lng fuera de rango)

\`\`\`powershell
$body = @{
nombre="Zona Test";
tipo="CIRCLE";
coordenadas=@{ lat=999; lng=-999 };
radio=100
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:3000/api/geofences" -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization="Bearer $token" }
\`\`\`
**Respuesta esperada:** HTTP 400 con mensaje: `latitude must be between -90 and 90` o `longitude must be between -180 and 180`.

### D. Geocerca inválida (radio fuera de rango)

\`\`\`powershell
$body = @{
nombre="Zona Test";
tipo="CIRCLE";
coordenadas=@{ lat=19.4326; lng=-99.1332 };
radio=5
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:3000/api/geofences" -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization="Bearer $token" }
\`\`\`
**Respuesta esperada:** HTTP 400 con mensaje: `radius must be between 10 and 50000 meters`.

---

## 4. Pruebas de Rutas Protegidas

Asegúrate de haber ejecutado el paso **2.B** en la misma ventana de PowerShell para que la variable `$token` exista.

### A. Obtener Alertas (Requiere rol ADMIN o SUPERVISOR)

Verifica que el middleware de validación de JWT y el chequeo de roles están funcionando.

\`\`\`powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/alerts" -Method Get -Headers @{ Authorization="Bearer $token" }
\`\`\`
**Respuesta esperada:** Un array vacío `[]` (si no hay alertas generadas aún). Si el token no es válido, regresará un error 401.

### B. Sincronizar ubicaciones (Modo Offline)

Simula la app móvil enviando un lote de ubicaciones históricas guardadas al servidor.

\`\`\`powershell
$locationsBody = @{
locations = @(
@{ latitud = 19.4326; longitud = -99.1332; timestamp_captura = (Get-Date).AddMinutes(-10).ToString("yyyy-MM-ddTHH:mm:ssZ") },
@{ latitud = 19.4330; longitud = -99.1330; timestamp_captura = (Get-Date).AddMinutes(-5).ToString("yyyy-MM-ddTHH:mm:ssZ") }
)
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/locations/sync" -Method Post -Body $locationsBody -ContentType "application/json" -Headers @{ Authorization="Bearer $token" }
\`\`\`
**Respuesta esperada:** Mensaje "Sincronización offline completada exitosamente" y `puntos_guardados: 2`.

---

## 5. Crear geocerca válida (control positivo)

\`\`\`powershell
$body = @{
nombre="Zona Centro";
tipo="CIRCLE";
coordenadas=@{ lat=19.4326; lng=-99.1332 };
radio=150
} | ConvertTo-Json -Depth 5

Invoke-RestMethod -Uri "http://localhost:3000/api/geofences" -Method Post -Body $body -ContentType "application/json" -Headers @{ Authorization="Bearer $token" }
\`\`\`
**Respuesta esperada:** HTTP 201 con mensaje `Geocerca creada exitosamente`.
