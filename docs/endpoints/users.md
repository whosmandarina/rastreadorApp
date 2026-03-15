# Módulo: Gestión de Usuarios (`/api/users`)

Este módulo es para la gestión administrativa de los usuarios del sistema.

**Permisos requeridos:** Todas las rutas en este módulo requieren rol de `ADMIN`.

---

## 1. Obtener todos los usuarios

- `GET /api/users`
- **Descripción:** Retorna una lista de todos los usuarios registrados en el sistema.
- **Respuesta de éxito (200):**
```json
[
  {
    "id_user": 1,
    "nombre": "Admin Principal",
    "correo": "admin@empresa.com",
    "telefono": "555-0000",
    "rol": "ADMIN",
    "is_active": true,
    "created_at": "2026-03-15T12:00:00.000Z"
  },
  {
    "id_user": 2,
    "nombre": "Juan Pérez (Usuario Rastreado)",
    "correo": "juan.perez@ejemplo.com",
    "telefono": "555-0101",
    "rol": "USER",
    "is_active": true,
    "created_at": "2026-03-15T12:05:00.000Z"
  }
]
```

---

## 2. Obtener un usuario por ID

- `GET /api/users/:id`
- **Descripción:** Retorna los detalles de un usuario específico.
- **Parámetros de URL:**
  - `id` (integer, requerido): El ID del usuario.
- **Respuesta de éxito (200):** (Similar a un objeto del array anterior)

---

## 3. Actualizar un usuario

- `PUT /api/users/:id`
- **Descripción:** Actualiza la información de un usuario existente.
- **Parámetros de URL:**
  - `id` (integer, requerido): El ID del usuario a actualizar.
- **Cuerpo (JSON):**
```json
{
  "nombre": "Juan Pérez García",
  "correo": "juan.perez@nuevo-correo.com",
  "telefono": "555-0199",
  "rol": "USER",
  "is_active": false
}
```
- **Respuesta de éxito (200):**
```json
{
  "message": "Usuario actualizado exitosamente"
}
```

---

## 4. Eliminar un usuario

- `DELETE /api/users/:id`
- **Descripción:** Elimina un usuario del sistema.
- **Parámetros de URL:**
  - `id` (integer, requerido): El ID del usuario a eliminar.
- **Respuesta de éxito (200):**
```json
{
  "message": "Usuario eliminado exitosamente"
}
```
- **Respuesta de error (400):** Si el usuario está ligado a otras tablas (p. ej. reportes), se retornará un error para prevenir inconsistencias en la base de datos.
