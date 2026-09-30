// Datos iniciales: las 25 páginas de la hoja de cálculo (ver docs/pageops/datos-iniciales.csv
// en el repo del sitio). Los story points son estimados iniciales según las anclas del plan.
import type {
  FeedbackItem,
  Note,
  Page,
  PageType,
  Stage,
  Task,
  TaskCategory,
  WorkItem,
} from "./types";

const IMPORTED_AT = "2026-09-30";

interface Row {
  title: string;
  type: PageType;
  stage: Stage;
  deliveredAt?: string;
  dueDate?: string;
  url: string;
  sp: number;
  channel?: string;
  /** Feedback del Admin pendiente (páginas en revisión). */
  feedback?: string[];
  /** Nota original de la hoja, conservada como nota de la página. */
  note?: { kind: Note["kind"]; body: string };
  /** Pendiente de una página ya publicada: se vuelve un trabajo de Ajuste. */
  adjustment?: { title: string; category: TaskCategory };
  warnings?: string[];
}

const rows: Row[] = [
  { title: "404 — Surface Failure", type: "Páginas Principales", stage: "Publicado", deliveredAt: "2026-08-22", url: "https://www.welovepaving.com/?page_id=109513&preview=true", sp: 2 },
  { title: "Thank You — Message Received", type: "Páginas Principales", stage: "Publicado", deliveredAt: "2026-08-22", url: "https://www.welovepaving.com/?page_id=109693&preview=true", sp: 2 },
  {
    title: "Home — V2", type: "Páginas Principales", stage: "Publicado", deliveredAt: "2026-08-26", url: "https://www.welovepaving.com/?page_id=110308&preview=true", sp: 8,
    note: { kind: "Decisión técnica", body: "Se está revisando el rendimiento; se quitó la imagen del hero en celular." },
    adjustment: { title: "Revisar rendimiento de Home", category: "Rendimiento" },
  },
  {
    title: "Get a Free Proposal — Contacto", type: "Páginas Principales", stage: "Publicado", deliveredAt: "2026-08-26", url: "https://www.welovepaving.com/?page_id=112378&preview=true", sp: 3,
    note: { kind: "Decisión técnica", body: "El CSS se quedó cargando como bloque de código. Hay que ver si es la mejor opción o cargarlo desde un hook." },
    adjustment: { title: "Evaluar cargar el CSS desde un hook", category: "WordPress" },
  },
  {
    title: "Services — V2", type: "Páginas Principales", stage: "Publicado", deliveredAt: "2026-08-28", url: "https://www.welovepaving.com/?page_id=113050&preview=true", sp: 5,
    note: { kind: "Decisión técnica", body: "El mapa es un iframe con carga diferida y tarda en cargar; mejor colocar una imagen diluida. El código daba tiempo a cargar el hero, pero WP Rocket ya lo carga una vez diferido." },
    adjustment: { title: "Reemplazar el iframe del mapa por una imagen diluida", category: "Rendimiento" },
  },
  {
    title: "Testimonials — V2", type: "Páginas Principales", stage: "Publicado", deliveredAt: "2026-08-31", url: "https://www.welovepaving.com/?page_id=113239&preview=true#t-03", sp: 3,
    note: { kind: "Indicación del Admin", body: "Que no sea un deslizamiento, sino que carguen todas al mismo tiempo." },
    adjustment: { title: "Mostrar todos los testimonios a la vez en lugar del carrusel", category: "Diseño/UI" },
    warnings: ["El enlace de la hoja incluía el ancla #t-03."],
  },
  { title: "Our Areas of Expertise — V2", type: "Páginas Principales", stage: "Publicado", deliveredAt: "2026-09-24", url: "https://www.welovepaving.com/?page_id=113809&preview=true", sp: 5 },
  { title: "Service Areas — V2", type: "Páginas Principales", stage: "Publicado", deliveredAt: "2026-09-24", url: "https://www.welovepaving.com/?page_id=114037&preview=true", sp: 8 },
  {
    title: "Projects — V2", type: "Páginas Principales", stage: "Publicado", deliveredAt: "2026-09-03", url: "https://www.welovepaving.com/?page_id=114166&preview=true", sp: 8,
    note: { kind: "Indicación del Admin", body: "Los proyectos más visuales, ya que se siente solo una vista de lista." },
    adjustment: { title: "Hacer los proyectos más visuales (hoy se siente como lista)", category: "Diseño/UI" },
  },
  {
    title: "About Us — V2", type: "Páginas Principales", stage: "Revisión Admin", deliveredAt: "2026-09-24", url: "https://www.welovepaving.com/?page_id=114319&preview=true", sp: 5,
    feedback: ["Revisar rendimiento", "Revisar detalles de la página"],
  },
  { title: "Project Gallery — V2", type: "Páginas Principales", stage: "Revisión Admin", deliveredAt: "2026-09-24", url: "https://www.welovepaving.com/?page_id=114475&preview=true", sp: 8 },
  {
    title: "The Paving Panda Pledge", type: "Páginas Principales", stage: "Revisión Admin", deliveredAt: "2026-09-24", url: "https://www.welovepaving.com/careers-v2/", sp: 5,
    feedback: ["Revisar la saturación de los amarillos", "Revisar el negro de alerta", "Revisar las secciones con colores claros"],
    warnings: ["El enlace de la hoja es el mismo que el de Careers — V2."],
  },
  {
    title: "Careers — V2", type: "Páginas Principales", stage: "Revisión Admin", deliveredAt: "2026-09-24", url: "https://www.welovepaving.com/careers-v2/", sp: 5,
    feedback: ["Bajar la saturación de las tarjetas en las secciones inferiores (las tarjetas de roles están bien)"],
  },
  {
    title: "Empleos — V2", type: "Páginas Principales", stage: "Revisión Admin", deliveredAt: "2026-09-25", url: "https://www.welovepaving.com/empleos-v2/", sp: 5,
    feedback: ["Revisar la imagen del hero", "Revisar la saturación de negro y amarillo"],
  },
  { title: "Corporate Information — V2", type: "Páginas Principales", stage: "Revisión Admin", deliveredAt: "2026-09-25", url: "https://www.welovepaving.com/corporate-information-v2/", sp: 5 },
  {
    title: "Our Values — V2", type: "Páginas Principales", stage: "En curso", url: "https://www.welovepaving.com/?page_id=119440&preview=true#safety-", sp: 5,
    warnings: ["El enlace de la hoja incluía el ancla #safety-."],
  },
  {
    title: "Contractor Partnership — V2", type: "Páginas Principales", stage: "En curso", url: "http://welovepaving.com/?page_id=119455&preview=true", sp: 5,
    warnings: ["El enlace de la hoja estaba en http:// y sin www."],
  },
  { title: "ADA Upgrades — V2", type: "Servicios Core", stage: "Revisión Admin", deliveredAt: "2026-09-25", url: "https://www.welovepaving.com/?page_id=114631&preview=true", sp: 5 },
  { title: "Business Development Sales", type: "Empleos", stage: "En curso", url: "https://www.welovepaving.com/business-development-sales-v2/", sp: 3 },
  { title: "Bilingual Office Staff", type: "Empleos", stage: "En curso", url: "https://www.welovepaving.com/?page_id=119434&preview=true", sp: 3 },
  { title: "CDL Commercial Drivers", type: "Empleos", stage: "En curso", url: "https://www.welovepaving.com/?page_id=119464&preview=true", sp: 3 },
  { title: "Especialista en Concreto y Formas", type: "Empleos", stage: "En curso", url: "https://www.welovepaving.com/?page_id=120082&preview=true", sp: 3 },
  { title: "LP Concrete — Service Finder", type: "Landing Pages", channel: "Bing", stage: "Publicado", dueDate: "2026-09-24", url: "https://www.welovepaving.com/lp-concrete-service-finder/", sp: 3 },
  { title: "LP Concrete — Construction", type: "Landing Pages", channel: "Bing", stage: "Publicado", dueDate: "2026-09-24", url: "https://www.welovepaving.com/lp-concrete-construction/", sp: 3 },
  { title: "LP Concrete — Repair", type: "Landing Pages", channel: "Bing", stage: "Publicado", dueDate: "2026-09-24", url: "https://www.welovepaving.com/lp-concrete-repair/", sp: 3 },
];

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseUrl(raw: string): { wpPageId?: number; publicUrl?: string } {
  const id = raw.match(/[?&]page_id=(\d+)/);
  if (id) return { wpPageId: Number(id[1]) };
  return { publicUrl: raw.replace(/^http:\/\/(www\.)?/, "https://www.") };
}

