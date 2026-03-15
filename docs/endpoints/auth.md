# Auth (tabla Users y tabla Sessions)
Base: http://localhost:3000

## POST /api/auth/register
1. Metodo: POST
2. URL: http://localhost:3000/api/auth/register
3. Headers: Content-Type: application/json
4. Body JSON de ejemplo (tipos):
{
  "nombre": "Ana Admin",           // string requerido
  "correo": "ana@example.com",     // string requerido, unico
  "telefono": "5551234567",        // string opcional
  "identificador_interno": "EMP-1",// string opcional
  "password": "Password123",       // string requerido
  "rol": "ADMIN"                   // enum: ADMIN | SUPERVISOR | CLIENT | USER
}
5. Envia la peticion.
6. Respuesta exitosa 201:
{
  "message": "Usuario registrado exitosamente",
  "userId": 12
}
7. Errores tipicos: 400 campos faltantes o correo duplicado; 500 error de servidor.

## POST /api/auth/login
1. Metodo: POST
2. URL: http://localhost:3000/api/auth/login
3. Headers: Content-Type: application/json
4. Body JSON de ejemplo:
{
  "correo": "ana@example.com",
  "password": "Password123",
  "device_id": "PHONE-123" // opcional
}
5. Envia la peticion.
6. Exito 200:
{
  "message": "Inicio de sesion exitoso",
  "token": "<jwt>",
  "user": { "id": 12, "nombre": "Ana Admin", "correo": "ana@example.com", "rol": "ADMIN" }
}
7. Errores tipicos: 400 faltan correo/password; 401 credenciales invalidas o usuario inactivo; 500 error servidor.

## POST /api/auth/logout
1. Metodo: POST
2. URL: http://localhost:3000/api/auth/logout
3. Headers: Authorization: Bearer <token>
4. Body: ninguno.
5. Exito 200: { "message": "Sesion cerrada exitosamente" }
6. Errores tipicos: 401 token vencido/invalido; 500 error servidor.

Notas:
- Cada login crea un registro en la tabla Sessions con token_jti y device_id.
- Logout marca la sesion como inactiva.
