// Capa de datos del servidor: lee del almacén (Netlify Blobs o archivo local).
import { loadPages } from "./store";
import type { Page } from "./types";

export * from "./logic";

export async function getPages(): Promise<Page[]> {
  return withComputedWarnings(await loadPages());
}

export async function getPage(id: string): Promise<Page | undefined> {
  return (await getPages()).find((p) => p.id === id);
}

/** Aviso cuando dos páginas comparten el mismo enlace. */
function withComputedWarnings(pages: Page[]): Page[] {
  const byLink = new Map<string, string[]>();
  for (const p of pages) {
    const key = p.wpPageId ? `wp:${p.wpPageId}` : p.publicUrl;
    if (!key) continue;
    byLink.set(key, [...(byLink.get(key) ?? []), p.title]);
  }
  return pages.map((p) => {
    const key = p.wpPageId ? `wp:${p.wpPageId}` : p.publicUrl;
    const others = (key ? byLink.get(key) ?? [] : []).filter((t) => t !== p.title);
    const dup = others.length ? [`Comparte enlace con: ${others.join(", ")}.`] : [];
    const warnings = [...new Set([...p.importWarnings, ...dup])].filter(
      (w) => !(dup.length && w.startsWith("El enlace de la hoja es el mismo")),
    );
    return { ...p, importWarnings: warnings };
  });
}

