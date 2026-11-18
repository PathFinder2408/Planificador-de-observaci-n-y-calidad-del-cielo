# ADR-0001: Arquitectura monolito modular en Next.js y stack base

- **Fecha:** 2026-11-18
- **Estado:** Aceptada

## Contexto

Se requiere construir una aplicación web de portafolio ("Planificador de Observación y Calidad del Cielo") orientada a postular a observatorios astronómicos en Chile, desplegable en Vercel, con cálculos astronómicos reales, consumo de API meteorológica, visualización de altitud y persistencia de favoritos, manteniendo estándares estrictos de calidad y trazabilidad.

## Decisión

1. **Framework:** Next.js (App Router) con TypeScript en modo `strict: true` y Tailwind CSS.
2. **Separación de capas:**
   - `src/lib/astro/` y `src/lib/weather/` como módulos puros de dominio (sin dependencia de React ni HTTP) para garantizar testabilidad (≥ 90% cobertura) y reutilización.
   - `src/app/api/` como capa delgada de frontera con validación explícita mediante **Zod**.
3. **Motor astronómico:** `astronomy-engine` ejecutado de forma determinista con instantes UTC y conversión explícita a `America/Santiago`.
4. **Testing:** Vitest con `@vitest/coverage-v8` y umbrales bloqueantes (80% global, 90% dominio crítico).
5. **Visualización (Fase 4):** Recharts por su integración declarativa con React y TypeScript.
6. **Persistencia (Fase 5):** PostgreSQL serverless compatible con Vercel y ORM con migraciones versionadas reversibles (`up`/`down`).

## Alternativas descartadas

- **Backend separado (FastAPI/Express + React SPA):** Mayor complejidad de despliegue y duplicación de contratos de tipos para un proyecto de portafolio en Vercel.
- **SQLite en archivo local:** Incompatible con el sistema de archivos efímero de funciones serverless en Vercel.

## Consecuencias

- Un único repositorio y despliegue atómico en Vercel.
- Tipos compartidos de punta a punta y pruebas rápidas de dominio con Vitest.
- Requiere disciplina para no mezclar lógica de negocio dentro de componentes React ni Route Handlers.