function buildPage(row: Row): Page {
  const id = slugify(row.title);
  const works: WorkItem[] = [];
  const activity: Page["activity"] = [
    { id: `${id}-a0`, at: IMPORTED_AT, text: `Importada desde la hoja (${row.type}).` },
  ];

  const feedback: FeedbackItem[] = (row.feedback ?? []).map((text, i) => ({
    id: `${id}-f${i + 1}`,
    text,
    status: "Pendiente",
  }));

  // Si el Admin ya dejó notas, la revisión regresó con cambios: ahora te toca a ti.
  const stage: Stage = row.stage === "Revisión Admin" && feedback.length ? "Cambios solicitados" : row.stage;

  works.push({
    id: `${id}-w1`,
    kind: "Página V2",
    title: row.title,
    stage,
    priority: "Normal",
    storyPoints: row.sp,
    dueDate: row.dueDate,
    deliveredAt: row.deliveredAt,
    tasks: [],
    reviews:
      row.stage === "Revisión Admin" && row.deliveredAt
        ? [
            {
              id: `${id}-r1`,
              number: 1,
              requestedAt: row.deliveredAt,
              result: feedback.length ? "Cambios solicitados" : undefined,
              feedback,
            },
          ]
        : [],
  });

  if (row.deliveredAt) {
    activity.push({
      id: `${id}-a1`,
      at: row.deliveredAt,
      text:
        row.stage === "Publicado"
          ? "Entregada (fecha \"Desde\" de la hoja)."
          : feedback.length
            ? "Entregada a Revisión Admin (Revisión #1). El Admin pidió cambios (notas de la hoja)."
            : "Entregada y enviada a Revisión Admin (Revisión #1).",
    });
  }

  if (row.adjustment) {
    const task: Task = {
      id: `${id}-t1`,
      title: row.adjustment.title,
      category: row.adjustment.category,
      done: false,
      critical: false,
    };
    works.push({
      id: `${id}-w2`,
      kind: "Ajuste",
      title: row.adjustment.title,
      stage: "Por hacer",
      priority: "Normal",
      storyPoints: 1,
      tasks: [task],
      reviews: [],
    });
    activity.push({
      id: `${id}-a2`,
      at: IMPORTED_AT,
      text: `Ajuste abierto a partir de la nota de la hoja: "${row.adjustment.title}".`,
    });
  }

  const notes: Note[] = row.note
    ? [
        {
          id: `${id}-n1`,
          kind: row.note.kind,
          author: row.note.kind === "Indicación del Admin" ? "Admin" : "Producción",
          body: row.note.body,
          createdAt: row.deliveredAt ?? IMPORTED_AT,
        },
      ]
    : [];

  return {
    id,
    title: row.title,
    type: row.type,
    channel: row.channel,
    ...parseUrl(row.url),
    importWarnings: row.warnings ?? [],
    works,
    notes,
    activity: activity.sort((a, b) => b.at.localeCompare(a.at)),
  };
}

export const seedPages: Page[] = rows.map(buildPage);
