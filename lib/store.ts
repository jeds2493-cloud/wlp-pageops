// Almacenamiento de las páginas. En Netlify usa Netlify Blobs (persistente y
// compartido entre quienes usan la app); en local, un archivo en .data/.
// La primera vez que el almacén está vacío se carga con los datos de la hoja.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import { seedPages } from "./seed";
import { LEGACY_QA_LABELS, qaItems, WCAG_GROUP, WCAG_ITEMS } from "./templates";
import type { QaItem } from "./types";
import type { Page } from "./types";

interface Backend {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown): Promise<void>;
  del(key: string): Promise<void>;
}

// v2: reinicio del 1 oct 2026. El almacén anterior ("pageops") queda intacto como respaldo.
const STORE_NAME = "pageops-v2";
const INDEX_KEY = "index";
const pageKey = (id: string) => `page/${id}`;

/** ¿Hay contexto de Netlify Blobs? (en local no). */
function blobsAvailable(): boolean {
  try {
    getStore(STORE_NAME);
    return true;
  } catch {
    return false;
  }
}

function blobsBackend(): Backend {
  // Netlify da a cada petición un token de Blobs que caduca. La conexión se pide en
  // cada operación: si se guardara la del primer request, una función "caliente"
  // seguiría usando un token vencido (error 401 "Token expired").
  const store = () => getStore({ name: STORE_NAME, consistency: "strong" });
  // Cada falla deja en el registro de Netlify (Logs → Functions) qué operación y
  // qué clave fallaron; la pantalla de error solo muestra un código.
  const traced = <T>(op: string, key: string, run: () => Promise<T>) =>
    run().catch((err: unknown) => {
      console.error(`[pageops] Blobs ${op} "${key}" falló:`, err);
      throw err;
    });
  return {
    get: <T>(key: string) =>
      traced("get", key, async () => ((await store().get(key, { type: "json" })) ?? undefined) as T | undefined),
    set: (key, value) => traced("set", key, () => store().setJSON(key, value).then(() => undefined)),
    del: (key) => traced("delete", key, () => store().delete(key)),
  };
}

function fileBackend(): Backend {
  const file = path.join(process.cwd(), ".data", `${STORE_NAME}.json`);
  const read = async (): Promise<Record<string, unknown>> => {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch {
      return {};
    }
  };
  const write = async (data: Record<string, unknown>) => {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(data, null, 2));
  };
  // Todas las operaciones van en fila: si dos escrituras leen y reescriben el
  // archivo al mismo tiempo, una borra los cambios de la otra.
  let queue: Promise<unknown> = Promise.resolve();
  const serial = <T>(fn: () => Promise<T>): Promise<T> => {
    const run = queue.then(fn, fn);
    queue = run.catch(() => undefined);
    return run;
  };
  return {
    get: <T>(key: string) => serial(async () => (await read())[key] as T | undefined),
    set: (key, value) =>
      serial(async () => {
        const data = await read();
        data[key] = value;
        await write(data);
      }),
    del: (key) =>
      serial(async () => {
        const data = await read();
        delete data[key];
        await write(data);
      }),
  };
}

let local: Backend | undefined;
function db(): Backend {
  // En Netlify, un backend nuevo por llamada (token vigente); en local, el archivo.
  if (blobsAvailable()) return blobsBackend();
  local ??= fileBackend();
  return local;
}

// ── Migraciones ─────────────────────────────────────────────────────────────
// Antes de cambiar datos guardados se escribe un respaldo completo en el almacén
// (backups/<nombre>), una sola vez por migración. Se descarga en /respaldo?copia=<nombre>.

export const SCHEMA = 3;
const BACKUP_PREFIX = "backups/";

/** Formato 1 → 2: QA con Pasa / No pasa / No aplica y checklist de reglas WLP;
 *  "Entregada el" en páginas publicadas que no la tenían. */
function migrate(p: Page): Page {
  const now = new Date().toISOString();
  for (const w of p.works) {
    const legacy = w.qa as { status: string }[];
    const untouched = w.qa.length > 0 && legacy.every((q) => q.status === "Pendiente");
    if (untouched && w.qa.some((q) => LEGACY_QA_LABELS.includes(q.label))) {
      w.qa = qaItems(p.type, `${w.id}-v2`);
    } else {
      for (const q of w.qa as { status: string; reason?: string }[]) {
        if (q.status === "OK") q.status = "Pasa";
        if (q.status === "N/A") {
          q.status = "No aplica";
          q.reason ??= "Marcado como N/A antes del nuevo QA";
        }
      }
    }
    if (w.stage === "Publicado" && !w.deliveredAt && w.stageSince) {
      w.deliveredAt = w.stageSince.slice(0, 10);
      p.activity.unshift({
        id: `${w.id}-mig2`,
        at: now,
        text: `"Entregada el" completada con la fecha en que pasó a Publicado (${w.deliveredAt}).`,
      });
    }
  }
  p.schema = 2;
  return p;
}

