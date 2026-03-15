# Script de Verificacion Completa de la API - Rastreador
# Este script realiza un flujo completo de prueba: Registro, Login, Gestion, Sincronizacion y Reportes.

$baseUrl = "http://localhost:3000"

Write-Host "--- 1. VERIFICAR ESTADO DEL SERVIDOR ---" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$baseUrl/" -Method Get
} catch {
    Write-Host "Error: No se pudo conectar al servidor en $baseUrl" -ForegroundColor Red
    exit
}

Write-Host "`n--- 2. REGISTRO DE USUARIOS DE PRUEBA ---" -ForegroundColor Cyan
$users = @(
    @{ nombre="Admin Real"; correo="admin_real@test.com"; password="password123"; rol="ADMIN" },
    @{ nombre="Sup Real"; correo="sup_real@test.com"; password="password123"; rol="SUPERVISOR" },
    @{ nombre="User Real"; correo="user_real@test.com"; password="password123"; rol="USER" }
)

foreach ($u in $users) {
    try {
        $res = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body ($u | ConvertTo-Json) -ContentType "application/json"
        Write-Host "Registrado: $($u.correo)" -ForegroundColor Green
    } catch {
        Write-Host "Usuario ya existe o error: $($u.correo)" -ForegroundColor Yellow
    }
}

Write-Host "`n--- 3. LOGIN ADMIN Y OBTENCION DE TOKEN ---" -ForegroundColor Cyan
$loginBody = @{ correo="admin_real@test.com"; password="password123" } | ConvertTo-Json
$auth = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $auth.token
$headers = @{ Authorization="Bearer $token" }
Write-Host "Token obtenido correctamente." -ForegroundColor Green

Write-Host "`n--- 4. PRUEBA DE CLIENTES (CREAR Y LISTAR) ---" -ForegroundColor Cyan
$clientBody = @{ nombre_empresa="Corporativo Global SA"; contacto="Director General"; id_user_admin=$auth.user.id } | ConvertTo-Json
$newClient = Invoke-RestMethod -Uri "$baseUrl/api/clients" -Method Post -Body $clientBody -ContentType "application/json" -Headers $headers
Write-Host "Cliente creado ID: $($newClient.id)" -ForegroundColor Green
Invoke-RestMethod -Uri "$baseUrl/api/clients" -Method Get -Headers $headers | Select-Object -First 1 | ConvertTo-Json

Write-Host "`n--- 5. PRUEBA DE GEOCERCAS ---" -ForegroundColor Cyan
$geoBody = @{ nombre="Zona Segura"; tipo="CIRCLE"; coordenadas=@{lat=19.4326; lng=-99.1332}; radio=1000 } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/api/geofences" -Method Post -Body $geoBody -ContentType "application/json" -Headers $headers | ConvertTo-Json

Write-Host "`n--- 6. SINCRONIZACION DE UBICACIONES (USER) ---" -ForegroundColor Cyan
# Login como usuario para sincronizar sus propios puntos
$userLogin = @{ correo="user_real@test.com"; password="password123" } | ConvertTo-Json
$userAuth = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $userLogin -ContentType "application/json"
$userHeaders = @{ Authorization="Bearer $($userAuth.token)" }

$syncBody = @{
    locations = @(
        @{ latitud=19.4326; longitud=-99.1332; timestamp_captura=(Get-Date).AddMinutes(-20).ToString("yyyy-MM-dd HH:mm:ss"); velocidad=20 },
        @{ latitud=19.4340; longitud=-99.1350; timestamp_captura=(Get-Date).ToString("yyyy-MM-dd HH:mm:ss"); velocidad=25 }
    )
} | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/api/locations/sync" -Method Post -Body $syncBody -ContentType "application/json" -Headers $userHeaders | ConvertTo-Json

Write-Host "`n--- 7. REPORTES Y ESTADISTICAS (ADMIN) ---" -ForegroundColor Cyan
$start = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
$end = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
$userId = $userAuth.user.id
Invoke-RestMethod -Uri "$baseUrl/api/reports/stats/$userId`?startDate=$start&endDate=$end" -Method Get -Headers $headers | ConvertTo-Json

Write-Host "`n--- VERIFICACION FINALIZADA ---" -ForegroundColor Green
