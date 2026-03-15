# User_Client (tabla User_Client)
Base: http://localhost:3000/api/user-clients
Todas requieren Authorization: Bearer <token>.

## POST /
- Rol: ADMIN
- Body ejemplo:
{
  "id_user": 30,   // int requerido
  "id_client": 5   // int requerido
}
- Exito 201: { "message": "Usuario asignado al cliente exitosamente" }
- Errores: 400 faltan datos o asignacion duplicada; 401/403 auth; 500 error.

## DELETE /:id_user/:id_client
- Rol: ADMIN
- Body: ninguno.
- Exito 200: { "message": "Asignacion removida exitosamente" }
- Errores: 404 asignacion no encontrada; 401/403 auth; 500 error.

## GET /user/:id_user/clients
- Roles: cualquier autenticado (segun codigo no hay checkRole aqui).
- Exito 200: lista de clientes asignados al usuario.
- Errores: 401 si sin token; 500 error.

## GET /client/:id_client/users
- Roles: ADMIN o SUPERVISOR.
- Exito 200: lista de usuarios asignados al cliente.
- Errores: 401/403 auth; 500 error.
