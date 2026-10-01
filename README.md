# WLP PageOps

Control de producción de páginas de welovepaving.com. El plan completo está en
[`docs/PLAN.md`](docs/PLAN.md).

## Estado: Fase 1 (edición, sin login)

- **Inicio = Páginas:** la raíz `/` es la lista de páginas con la barra de flujo por
  etapa (filtra al hacer clic), buscador (`/`) y "Nueva página" (`N`). `/paginas`
  redirige ahí.
- **Reinicio del 1 oct 2026:** las 25 páginas arrancan en "Por hacer", sin revisiones,
  notas, ajustes ni actividad (almacén `pageops-v2`; el anterior, `pageops`, queda como
  respaldo en Netlify Blobs).

Todo se edita desde la app: páginas nuevas, datos de la página, etapas (selector o
arrastrando en el Tablero), bloqueos, fechas, story points, ajustes, revisiones con
feedback punto por punto (→ tarea, resuelto, descartado), tareas, QA y notas. Cada
cambio queda en la Actividad. El selector "Editando como" (Producción / Admin)
firma notas, feedback y actividad mientras no haya login.

**Datos:** `lib/store.ts` guarda en **Netlify Blobs** cuando corre en Netlify y en
`.data/store.json` en local. La primera vez se carga con las 25 páginas de la hoja
(`lib/seed.ts`). `/respaldo` descarga todo en JSON. El esquema de Supabase para
cuando haya login sigue en `supabase/schema.sql`.

## Acceso

Mientras llega el login, la app pide una **contraseña compartida**. Se configura en
Netlify → *Site configuration → Environment variables* como `PAGEOPS_PASSWORD` y se
vuelve a publicar. Sin esa variable, en producción nadie puede entrar (la app lo avisa).
Cambiar la contraseña cierra la sesión de todos. Se valida en el servidor en cada
pantalla, cada acción de edición y en `/respaldo`. En local, sin la variable, se entra
directo.

## Cuidar los datos

- **Antes de cualquier cambio que toque los datos guardados** (un reinicio, una
  migración, un cambio de formato), baja el respaldo desde la barra lateral
  (*Descargar respaldo*, `/respaldo`).
- Las migraciones de formato guardan además un respaldo automático en Netlify Blobs,
  una sola vez por migración: `backups/antes-schema-2` se descarga en
  `/respaldo?copia=antes-schema-2`.
- El almacén anterior al reinicio del 1 oct (`pageops`) sigue intacto.

## Si se cae

La pantalla de error muestra solo un código (Next oculta el mensaje por seguridad).
El motivo real está en Netlify → *Logs → Functions*: busca el error más reciente con
ese código.

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
