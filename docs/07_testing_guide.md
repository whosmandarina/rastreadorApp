# Pruebas de la API REST - Rastreador

Este documento contiene los comandos de PowerShell para probar rápidamente los endpoints principales de nuestra API. Esto es útil para el equipo de backend para verificar que todo funciona correctamente después de levantar los contenedores de Docker.

Asegúrate de que tus contenedores están corriendo antes de ejecutar estas pruebas (`docker compose up -d`).

---

## 1. Verificar estado del servidor

Verifica si la API está respondiendo en la ruta raíz.

\`\`\`powershell
Invoke-RestMethod -Uri "http://localhost:3000" -Method Get
\`\`\`
**Respuesta esperada:** `Servidor API Rastreador en funcionamiento 🚀`

---

## 2. Flujo de autenticación

### A. Registrar un usuario (Administrador)
Crea un usuario inicial para realizar pruebas.

\`\`\`powershell
$body = @{ 
    nombre="Admin Test"; 
    correo="admin@test.com"; 
    password="password123"; 
    rol="ADMIN" 
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method Post -Body $body -ContentType "application/json"
\`\`\`
**Respuesta esperada:** Un mensaje de éxito y el `userId`. *(Nota: Si lo ejecutas dos veces, dará error porque el correo es único).*

### B. Iniciar Sesión y obtener JWT
Inicia sesión para obtener el token necesario para acceder a las rutas protegidas.

\`\`\`powershell
$body = @{ 
    correo="admin@test.com"; 
    password="password123" 
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method Post -Body $body -ContentType "application/json"

# Guardar el token en una variable para las siguientes pruebas
$token = $response.token
Write-Host "Token obtenido: $token"
\`\`\`
**Respuesta esperada:** Mensaje de éxito, los datos del usuario y el string largo del Token.

---

## 3. Pruebas de Rutas Protegidas

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
