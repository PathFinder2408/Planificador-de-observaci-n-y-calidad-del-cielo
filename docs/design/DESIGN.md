# Sistema de Diseño — Consola de Cúpula

## 1. Concepto

La interfaz toma como referencia las consolas de operación nocturna de los observatorios en el norte de Chile (ESO Paranal, Cerro Pachón) y cartas de efemérides astronómicas. Adopta un modo oscuro calibrado para visión nocturna (_Obsidian Dome_ + _Sodium Amber_) y responde a `prefers-color-scheme: light` con una carta diurna de gabinete (_Blueprint Paper_).

## 2. Tokens de color (fuente única en `src/app/globals.css`)

| Token CSS                  | Rol                           | Modo Oscuro (Cúpula)         | Modo Claro (Gabinete)         |
| :------------------------- | :---------------------------- | :--------------------------- | :---------------------------- |
| `--bg-canvas`              | Fondo principal               | `#0B0E14` (_Obsidian Dome_)  | `#F3F5F8` (_Blueprint Paper_) |
| `--bg-surface`             | Paneles e instrumentos        | `#131822` (_Mount Slate_)    | `#FFFFFF` (_Chart White_)     |
| `--bg-elevated`            | Controles e inputs            | `#19202D`                    | `#E8EDF3`                     |
| `--border-hairline`        | Divisores funcionales 1px     | `#252E3F`                    | `#D1D9E4`                     |
| `--text-primary`           | Texto principal y cifras      | `#E6EBF2` (_Starlight Bone_) | `#111827` (_Ink Slate_)       |
| `--text-secondary`         | Etiquetas y metadatos         | `#99A5B8`                    | `#4B5563`                     |
| `--accent-sodium`          | Acento operativo y umbral 20° | `#E59838` (_Sodium Amber_)   | `#B45309` (_Amber Ink_)       |
| `--accent-sodium-contrast` | Texto sobre `--accent-sodium` | `#0B0E14`                    | `#FFFFFF`                     |
| `--signal-ok`              | Condición óptima / visible    | `#34A874`                    | `#15803D`                     |
| `--signal-warn`            | Precaución / regular          | `#E59838`                    | `#B45309`                     |
| `--signal-bad`             | Crítico / no observable       | `#E05D5A`                    | `#B91C1C`                     |

## 3. Tipografía y escala

- **Interfaz y titulares (`--font-sans`):** `IBM Plex Sans` (pesos 400, 500, 600), autoalojada mediante `@fontsource/ibm-plex-sans`.
- **Telemetría, coordenadas y horas (`--font-mono`):** `IBM Plex Mono` (pesos 400, 500), autoalojada mediante `@fontsource/ibm-plex-mono`, siempre con `font-variant-numeric: tabular-nums`.
- **Copys:** Español de Chile, minúsculas de oración, verbos activos, sin puntos medios decorativos ni etiquetas `UPPERCASE` espaciadas.

## 4. Layout (Alternativa A — Consola Asimétrica)

- **Cabecera operativa:** título, selector de observatorio y fecha, más control de cuenta.
- **Grilla 4/8 en escritorio (`>= 1024px`):**
  - Columna izquierda (4 cols): riel continuo de telemetría (coordenadas, Sol/crepúsculo `-18°`, Luna, atmósfera Open-Meteo) separado por divisores finos de `1px`.
  - Columna derecha (8 cols): elemento memorable (**Banda de Ventana Nocturna integrada al Gráfico de Altitud**) sobre la tabla filtrable de planetas y 20 objetos Messier.
- **Móvil (`360px`):** apilado vertical con scroll horizontal contenido en tabla y gráfico.

## 5. Accesibilidad y piso de calidad

- Contraste mínimo WCAG AA (≥ 4.5:1 en texto normal, ≥ 3:1 en bordes/iconos).
- Estados siempre comunicados con icono + texto además de color.
- Foco visible (`:focus-visible`) con anillo `--accent-sodium`.
- Respeto estricto a `prefers-reduced-motion: reduce` y `prefers-color-scheme`.