const OLD_A11Y_LABEL = "Alt text y contraste";

/** Formato 2 → 3: accesibilidad (WCAG) en su propio grupo de cuatro puntos. Lo que
 *  estaba marcado en "Alt text y contraste" pasa a contraste y alt text. */
function migrateTo3(p: Page): Page {
  for (const w of p.works) {
    if (!w.qa.length || w.qa.some((q) => q.group === WCAG_GROUP)) continue;
    const old = w.qa.find((q) => q.label === OLD_A11Y_LABEL);
    const kept = w.qa
      .filter((q) => q.label !== OLD_A11Y_LABEL)
      .map((q) => (q.group === "Técnico y accesibilidad" ? { ...q, group: "Técnico" } : q));
    const wcag: QaItem[] = WCAG_ITEMS.map((label, i) => {
      const inherits = old && i < 2; // contraste y alt text
      return {
        id: `${w.id}-wcag-${i}`,
        group: WCAG_GROUP,
        label,
        status: inherits ? old.status : "Pendiente",
        reason: inherits ? old.reason : undefined,
        taskId: inherits && i === 0 ? old.taskId : undefined,
      };
    });
    const task = w.tasks.find((t) => old && t.qaId === old.id);
    if (task) task.qaId = wcag[0].id;
    // El grupo WCAG va antes de "Entrega" para respetar el orden de la plantilla.
    const at = kept.findIndex((q) => q.group === "Entrega");
    w.qa = at < 0 ? [...kept, ...wcag] : [...kept.slice(0, at), ...wcag, ...kept.slice(at)];
  }
  p.schema = 3;
  return p;
}

function migrateAll(p: Page): Page {
  if ((p.schema ?? 1) < 2) migrate(p);
  if ((p.schema ?? 1) < 3) migrateTo3(p);
  return p;
}

async function backupOnce(name: string, pages: Page[]): Promise<void> {
  const key = `${BACKUP_PREFIX}${name}`;
  if (await db().get(key)) return;
  await db().set(key, { createdAt: new Date().toISOString(), pages });
}

export async function loadBackup(name: string): Promise<unknown> {
  return /^[\w.-]+$/.test(name) ? db().get(`${BACKUP_PREFIX}${name}`) : undefined;
}

async function upgrade(pages: Page[]): Promise<Page[]> {
  const stale = pages.filter((p) => (p.schema ?? 1) < SCHEMA);
  if (!stale.length) return pages;
  console.info(`[pageops] Migrando ${stale.length} página(s) al formato ${SCHEMA}.`);
  await backupOnce(`antes-schema-${SCHEMA}`, structuredClone(pages));
  await Promise.all(stale.map((p) => db().set(pageKey(p.id), migrateAll(p))));
  return pages;
}

let seeding: Promise<string[]> | undefined;

async function index(): Promise<string[]> {
  const ids = await db().get<string[]>(INDEX_KEY);
  if (ids) return ids;
  // Primera vez: cargar los datos de la hoja. El índice se escribe al final,
  // así que si algo falla a medias se vuelve a intentar completo.
  seeding ??= (async () => {
    // En paralelo: en Netlify cada escritura es una petición de red, y en fila
    // la primera carga podía pasar el límite de tiempo de la función.
    await Promise.all(seedPages.map((p) => db().set(pageKey(p.id), { ...p, schema: SCHEMA })));
    const seeded = seedPages.map((p) => p.id);
    await db().set(INDEX_KEY, seeded);
    return seeded;
  })().finally(() => {
    seeding = undefined;
  });
  return seeding;
}

export async function loadPages(): Promise<Page[]> {
  const ids = await index();
  const pages = await Promise.all(ids.map((id) => db().get<Page>(pageKey(id))));
  return upgrade(pages.filter((p): p is Page => Boolean(p)));
}

export async function loadPage(id: string): Promise<Page | undefined> {
  const ids = await index();
  if (!ids.includes(id)) return undefined;
  const page = await db().get<Page>(pageKey(id));
  if (!page || (page.schema ?? 1) >= SCHEMA) return page;
  return (await upgrade(await loadPages())).find((p) => p.id === id);
}

export async function savePage(page: Page): Promise<void> {
  const ids = await index();
  await db().set(pageKey(page.id), { ...page, schema: SCHEMA });
  if (!ids.includes(page.id)) await db().set(INDEX_KEY, [...ids, page.id]);
}

export async function deletePage(id: string): Promise<void> {
  const ids = await index();
  await db().set(
    INDEX_KEY,
    ids.filter((x) => x !== id),
  );
  await db().del(pageKey(id));
}
