# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [0.1.0] - 2026-11-18

### Added

- Inicialización del repositorio Git con flujo de ramas por fase y tags anotados.
- Estructura documental obligatoria (`CHANGELOG.md`, `docs/RISKS.md`, `docs/REQUIREMENTS.md`, `docs/adr/0001-arquitectura-y-stack.md`, `docs/worklog/`).
- Setup base de Next.js + TypeScript (`strict`) + Tailwind CSS + Vitest + ESLint/Prettier.
- Validación de entorno con Zod (`src/lib/env.ts`), logger JSON estructurado (`src/lib/logger.ts`) y endpoint `GET /api/health`.
- Pipeline CI en GitHub Actions (`.github/workflows/ci.yml`) con lint, typecheck, tests con cobertura, `npm audit` y build.
- Configuración de seguridad (`.env.example`, `.pre-commit-config.yaml` con `gitleaks`).
