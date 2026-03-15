# Clients (tabla Clients)
Base: http://localhost:3000
Rutas protegidas solo ADMIN. Header requerido: Authorization: Bearer <token>.

## GET /api/clients
- Paso a paso: usa metodo GET, URL completa, agrega header Authorization. Body vacio.
- Exito 200: lista de clientes.
- Errores: 401/403 sin token o rol no permitido; 500 error al obtener.

## GET /api/clients/:id
- Reemplaza :id por el id_client.
- Exito 200: un objeto de cliente.
- Errores: 404 no encontrado; 401/403 auth; 500 error.

## POST /api/clients
1. Metodo POST a http://localhost:3000/api/clients
2. Headers: Authorization y Content-Type: application/json
3. Body ejemplo:
{
  "nombre_empresa": "Corp Demo",   // string requerido
  "contacto": "Maria CEO",         // string opcional
  "id_user_admin": 12               // int opcional (id de usuario ADMIN)
}
4. Envia.
5. Exito 201: { "message": "Cliente creado exitosamente", "id": 5 }
6. Errores: 400 falta nombre_empresa; 401/403 auth; 500 error.

## PUT /api/clients/:id
- Metodo PUT, mismos headers.
- Body ejemplo (todos opcionales, se sobrescriben):
{
  "nombre_empresa": "Corp Demo 2",
  "contacto": "Nuevo contacto",
  "id_user_admin": 12
}
- Exito 200: { "message": "Cliente actualizado exitosamente" }
- Errores: 404 no encontrado; 400 datos invalidos; 401/403 auth; 500 error.

## DELETE /api/clients/:id
- Metodo DELETE, header Authorization.
- Body: ninguno.
- Exito 200: { "message": "Cliente eliminado exitosamente" }
- Errores: 404 no encontrado; 401/403 auth; 500 error.
