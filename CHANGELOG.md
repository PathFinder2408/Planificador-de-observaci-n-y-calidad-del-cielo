# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [0.7.0] - 2026-11-18

### Added

- Fondo dinámico liviano `StarfieldBackdrop` (`<canvas>` determinista con deriva sideral sutil, arcos de declinación, pausa en `prefers-reduced-motion` y adaptación a `prefers-color-scheme: light`).

## [0.6.0] - 2026-11-18

### Changed

- Rediseño integral "Consola de Cúpula" con tokens CSS semánticos en `src/app/globals.css` (modo oscuro nocturno + `prefers-color-scheme: light`, `prefers-reduced-motion`, foco visible WCAG AA).
- Fuentes autoalojadas `@fontsource/ibm-plex-sans` y `@fontsource/ibm-plex-mono` con cifras tabulares.
- Nuevo mapa radial interactivo `ObservatoryRadialMap` (constelación operativa por categoría y blancos) + `TelemetryRail` con histograma horario de puntos de Open-Meteo.
- Verificación visual en escritorio (`1440x900`) y móvil (`360x780`) con cero desbordamiento horizontal; captura guardada en `docs/design/screens/desktop.png` y `public/screenshots/dashboard.png`.

## [0.5.0] - 2026-11-18

### Added

- Autenticación con `bcryptjs` y JWT (`jose`) en cookie `HttpOnly` (`/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`).
- Persistencia de sitios y objetos favoritos en PostgreSQL (`/api/favorites`) con migraciones SQL versionadas reversibles (`db/migrations/0001_init.up.sql` y `.down.sql`).
- Interfaz de acceso (`AuthBar`) y guardado de favoritos en header y tabla de objetos.
- Captura real del dashboard en `public/screenshots/dashboard.png` y `README.md` completo para portafolio y despliegue en Vercel.
- ADR-0002 (`docs/adr/0002-auth-y-persistencia.md`) y suite de tests de sesión, repositorios y rutas `/api/auth/*` + `/api/favorites`.

## [0.4.0] - 2026-11-18

### Added

- Interfaz nocturna con Tailwind CSS y Recharts (`SiteSelector`, `SummaryCards`, `AltitudeChart`, `ObjectsTable`, `ObservationPlanner`).
- Gráfico interactivo de altitud nocturna con línea de referencia a 20° y selección comparativa de hasta 5 objetos.
- Tabla filtrable (Todos, Observables ≥20°, Planetas, Catálogo Messier) ordenada por altitud máxima.

## [0.3.0] - 2026-11-18

### Added

- Cliente resiliente de Open-Meteo (`/v1/forecast`) con validación Zod, timeout (`AbortController`), reintentos acotados y caché en memoria (`src/lib/weather/openMeteo.ts`).
- Fórmula del Índice de Calidad de Observación 0–100 (`src/lib/weather/qualityIndex.ts`) documentada en `README.md`.
- Endpoints `GET /api/sites` y `GET /api/observation` con degradación controlada ante fallos de Open-Meteo.
- Tests unitarios y de integración (incluyendo simulación de timeouts, HTTP 500, HTTP 404 y JSON corrupto) en `tests/unit/weather/` y `tests/integration/api/observation.test.ts`.

## [0.2.0] - 2026-11-18

### Added

- Catálogo de 10 sitios astronómicos y proyectos en Chile (`Vera C. Rubin`, `Gemini South & SOAR`, `Cerro Tololo`, `La Silla`, `Las Campanas & GMT`, `Paranal`, `Cerro Armazones / ELT`, `ALMA`, `CTAO-South`, `La Serena`) en `src/data/sites.ts`.
- Catálogo de 20 objetos Messier (`src/data/messier.ts`).
- Helpers de zona horaria `America/Santiago` con soporte DST (`src/lib/astro/timezone.ts`).
- Motor de efemérides (`src/lib/astro/ephemeris.ts`) y visibilidad nocturna de planetas y Messier (`src/lib/astro/visibility.ts`) usando `astronomy-engine`.
- Suite de tests unitarios con casos astronómicos de referencia en `tests/unit/astro/`.

## [0.1.0] - 2026-11-18

### Added

- Inicialización del repositorio Git con flujo de ramas por fase y tags anotados.
- Estructura documental obligatoria (`CHANGELOG.md`, `docs/RISKS.md`, `docs/REQUIREMENTS.md`, `docs/adr/0001-arquitectura-y-stack.md`, `docs/worklog/`).
- Setup base de Next.js + TypeScript (`strict`) + Tailwind CSS + Vitest + ESLint/Prettier.
- Validación de entorno con Zod (`src/lib/env.ts`), logger JSON estructurado (`src/lib/logger.ts`) y endpoint `GET /api/health`.
- Pipeline CI en GitHub Actions (`.github/workflows/ci.yml`) con lint, typecheck, tests con cobertura, `npm audit` y build.
- Configuración de seguridad (`.env.example`, `.pre-commit-config.yaml` con `gitleaks`).
