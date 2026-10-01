# Design

**Asfalto sobre concreto.** Tiles negras de asfalto con silueta de carpeta sobre un fondo
gris concreto; paneles de color de señal (pintura vial) con un brillo suave; números
grandes condensados. Referencia fijada por el usuario (oct 2026): widgets negros con
pestaña, panel de color con pista punteada, botones oscuros en relieve y una franja de
color que asoma bajo la tarjeta.

Tokens en `app/globals.css`; piezas en `components/ui.tsx`.

## Color

| Rol | Token | Valor |
|---|---|---|
| Fondo de la app (concreto) | `ground` / `ground-2` | `#d2cfc9` / `#c3c0b9` |
| Texto sobre el concreto | `ink` / `ink-2` | `#14120e` / `#45403a` |
| Tile, superficie elevada, pozo (inputs) | `tile` / `tile-2` / `well` | `#131211` / `#1d1c1a` / `#0a0908` |
| Dentro de las tiles | `stone-50…900` | invertida: 50 lo más hundido, 900 el texto principal (`#f5f3ef`) |
| Señal por etapa | `signal-*` | Por hacer concreto `#d9d6d0`, En curso naranja `#ff8a3d`, QA violeta `#b9a3ff`, Revisión Admin amarillo WLP `#f2c230`, Cambios rojo `#ff5468`, Publicado verde `#4be37a` |

Estrategia: neutros + un acento. El amarillo WLP es la acción principal y la navegación
activa. Los colores de señal solo aparecen en paneles, puntos de etapa y estados; el texto
encima de un color de señal siempre es `ink`. Rojo de señal = problema (bloqueo, no pasa,
vencido).

## Tipografía

- Títulos de pantalla y de tile: Barlow Semi Condensed 700–800 (`font-display`); los de
  pantalla en mayúsculas, 42–60 px.
- Números grandes: Barlow Condensed 500 (`num`), con superíndice opcional (`<Num sup>`).
- Texto: Inter. Datos pequeños (fechas, IDs, SP): IBM Plex Mono.

## Piezas

- **Tile** (`.tile`): radio 26 px, sombra suave hacia abajo. Nunca una tile dentro de otra.
- **Tile carpeta** (`<Card title>` / `.tile-folder`): la pestaña lleva el título o un
  segmentado; el hueco a la derecha, sobre el concreto, lleva la acción (botón, contador).
  La sombra es `drop-shadow` para seguir la silueta.
- **Panel de señal** (`<Panel signal tab>`): radio 20 px, brillo con desplazamiento hacia
  abajo, pestaña opcional a la derecha. Lleva la pista punteada (`.track`) con tramos
  sólidos: flujo de páginas en Inicio y etapas en el detalle.
- **Franja** (`<Underlay>`): color de señal detrás de la tile, crece con su texto. Solo para
  un estado que no debe pasar desapercibido (trabajo bloqueado) y en la entrada.
- **Botones**: `btn-signal` (amarillo, acción principal, uno por zona), `btn-soft` (oscuro en
  relieve), `btn-round` (ícono), quiet (texto). **Segmentado** `seg`: pozo redondo con la
  opción activa en `stone-800` (claro) o amarillo en la navegación principal.
- **Inputs**: pozo `well`, borde blanco 10 %, radio 12 px; foco amarillo dentro de las tiles,
  tinta sobre el concreto.

## Movimiento

Transiciones de 150 ms ease-out en botones; el corte del ticket (física de React Bits) es el
único momento animado. `prefers-reduced-motion` lo desactiva todo.
