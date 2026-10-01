# WLP PageOps

Control de producción de páginas de welovepaving.com. El plan completo está en
[`docs/PLAN.md`](docs/PLAN.md).

## Estado: Fase 1 (edición, sin login)

Todo se edita desde la app: páginas nuevas, datos de la página, etapas (selector o
arrastrando en el Tablero), bloqueos, fechas, story points, ajustes, revisiones con
feedback punto por punto (→ tarea, resuelto, descartado), tareas, QA y notas. Cada
cambio queda en la Actividad. El selector "Editando como" (Producción / Admin)
firma notas, feedback y actividad mientras no haya login.

**Datos:** `lib/store.ts` guarda en **Netlify Blobs** cuando corre en Netlify y en
`.data/store.json` en local. La primera vez se carga con las 25 páginas de la hoja
(`lib/seed.ts`). `/respaldo` descarga todo en JSON. El esquema de Supabase para
cuando haya login sigue en `supabase/schema.sql`.

> Sin login, cualquiera con acceso al sitio puede editar: mantén el sitio en
> modo privado en Netlify.

## Correr en local

```bash
npm install
npm run dev   # http://localhost:3000
```

## Deploy en Netlify

Netlify → Add new site → Import from GitHub → `wlp-pageops`. Netlify detecta Next.js y usa `netlify.toml`.

## Diseño

Usa el sistema de diseño del sitio de WLP (tokens de `css/styles.css` en
`welovepaving-prototype`): Barlow Semi Condensed para títulos, Inter para texto,
IBM Plex Mono para etiquetas, amarillo `#F2C230`, negro cálido `#14120E` y fondo
crema `#F2F1EF`. Los tokens viven en `app/globals.css`; la escala `stone` de
Tailwind está remapeada a los grises cálidos de WLP.
