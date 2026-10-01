"use server";

// Todas las ediciones pasan por aquí: cargan la página, la modifican,
// registran la actividad y la guardan.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAction } from "@/lib/auth";
import { stageWarnings } from "@/lib/logic";
import { slugify } from "@/lib/seed";
import { deletePage as removePage, loadPage, loadPages, loadTickets, savePage, saveTickets } from "@/lib/store";
import { qaCategory, qaItems, SUGGESTED_SP } from "@/lib/templates";
import {
  NOTE_KINDS,
  PAGE_TYPES,
  PRIORITIES,
  STAGES,
  TASK_CATEGORIES,
  type Actor,
  type FeedbackStatus,
  type NoteKind,
  type Page,
  type PageType,
  type Priority,
  type QaStatus,
  type Stage,
  type TaskCategory,
  type Ticket,
  type WorkItem,
} from "@/lib/types";

const ACTOR_COOKIE = "pageops_actor";

async function currentActor(): Promise<Actor> {
  return (await cookies()).get(ACTOR_COOKIE)?.value === "Admin" ? "Admin" : "Producción";
}

const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
const uid = () => crypto.randomUUID().slice(0, 8);
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optional = (fd: FormData, k: string) => str(fd, k) || undefined;

function oneOf<T extends string>(list: readonly T[], value: string, fallback: T): T {
  return (list as readonly string[]).includes(value) ? (value as T) : fallback;
}

interface Ctx {
  actor: Actor;
  log: (text: string) => void;
}

async function mutate(pageId: string, fn: (page: Page, ctx: Ctx) => void): Promise<void> {
  const page = await loadPage(pageId);
  if (!page) throw new Error(`No existe la página ${pageId}`);
  const actor = await currentActor();
  const ctx: Ctx = {
    actor,
    log: (text) => page.activity.unshift({ id: uid(), at: new Date().toISOString(), text, actor }),
  };
  fn(page, ctx);
  await savePage(page);
  revalidatePath("/", "layout");
}

function work(page: Page, workId: string): WorkItem {
  const w = page.works.find((x) => x.id === workId);
  if (!w) throw new Error(`No existe el trabajo ${workId}`);
  return w;
}

function parseWp(raw: string): { wpPageId?: number; publicUrl?: string } {
  const id = raw.match(/[?&]page_id=(\d+)/) ?? raw.match(/^(\d+)$/);
  return id ? { wpPageId: Number(id[1]) } : {};
}

// ── Quién edita ──────────────────────────────────────────────────────────────

