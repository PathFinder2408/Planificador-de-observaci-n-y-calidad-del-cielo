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

## Fórmula del Índice de Calidad de Observación (0–100)

El índice nocturno evalúa las condiciones meteorológicas horarias entre las `19:00` y las `06:00` (`America/Santiago`) mediante cuatro subíndices acotados en `[0, 100]`:

- **Nubosidad (`55%`):** $\text{cloudScore} = \text{clamp}(100 - \text{cloudCover} \times 1.1,\, 0,\, 100)$
- **Humedad relativa (`20%`):** $100$ si $\text{humidity} \le 40\%$; si no, $\text{clamp}(100 - \frac{\text{humidity} - 40}{55} \times 100,\, 0,\, 100)$
- **Viento a 10 m (`15%`):** $100$ si $\text{wind} \le 15\text{ km/h}$; si no, $\text{clamp}(100 - \frac{\text{wind} - 15}{40} \times 100,\, 0,\, 100)$
- **Estabilidad térmica (`10%`):** $100$ entre $2\,^\circ\text{C}$ y $18\,^\circ\text{C}$; penaliza $5\text{ pts}/^\circ\text{C}$ fuera de ese rango.

$$\text{Índice} = \text{round}(0.55 \cdot \text{cloudScore} + 0.20 \cdot \text{humidityScore} + 0.15 \cdot \text{windScore} + 0.10 \cdot \text{thermalScore})$$

Clasificación: **80–100** Excelente · **60–79** Buena · **40–59** Regular · **0–39** Mala.
