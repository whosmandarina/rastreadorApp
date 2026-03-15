# Consents (tabla Consents)
Base: http://localhost:3000
Requiere Authorization: Bearer <token>.

## POST /api/consents
- Rol: cualquier autenticado (o ADMIN para otro usuario).
- Body ejemplo:
{
  "id_user": 30,          // int opcional; si se omite usa el id del token
  "ip_address": "1.1.1.1", // string opcional
  "user_agent": "Postman"  // string opcional
}
- Exito 201: { "message": "Consentimiento registrado exitosamente" }
- Errores: 500 error servidor.

## GET /api/consents/user/:id_user
- Roles: ADMIN, SUPERVISOR o el propio usuario (codigo usa checkRole con USUARIO, podria fallar; intenta con roles permitidos).
- Exito 200: ultimo registro de consentimiento.
- Errores: 403 si usuario comun consulta a otro; 404 si no hay registro; 401/500 segun caso.

## POST /api/consents/revoke
- Rol: USUARIO (segun checkRole).
- Body: ninguno.
- Exito 200: { "message": "Consentimiento revocado (eliminado) exitosamente" }
- Errores: 401/403 auth; 500 error.
