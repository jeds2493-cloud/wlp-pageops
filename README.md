# WLP PageOps

Control de producción de páginas de welovepaving.com. El plan completo está en
[`docs/PLAN.md`](docs/PLAN.md).

## Estado: Fase 0

La app muestra en modo lectura las 25 páginas de la hoja (Inicio, Páginas, Detalle,
Tablero y Revisiones). Los datos viven en `lib/seed.ts`; `lib/data.ts` es la única
capa que los lee, así que en Fase 1 se cambia por consultas a Supabase sin tocar
las pantallas. El esquema de base de datos ya está listo en `supabase/schema.sql`.

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
