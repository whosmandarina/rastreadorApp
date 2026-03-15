# Sessions (tabla Sessions)
No hay endpoints dedicados. La tabla se usa de forma interna:
- POST /api/auth/login crea una fila con token_jti y device_id.
- POST /api/auth/logout marca is_active = FALSE para ese token.

Para depurar, usa endpoints de auth (ver auth.md). Si necesitas listar o borrar sesiones, deberas crear rutas nuevas y documentarlas.
