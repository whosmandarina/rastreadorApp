# Endpoint de Autenticación (`/api/auth`)

Esta sección cubre el registro público, el inicio y el cierre de sesión.

## POST /api/auth/register
Endpoint público para que un **nuevo usuario móvil (rol `USER`)** se registre en la plataforma. Este registro es **autónomo** y requiere obligatoriamente un código de supervisor válido para poder crear la cuenta.

1.  **Método:** POST
2.  **URL:** `/api/auth/register`
3.  **Headers:** `Content-Type: application/json`
4.  **Body (JSON):**
    ```json
    {
      "nombre": "Carlos Usuario",         // string, requerido
      "correo": "carlos.nuevo@email.com", // string, requerido, único
      "telefono": "5558889999",          // string, opcional
      "password": "PasswordSeguro123",    // string, requerido
      "codigo_supervisor": 102            // number, requerido, ID de un usuario con rol SUPERVISOR
    }
    ```
5.  **Lógica de Negocio:**
    - El sistema busca un usuario con `rol: SUPERVISOR` que tenga el `id_user` igual al `codigo_supervisor` proporcionado.
    - Si el código es inválido o no corresponde a un supervisor, la petición es rechazada con un error `400`.
    - Si el correo ya existe, se rechaza con un `400`.
    - Si todo es correcto, se crea el nuevo usuario con `rol: USER` y se le vincula al supervisor en la tabla `Supervisor_User`.
6.  **Respuesta exitosa (201 Created):**
    ```json
    {
      "message": "Usuario registrado exitosamente. Ahora puede iniciar sesión.",
      "userId": 125
    }
    ```
7.  **Errores Típicos:**
    - `400 Bad Request`: Faltan campos obligatorios, el formato del correo es inválido, o el `codigo_supervisor` no es válido.
    - `500 Internal Server Error`: Error en la base de datos.

## POST /api/auth/login
1. Metodo: POST
2. URL: /api/auth/login
3. Headers: Content-Type: application/json
4. Body JSON de ejemplo:
{
  "correo": "ana@example.com",
  "password": "Password123",
  "device_id": "PHONE-123" 
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
2. URL: /api/auth/logout
3. Headers: Authorization: Bearer <token>
4. Body: ninguno.
5. Exito 200: { "message": "Sesion cerrada exitosamente" }
6. Errores tipicos: 401 token vencido/invalido; 500 error servidor.

Notas:
- Cada login crea un registro en la tabla Sessions con token_jti y device_id.
- Logout marca la sesion como inactiva.
