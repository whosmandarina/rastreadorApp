# Módulo: Gestión de Usuarios (`/api/users`)

Este módulo es para la creación y gestión de usuarios por parte de roles autorizados.

**Permisos requeridos:** Todas las rutas en este módulo requieren un token de autenticación válido con rol de `ADMIN` o `SUPERVISOR`.

---

## 1. Crear un nuevo usuario

- `POST /api/users`
- **Descripción:** Crea un nuevo usuario. El comportamiento varía según el rol de quien realiza la petición.
- **Acceso:** `ADMIN`, `SUPERVISOR`

#### Body para Administradores (`ADMIN`)
- Un `ADMIN` puede crear usuarios con cualquier rol (`ADMIN`, `SUPERVISOR`, `USER`).
- Si crea un `USER`, es **obligatorio** especificar a qué supervisor pertenecerá.
```json
{
  "nombre": "Nuevo Supervisor",
  "correo": "supervisor@empresa.com",
  "password": "Password123",
  "telefono": "111222333",
  "rol": "SUPERVISOR", // Requerido por el ADMIN
  "supervisorId": null // Opcional, solo si el rol es USER
}
```

#### Body para Supervisores (`SUPERVISOR`)
- Un `SUPERVISOR` solo puede crear usuarios con rol `USER`.
- El nuevo usuario se le asigna **automáticamente**. No se debe enviar `rol` ni `supervisorId`.
```json
{
  "nombre": "Juan Personal",
  "correo": "juan.personal@empresa.com",
  "password": "Password123",
  "telefono": "444555666"
}
```

- **Respuesta de éxito (201):**
```json
{
  "message": "Usuario creado exitosamente",
  "userId": 126
}
```

---

## 2. Obtener usuarios

- `GET /api/users`
- **Descripción:** Retorna una lista de usuarios. El resultado depende del rol.
- **Acceso:** `ADMIN`, `SUPERVISOR`
- **Comportamiento por Rol:**
  - `ADMIN`: Recibe una lista de **todos** los usuarios del sistema.
  - `SUPERVISOR`: Recibe una lista de **únicamente** los usuarios que tiene asignados.
- **Respuesta de éxito (200):**
```json
[
  {
    "id_user": 105,
    "nombre": "Juan Personal",
    "correo": "juan.personal@empresa.com",
    "telefono": "444555666",
    "rol": "USER",
    "is_active": true,
    "created_at": "2026-03-16T18:00:00.000Z"
  }
]
```

---

## 3. Obtener un usuario por ID

- `GET /api/users/:id`
- **Descripción:** Retorna los detalles de un usuario específico.
- **Acceso:** `ADMIN`, `SUPERVISOR`
- **Comportamiento por Rol:**
  - `ADMIN`: Puede solicitar cualquier `id` de usuario.
  - `SUPERVISOR`: Solo puede solicitar el `id` de un usuario que gestione. Si intenta acceder a otro, recibirá un error `403 Forbidden`.

---

## 4. Actualizar un usuario

- `PUT /api/users/:id`
- **Descripción:** Actualiza la información de un usuario.
- **Acceso:** `ADMIN`, `SUPERVISOR`
- **Comportamiento por Rol:**
  - `ADMIN`: Puede modificar cualquier usuario y cualquier campo.
  - `SUPERVISOR`: Solo puede modificar a sus propios usuarios. No puede cambiarles el `rol`.
- **Cuerpo (JSON):**
```json
{
  "nombre": "Juan Personal Actualizado",
  "correo": "juan.personal@nuevo-correo.com",
  "telefono": "444555777",
  "rol": "USER", // Un supervisor no puede cambiar esto.
  "is_active": false
}
```
- **Respuesta de éxito (200):** `{ "message": "Usuario actualizado exitosamente" }`
- **Respuesta de error:** `403 Forbidden` si un supervisor intenta modificar un usuario que no le pertenece.

---

## 5. Eliminar un usuario

- `DELETE /api/users/:id`
- **Descripción:** Elimina un usuario del sistema.
- **Acceso:** `ADMIN`, `SUPERVISOR`
- **Comportamiento por Rol:**
  - `ADMIN`: Puede eliminar cualquier usuario (excepto el admin principal).
  - `SUPERVISOR`: Solo puede eliminar a un usuario que gestione.
- **Respuesta de error:** `403 Forbidden` si un supervisor intenta eliminar un usuario que no le pertenece.
- **Nota:** No se puede eliminar a un usuario si tiene datos asociados (alertas, reportes, etc).