export async function setActor(actor: Actor) {
  await requireAction();
  (await cookies()).set(ACTOR_COOKIE, actor, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}

// ── Páginas ──────────────────────────────────────────────────────────────────

export async function createPage(fd: FormData) {
  await requireAction();
  const title = str(fd, "title");
  if (!title) throw new Error("La página necesita un título.");
  const type = oneOf(PAGE_TYPES, str(fd, "type"), "Páginas Principales");
  const existing = new Set(["nueva", ...(await loadPages()).map((p) => p.id)]);
  let id = slugify(title) || "pagina";
  for (let n = 2; existing.has(id); n++) id = `${slugify(title)}-${n}`;

  const workId = `${id}-${uid()}`;
  const stage = oneOf(STAGES, str(fd, "stage"), "Por hacer");
  const actor = await currentActor();
  const sp = Number(str(fd, "storyPoints")) || SUGGESTED_SP[type];

  const page: Page = {
    id,
    title,
    type,
    channel: type === "Landing Pages" ? optional(fd, "channel") : undefined,
    ...parseWp(str(fd, "wp")),
    publicUrl: optional(fd, "publicUrl"),
    docsUrl: optional(fd, "docsUrl"),
    importWarnings: [],
    works: [
      {
        id: workId,
        kind: "Página V2",
        title,
        stage,
        stageSince: today(),
        priority: oneOf(PRIORITIES, str(fd, "priority"), "Normal"),
        storyPoints: sp,
        startDate: optional(fd, "startDate"),
        dueDate: optional(fd, "dueDate"),
        tasks: [],
        reviews: [],
        qa: qaItems(type, workId),
      },
    ],
    notes: [],
    activity: [{ id: uid(), at: new Date().toISOString(), text: `Página creada en "${stage}".`, actor }],
  };
  await savePage(page);
  revalidatePath("/", "layout");
  redirect(`/paginas/${id}`);
}

export async function updatePage(pageId: string, fd: FormData) {
  await requireAction();
  await mutate(pageId, (page, { log }) => {
    const title = str(fd, "title");
    if (title && title !== page.title) {
      log(`Título: "${page.title}" → "${title}".`);
      page.title = title;
    }
    const type = oneOf(PAGE_TYPES, str(fd, "type"), page.type) as PageType;
    if (type !== page.type) {
      log(`Tipo: ${page.type} → ${type}.`);
      page.type = type;
    }
    const wp = parseWp(str(fd, "wp")).wpPageId;
    const next = {
      channel: type === "Landing Pages" ? optional(fd, "channel") : undefined,
      wpPageId: wp,
      publicUrl: optional(fd, "publicUrl"),
      docsUrl: optional(fd, "docsUrl"),
    };
    const labels: Record<keyof typeof next, string> = {
      channel: "Canal",
      wpPageId: "ID de WordPress",
      publicUrl: "URL pública",
      docsUrl: "Documentación",
    };
    for (const k of Object.keys(next) as (keyof typeof next)[]) {
      if (page[k] !== next[k]) {
        log(`${labels[k]} actualizado.`);
        Object.assign(page, { [k]: next[k] });
      }
    }
  });
}

export async function dismissWarnings(pageId: string) {
  await requireAction();
  await mutate(pageId, (page, { log }) => {
    page.importWarnings = [];
    log("Avisos de importación marcados como revisados.");
  });
}

export async function deletePage(pageId: string) {
  await requireAction();
  await removePage(pageId);
  revalidatePath("/", "layout");
  redirect("/");
}

// ── Trabajos y etapas ────────────────────────────────────────────────────────

export async function setStage(pageId: string, workId: string, target: Stage) {
  await requireAction();
  await mutate(pageId, (page, { log }) => {
    const w = work(page, workId);
    if (w.stage === target) return;
    const skipped = stageWarnings(page, w, target);
    const from = w.stage;
    w.stage = target;
    w.stageSince = today();

    const last = w.reviews.at(-1);
    const open = last && !last.closedAt ? last : undefined;
    if (target === "Revisión Admin") {
      w.deliveredAt ??= today();
      if (!open || open.result) {
        if (open) open.closedAt = today();
        const number = (last?.number ?? 0) + 1;
        w.reviews.push({ id: uid(), number, requestedAt: today(), feedback: [] });
        log(`Revisión #${number} solicitada.`);
      }
    }
    if (target === "Cambios solicitados" && open && !open.result) {
      open.result = "Cambios solicitados";
      open.respondedAt = today();
    }
    // Entrega = cuando terminó tu parte. Si la página pasa directo a Publicado sin
    // revisión, se registra igual para que cuente en los story points de la semana.
    if (target === "Publicado") w.deliveredAt ??= today();
    if (target === "Publicado" && open) {
      open.result ??= "Aprobado";
      open.respondedAt ??= today();
      open.closedAt = today();
    }
    log(`Etapa: ${from} → ${target}.${skipped.length ? ` Avisos: ${skipped.join(" ")}` : ""}`);
  });
}

export async function updateWork(pageId: string, workId: string, fd: FormData) {
  await requireAction();
  await mutate(pageId, (page, { log }) => {
    const w = work(page, workId);
    const title = str(fd, "title");
    if (title && title !== w.title) {
      log(`Trabajo renombrado: "${title}".`);
      w.title = title;
    }
    const priority = oneOf(PRIORITIES, str(fd, "priority"), w.priority) as Priority;
    if (priority !== w.priority) log(`Prioridad: ${w.priority} → ${priority}.`);
    w.priority = priority;
    const sp = Number(str(fd, "storyPoints")) || undefined;
    if (sp !== w.storyPoints) log(`Story points: ${w.storyPoints ?? "—"} → ${sp ?? "—"}.`);
    w.storyPoints = sp;
    for (const [k, label] of [
      ["startDate", "Inicio"],
      ["dueDate", "Fecha de entrega"],
      ["deliveredAt", "Entregada el"],
    ] as const) {
      const v = optional(fd, k);
      if (v !== w[k]) log(`${label}: ${w[k] ?? "—"} → ${v ?? "—"}.`);
      w[k] = v;
    }
  });
}

export async function setBlocked(pageId: string, workId: string, fd: FormData) {
  await requireAction();
  await mutate(pageId, (page, { log }) => {
    const w = work(page, workId);
    const reason = str(fd, "reason");
    const detail = str(fd, "detail");
    if (!reason) {
      if (w.blocked) log(`Desbloqueado (estaba: ${w.blocked.reason}).`);
      w.blocked = undefined;
      return;
    }
    const full = detail ? `${reason}: ${detail}` : reason;
    w.blocked = { reason: full, since: today() };
    log(`Bloqueado — ${full}.`);
  });
}

export async function addAdjustment(pageId: string, fd: FormData) {
  await requireAction();
  const title = str(fd, "title");
  if (!title) return;
  await mutate(pageId, (page, { log }) => {
    page.works.push({
      id: `${page.id}-${uid()}`,
      kind: "Ajuste",
      title,
      stage: "Por hacer",
      stageSince: today(),
      priority: "Normal",
      storyPoints: Number(str(fd, "storyPoints")) || 1,
      tasks: [],
      reviews: [],
      qa: [],
    });
    log(`Ajuste creado: "${title}".`);
  });
}

export async function deleteWork(pageId: string, workId: string) {
  await requireAction();
  await mutate(pageId, (page, { log }) => {
    const w = work(page, workId);
    if (w.kind !== "Ajuste") throw new Error("Solo se pueden borrar ajustes.");
    page.works = page.works.filter((x) => x.id !== workId);
    log(`Ajuste eliminado: "${w.title}".`);
  });
}

// ── Revisiones y feedback ────────────────────────────────────────────────────

export async function addFeedback(pageId: string, workId: string, reviewId: string, fd: FormData) {
  await requireAction();
  // Cada línea del texto pegado es un punto de feedback.
  const lines = str(fd, "text")
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-*\d.)]+/, "").trim())
    .filter(Boolean);
  if (!lines.length) return;
  await mutate(pageId, (page, { actor, log }) => {
    const r = work(page, workId).reviews.find((x) => x.id === reviewId);
    if (!r) return;
    for (const text of lines) r.feedback.push({ id: uid(), text, status: "Pendiente", author: actor });
    log(`${lines.length} punto(s) de feedback en la Revisión #${r.number}.`);
  });
}

