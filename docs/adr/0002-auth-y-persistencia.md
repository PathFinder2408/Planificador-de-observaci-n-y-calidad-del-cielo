# ADR-0002: Autenticación con cookie HttpOnly (JWT) y persistencia en PostgreSQL

- **Fecha:** 2026-11-18
- **Estado:** Aceptada

## Contexto

La aplicación necesita cuentas de usuario y persistencia de sitios y objetos favoritos en un despliegue serverless (Vercel), cumpliendo además con migraciones versionadas reversibles (`up`/`down`) y sin dependencias de archivos locales en disco.

## Decisión

1. **Base de datos:** PostgreSQL compatible con proveedores serverless (Neon, Supabase, Vercel Postgres) mediante el driver estándar `pg` con pool acotado y consultas SQL parametrizadas (prevención de SQL injection).
2. **Migraciones:** Archivos SQL explícitos `0001_init.up.sql` y `0001_init.down.sql` en `db/migrations/`, con tabla de control `schema_migrations`.
3. **Autenticación:** Registro/login con hash `bcryptjs` (cost 10) y token de sesión JWT firmado con HMAC-SHA256 (`jose`) almacenado en cookie `HttpOnly`, `SameSite=Lax`, `Secure` en producción.

## Alternativas descartadas

- **NextAuth / Auth.js completo:** Excesiva configuración para un login simple por credenciales en portafolio, dificultando explicar el flujo criptográfico completo en entrevista.
- **SQLite local:** No persiste entre invocaciones serverless en Vercel.

## Consecuencias

- Flujo de autenticación auditable, ligero y fácil de defender en entrevistas técnicas.
- La app sigue funcionando en modo lectura pública si `DATABASE_URL` no está configurada, y habilita cuenta + favoritos al configurar `DATABASE_URL` y `AUTH_SECRET`.
