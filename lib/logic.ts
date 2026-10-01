// Lógica pura (sin acceso a datos): se puede usar en servidor y en cliente.
import { WCAG_GROUP } from "./templates";
import type { Page, PageType, Stage, WorkItem } from "./types";

const WP_ORIGIN = "https://www.welovepaving.com";

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
  return w.stageSince?.slice(0, 10);
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
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${d} ${months[m - 1]} ${String(y).slice(2)}`;
}

export function formatDateTime(iso: string): string {
  if (iso.length <= 10) return formatDate(iso);
  const d = new Date(iso);
  const time = d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });
  return `${formatDate(d.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" }))} · ${time}`;
}

export function openReview(w: WorkItem) {
  const last = w.reviews.at(-1);
  return last && !last.closedAt ? last : undefined;
}

export function qaProgress(w: WorkItem): { done: number; total: number; failing: number; pending: number } {
  const failing = w.qa.filter((q) => q.status === "No pasa").length;
  const pending = w.qa.filter((q) => q.status === "Pendiente").length;
  return { done: w.qa.length - failing - pending, total: w.qa.length, failing, pending };
}

/** Avisos (no bloqueos) al mover un trabajo de etapa. Ver §4 del plan. */
export function stageWarnings(page: Page, w: WorkItem, target: Stage): string[] {
  const out: string[] = [];
  const qa = qaProgress(w);
  if ((target === "Revisión Admin" || target === "Publicado") && qa.total) {
    if (qa.failing) out.push(`QA: ${qa.failing} punto(s) no pasan.`);
    if (qa.pending) out.push(`QA: ${qa.pending} punto(s) sin revisar.`);
  }
  if (target === "Publicado") {
    const fb = pendingFeedback(w);
    if (fb) out.push(`Hay ${fb} punto(s) de feedback pendientes.`);
    const crit = w.tasks.filter((t) => t.critical && !t.done).length;
    if (crit) out.push(`Hay ${crit} tarea(s) crítica(s) abiertas.`);
    if (w.kind === "Página V2" && !page.publicUrl) out.push("Falta la URL pública de la página.");
  }
  return out;
}

export type CheckState = "pasa" | "no pasa" | "pendiente" | "sin checklist";

/** Estado del QA completo: aprobado solo si todo pasa o no aplica. */
export function qaState(w: WorkItem): CheckState {
  const { total, failing, pending } = qaProgress(w);
  if (!total) return "sin checklist";
  if (failing) return "no pasa";
  return pending ? "pendiente" : "pasa";
}

/** Estado de los puntos de accesibilidad (WCAG). */
export function wcagState(w: WorkItem): CheckState {
  const items = w.qa.filter((q) => q.group === WCAG_GROUP);
  if (!items.length) return "sin checklist";
  if (items.some((q) => q.status === "No pasa")) return "no pasa";
  return items.some((q) => q.status === "Pendiente") ? "pendiente" : "pasa";
}