export async function setFeedbackStatus(
  pageId: string,
  workId: string,
  reviewId: string,
  feedbackId: string,
  status: FeedbackStatus,
  reason?: string,
) {
  await requireAction();
  await mutate(pageId, (page, { log }) => {
    const f = work(page, workId)
      .reviews.find((x) => x.id === reviewId)
      ?.feedback.find((x) => x.id === feedbackId);
    if (!f) return;
    f.status = status;
    f.discardReason = status === "Descartado" ? reason || undefined : undefined;
    log(`Feedback "${f.text}" → ${status}${f.discardReason ? ` (${f.discardReason})` : ""}.`);
  });
}

export async function feedbackToTask(pageId: string, workId: string, reviewId: string, feedbackId: string) {
  await requireAction();
  await mutate(pageId, (page, { log }) => {
    const w = work(page, workId);
    const f = w.reviews.find((x) => x.id === reviewId)?.feedback.find((x) => x.id === feedbackId);
    if (!f || f.taskId) return;
    const task = { id: uid(), title: f.text, category: "Diseño/UI" as TaskCategory, done: false, critical: false, feedbackId: f.id };
    w.tasks.push(task);
    f.taskId = task.id;
    log(`Tarea creada desde feedback: "${f.text}".`);
  });
}

export async function closeReview(pageId: string, workId: string, reviewId: string, result: "Aprobado" | "Cambios solicitados") {
  await requireAction();
  await mutate(pageId, (page, { log }) => {
    const w = work(page, workId);
    const r = w.reviews.find((x) => x.id === reviewId);
    if (!r) return;
    r.result = result;
    r.respondedAt = today();
    if (result === "Aprobado") r.closedAt = today();
    const target: Stage = result === "Aprobado" ? "Publicado" : "Cambios solicitados";
    log(`Revisión #${r.number}: ${result}. Etapa: ${w.stage} → ${target}.`);
    if (target === "Publicado") w.deliveredAt ??= today();
    w.stage = target;
    w.stageSince = today();
  });
}

