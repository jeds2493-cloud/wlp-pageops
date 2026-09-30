// Capa de datos. En Fase 0 lee los datos iniciales en memoria; en Fase 1 estas
// funciones pasan a consultar Supabase sin que cambien las pantallas.
import { seedPages } from "./seed";
import type { Page, PageType, Stage, WorkItem } from "./types";

const WP_ORIGIN = "https://www.welovepaving.com";

export async function getPages(): Promise<Page[]> {
  return withComputedWarnings(seedPages);
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

export function previewUrl(p: Page): string | undefined {
  return p.wpPageId ? `${WP_ORIGIN}/?page_id=${p.wpPageId}&preview=true` : undefined;
}

export function editUrl(p: Page): string | undefined {
  return p.wpPageId ? `${WP_ORIGIN}/wp-admin/post.php?post=${p.wpPageId}&action=edit` : undefined;
}

export function mainWork(p: Page): WorkItem {
  return p.works.find((w) => w.kind === "Página V2") ?? p.works[0];
}

export function openAdjustments(p: Page): WorkItem[] {
  return p.works.filter(
    (w) => w.kind === "Ajuste" && w.stage !== "Publicado" && w.stage !== "Archivado",
  );
}

export function pendingFeedback(w: WorkItem): number {
  return w.reviews.reduce(
    (n, r) => n + r.feedback.filter((f) => f.status === "Pendiente").length,
    0,
  );
}

export function daysSince(iso: string, now: Date): number {
  const ms = now.getTime() - new Date(`${iso}T12:00:00`).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Fecha desde la que el trabajo está en su etapa actual, si se conoce. */
export function stageSince(w: WorkItem): string | undefined {
  if (w.stage === "Revisión Admin") {
    const open = w.reviews.at(-1);
    return open?.requestedAt ?? w.deliveredAt;
  }
  return undefined;
}

export interface AttentionItem {
  page: Page;
  reason: string;
  tone: "warn" | "info";
}

export function attention(pages: Page[], now: Date): AttentionItem[] {
  const items: AttentionItem[] = [];
  for (const p of pages) {
    const w = mainWork(p);
    const since = stageSince(w);
    if (w.stage === "Revisión Admin" && since) {
      const d = daysSince(since, now);
      if (d > 2) items.push({ page: p, reason: `${d} días esperando al Admin`, tone: "warn" });
    }
    if (w.dueDate && w.stage !== "Publicado" && daysSince(w.dueDate, now) > 0) {
      items.push({ page: p, reason: "Fecha de entrega vencida", tone: "warn" });
    }
    if (w.stage === "Cambios solicitados") {
      items.push({ page: p, reason: pendingFeedback(w) === 1 ? "1 cambio pedido por el Admin" : `${pendingFeedback(w)} cambios pedidos por el Admin`, tone: "warn" });
    }
    if (w.blocked) items.push({ page: p, reason: `Bloqueada: ${w.blocked.reason}`, tone: "warn" });
    for (const a of openAdjustments(p)) {
      items.push({ page: p, reason: `Ajuste abierto: ${a.title}`, tone: "info" });
    }
    for (const warn of p.importWarnings) {
      items.push({ page: p, reason: warn, tone: "info" });
    }
  }
  return items.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === "warn" ? -1 : 1));
}

export function countByStage(pages: Page[]): Record<Stage, number> {
  const out = {} as Record<Stage, number>;
  for (const p of pages) {
    const s = mainWork(p).stage;
    out[s] = (out[s] ?? 0) + 1;
  }
  return out;
}

export function countByType(pages: Page[]): Partial<Record<PageType, number>> {
  const out: Partial<Record<PageType, number>> = {};
  for (const p of pages) out[p.type] = (out[p.type] ?? 0) + 1;
  return out;
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${months[m - 1]} ${String(y).slice(2)}`;
}
