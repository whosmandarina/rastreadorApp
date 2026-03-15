# Supervisor_User (tabla Supervisor_User)
Base: http://localhost:3000/api/supervisor-users
Todas requieren Authorization: Bearer <token>.

## POST /
- Rol: ADMIN
- Body ejemplo:
{
  "id_supervisor": 21, // int requerido
  "id_user": 30        // int requerido
}
- Exito 201: { "message": "Usuario asignado al supervisor exitosamente" }
- Errores: 400 faltan datos o duplicado; 401/403 auth; 500 error.

## DELETE /:id_supervisor/:id_user
- Rol: ADMIN
- Exito 200: { "message": "Asignacion removida exitosamente" }
- Errores: 404 no encontrada; 401/403 auth; 500 error.

## GET /supervisor/:id_supervisor/users
- Roles: ADMIN o SUPERVISOR (el supervisor solo puede ver los suyos).
- Exito 200: lista de usuarios rastreados asignados.
- Errores: 403 si supervisor intenta ver otros; 401 sin token; 500 error.

## GET /user/:id_user/supervisors
- Roles: ADMIN, CLIENTE o USUARIO (segun checkRole).
- Exito 200: lista de supervisores asignados al usuario.
- Errores: 401/403 auth; 500 error.