// ── Tareas ───────────────────────────────────────────────────────────────────

export async function addTask(pageId: string, workId: string, fd: FormData) {
  await requireAction();
  const title = str(fd, "title");
  if (!title) return;
  await mutate(pageId, (page, { log }) => {
    work(page, workId).tasks.push({
      id: uid(),
      title,
      category: oneOf(TASK_CATEGORIES, str(fd, "category"), "Diseño/UI"),
      done: false,
      critical: fd.get("critical") === "on",
    });
    log(`Tarea agregada: "${title}".`);
  });
}

export async function toggleTask(pageId: string, workId: string, taskId: string) {
  await requireAction();
  await mutate(pageId, (page, { log }) => {
    const w = work(page, workId);
    const t = w.tasks.find((x) => x.id === taskId);
    if (!t) return;
    t.done = !t.done;
    log(`Tarea ${t.done ? "completada" : "reabierta"}: "${t.title}".`);
    // Si la tarea vino de un feedback, el feedback se resuelve con ella.
    const f = w.reviews.flatMap((r) => r.feedback).find((x) => x.id === t.feedbackId);
    if (f) f.status = t.done ? "Resuelto" : "Pendiente";
    // Si vino de un punto de QA que no pasó, al cerrarla el punto vuelve a revisarse.
    const q = w.qa.find((x) => x.id === t.qaId);
    if (q && t.done && q.status === "No pasa") {
      q.status = "Pendiente";
      log(`QA "${q.label}" vuelve a revisarse.`);
    }
  });
}

export async function updateTask(pageId: string, workId: string, taskId: string, fd: FormData) {
  await requireAction();
  await mutate(pageId, (page) => {
    const t = work(page, workId).tasks.find((x) => x.id === taskId);
    if (!t) return;
    t.category = oneOf(TASK_CATEGORIES, str(fd, "category"), t.category);
    t.critical = fd.get("critical") === "on";
  });
}

export async function deleteTask(pageId: string, workId: string, taskId: string) {
  await requireAction();
  await mutate(pageId, (page, { log }) => {
    const w = work(page, workId);
    const t = w.tasks.find((x) => x.id === taskId);
    if (!t) return;
    w.tasks = w.tasks.filter((x) => x.id !== taskId);
    for (const f of w.reviews.flatMap((r) => r.feedback)) if (f.taskId === taskId) f.taskId = undefined;
    log(`Tarea eliminada: "${t.title}".`);
  });
}

// ── QA ───────────────────────────────────────────────────────────────────────

export async function setQa(pageId: string, workId: string, qaId: string, status: QaStatus, reason?: string) {
  await requireAction();
  const why = reason?.trim();
  if (status === "No aplica" && !why) throw new Error("Para marcar «No aplica» hace falta el motivo.");
  await mutate(pageId, (page, { log }) => {
    const w = work(page, workId);
    const q = w.qa.find((x) => x.id === qaId);
    if (!q || (q.status === status && q.reason === why)) return;
    const openTask = w.tasks.find((t) => t.id === q.taskId && !t.done);
    q.status = status;
    q.reason = status === "No aplica" ? why : undefined;
    if (status === "No pasa") {
      // No pasa = abre una tarea crítica, ligada al punto.
      if (!openTask) {
        const task = {
          id: uid(),
          title: `QA: ${q.label}`,
          category: qaCategory(page.type, q.group),
          done: false,
          critical: true,
          qaId: q.id,
        };
        w.tasks.push(task);
        q.taskId = task.id;
      }
      log(`QA "${q.label}": no pasa. Tarea abierta.`);
      return;
    }
    // Pasa o no aplica: la tarea que abrió este punto ya no hace falta.
    if (openTask && status !== "Pendiente") {
      openTask.done = true;
      log(`Tarea "${openTask.title}" cerrada con el punto de QA.`);
    }
    log(`QA "${q.label}": ${status.toLowerCase()}${q.reason ? ` (${q.reason})` : ""}.`);
  });
}

