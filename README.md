# Planificador de Observación y Calidad del Cielo

Aplicación web orientada a la planificación de sesiones de observación astronómica en la Región de Coquimbo y los principales observatorios de Chile. Calcula efemérides astronómicas reales (`astronomy-engine`), visibilidad nocturna en horario `America/Santiago` y un índice de calidad de observación (0–100) a partir de datos meteorológicos reales (Open-Meteo).

## Stack tecnológico

- **Framework:** Next.js (App Router) + TypeScript (`strict`)
- **Estilos:** Tailwind CSS
- **Cálculo astronómico:** `astronomy-engine`
- **Meteorología:** Open-Meteo API (con validación Zod, timeout, reintentos y caché)
- **Testing:** Vitest + `@vitest/coverage-v8`
- **CI/CD y Calidad:** GitHub Actions, ESLint (`--max-warnings=0`), Prettier, `npm audit`, `gitleaks`

## Cómo ejecutar en local

1. Clonar el repositorio e instalar dependencias:
   ```bash
   npm ci
   ```
2. Copiar la configuración de ejemplo:
   ```bash
   cp .env.example .env.local
   ```
3. Levantar el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Ejecutar verificaciones de calidad:
   ```bash
   npm run format:check
   npm run lint
   npm run typecheck
   npm run test:coverage
   npm run build
   ```

## Documentación de ingeniería

- [Decisiones de Arquitectura (ADR)](./docs/adr/0001-arquitectura-y-stack.md)
- [Requisitos y Trazabilidad](./docs/REQUIREMENTS.md)
- [Registro de Riesgos](./docs/RISKS.md)
- [Bitácora de Desarrollo](./docs/worklog/2026-11-18.md)
- [Changelog](./CHANGELOG.md)
