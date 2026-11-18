# ADR-0003: Identidad visual "Consola de Cúpula" y tokens CSS autoalojados

- **Fecha:** 2026-11-18
- **Estado:** Aceptada

## Contexto

La UI inicial de Fase 4 utilizaba clases genéricas de Tailwind (`slate-950`, `sky-400`), tres tarjetas idénticas en la cabecera y fuentes del sistema sin tokens semánticos propios ni soporte de modo claro. Para un portafolio orientado a observatorios astronómicos (ESO, NOIRLab, Rubin, ALMA) se requiere una identidad visual deliberada, accesible (WCAG AA, 360 px+) y coherente con instrumentos científicos.

## Decisión

1. **Fuente única de tokens en `src/app/globals.css`:** Variables CSS semánticas (`--bg-canvas`, `--bg-surface`, `--text-primary`, `--accent-sodium`, `--signal-*`) con soporte automático para `prefers-color-scheme: dark` (por defecto cúpula) y `light` (gabinete técnico).
2. **Tipografía autoalojada:** `@fontsource/ibm-plex-sans` y `@fontsource/ibm-plex-mono` con `tabular-nums`, evitando dependencias de CDN externas y saltos de renderizado (CLS).
3. **Layout Asimétrico 4/8:** Riel continuo de telemetría a la izquierda y banda de ventana nocturna + curva de altitud + tabla de blancos a la derecha.

## Alternativas descartadas

- **Mantener tarjetas iguales en fila superior:** Fragmentaba el resumen y repetía el mismo patrón visual genérico.
- **Google Fonts vía `<link>`:** Introduce latencia externa y riesgo de falla en entornos restringidos.

## Consecuencias

- Cero colores o tamaños arbitrarios en componentes; todo se gobierna desde `globals.css`.
- Mayor contraste, legibilidad numérica y coherencia con software científico de misión crítica.