export async function resetQa(pageId: string, workId: string) {
  await requireAction();
  await mutate(pageId, (page, { log }) => {
    const w = work(page, workId);
    w.qa = qaItems(page.type, `${w.id}-${uid()}`);
    log("Checklist de QA reiniciado desde la plantilla.");
  });
}

// ── Notas ────────────────────────────────────────────────────────────────────

export async function addNote(pageId: string, fd: FormData) {
  await requireAction();
  const body = str(fd, "body");
  if (!body) return;
  await mutate(pageId, (page, { actor, log }) => {
    const kind = oneOf(NOTE_KINDS, str(fd, "kind"), actor === "Admin" ? "Indicación del Admin" : "General") as NoteKind;
    page.notes.unshift({ id: uid(), kind, author: actor, body, createdAt: new Date().toISOString() });
    log(`Nota agregada (${kind}).`);
  });
}

export async function deleteNote(pageId: string, noteId: string) {
  await requireAction();
  await mutate(pageId, (page, { log }) => {
    page.notes = page.notes.filter((n) => n.id !== noteId);
    log("Nota eliminada.");
  });
}

// ── Edición en línea (se guarda al cambiar el campo) ─────────────────────────

const WORK_FIELDS = {
  title: "Título",
  priority: "Prioridad",
  storyPoints: "Story points",
  startDate: "Inicio",
  dueDate: "Fecha de entrega",
  deliveredAt: "Entregada el",
} as const;
type WorkField = keyof typeof WORK_FIELDS;

export async function setWorkField(pageId: string, workId: string, field: WorkField, raw: string) {
  await requireAction();
  if (!(field in WORK_FIELDS)) throw new Error(`Campo no editable: ${field}`);
  await mutate(pageId, (page, { log }) => {
    const w = work(page, workId);
    const value = raw.trim();
    const before = w[field];
    if (field === "title") {
      if (!value) return;
      w.title = value;
    } else if (field === "priority") {
      w.priority = oneOf(PRIORITIES, value, w.priority) as Priority;
    } else if (field === "storyPoints") {
      w.storyPoints = Number(value) || undefined;
    } else {
      w[field] = value || undefined;
    }
    if (before !== w[field]) log(`${WORK_FIELDS[field]}: ${before ?? "—"} → ${w[field] ?? "—"}.`);
  });
}

// ── Tickets ──────────────────────────────────────────────────────────────────

async function mutateTickets(fn: (tickets: Ticket[], actor: Actor) => void) {
  const tickets = await loadTickets();
  fn(tickets, await currentActor());
  await saveTickets(tickets);
  revalidatePath("/", "layout");
}

export async function createTicket(fd: FormData) {
  await requireAction();
  const title = str(fd, "title");
  if (!title) return;
  await mutateTickets((tickets, actor) => {
    tickets.push({
      id: uid(),
      number: tickets.reduce((n, t) => Math.max(n, t.number), 0) + 1,
      title,
      detail: optional(fd, "detail"),
      priority: oneOf(PRIORITIES, str(fd, "priority"), "Normal") as Priority,
      pageId: optional(fd, "pageId"),
      createdAt: new Date().toISOString(),
      createdBy: actor,
    });
  });
}

export async function closeTicket(id: string) {
  await requireAction();
  await mutateTickets((tickets, actor) => {
    const t = tickets.find((x) => x.id === id);
    if (!t || t.closedAt) return;
    t.closedAt = new Date().toISOString();
    t.closedBy = actor;
  });
}

export async function reopenTicket(id: string) {
  await requireAction();
  await mutateTickets((tickets) => {
    const t = tickets.find((x) => x.id === id);
    if (!t) return;
    t.closedAt = undefined;
    t.closedBy = undefined;
  });
}

export async function deleteTicket(id: string) {
  await requireAction();
  await mutateTickets((tickets) => {
    const i = tickets.findIndex((x) => x.id === id);
    if (i >= 0) tickets.splice(i, 1);
  });
}
