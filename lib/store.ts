// Almacenamiento de las páginas. En Netlify usa Netlify Blobs (persistente y
// compartido entre quienes usan la app); en local, un archivo en .data/.
// La primera vez que el almacén está vacío se carga con los datos de la hoja.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { getStore } from "@netlify/blobs";
import { seedPages } from "./seed";
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

function blobsBackend(): Backend | undefined {
  try {
    const store = getStore({ name: STORE_NAME, consistency: "strong" });
    return {
      async get<T>(key: string) {
        return ((await store.get(key, { type: "json" })) ?? undefined) as T | undefined;
      },
      set: (key, value) => store.setJSON(key, value).then(() => undefined),
      del: (key) => store.delete(key),
    };
  } catch {
    // Fuera de Netlify no hay contexto de Blobs: se usa el archivo local.
    return undefined;
  }
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

let backend: Backend | undefined;
function db(): Backend {
  backend ??= blobsBackend() ?? fileBackend();
  return backend;
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
    await Promise.all(seedPages.map((p) => db().set(pageKey(p.id), p)));
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
  return pages.filter((p): p is Page => Boolean(p));
}

export async function loadPage(id: string): Promise<Page | undefined> {
  const ids = await index();
  return ids.includes(id) ? db().get<Page>(pageKey(id)) : undefined;
}

export async function savePage(page: Page): Promise<void> {
  const ids = await index();
  await db().set(pageKey(page.id), page);
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
