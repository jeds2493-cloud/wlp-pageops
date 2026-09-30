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
