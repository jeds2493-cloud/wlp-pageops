// Datos iniciales: las 25 páginas de la hoja de cálculo, en limpio. Todas arrancan en
// "Por hacer", sin revisiones, notas, ajustes ni actividad, para empezar el control desde
// cero. Se conservan el tipo, el canal, el ID de WordPress o la URL, y un estimado de story
// points según las anclas del plan.
import type { Page, PageType } from "./types";
import { qaItems } from "./templates";

const RESET_AT = "2026-10-01";

interface Row {
  title: string;
  type: PageType;
  url: string;
  sp: number;
  channel?: string;
}

const rows: Row[] = [
  { title: "404 — Surface Failure", type: "Páginas Principales", url: "https://www.welovepaving.com/?page_id=109513&preview=true", sp: 2 },
  { title: "Thank You — Message Received", type: "Páginas Principales", url: "https://www.welovepaving.com/?page_id=109693&preview=true", sp: 2 },
  { title: "Home — V2", type: "Páginas Principales", url: "https://www.welovepaving.com/?page_id=110308&preview=true", sp: 8 },
  { title: "Get a Free Proposal — Contacto", type: "Páginas Principales", url: "https://www.welovepaving.com/?page_id=112378&preview=true", sp: 3 },
  { title: "Services — V2", type: "Páginas Principales", url: "https://www.welovepaving.com/?page_id=113050&preview=true", sp: 5 },
  { title: "Testimonials — V2", type: "Páginas Principales", url: "https://www.welovepaving.com/?page_id=113239&preview=true#t-03", sp: 3 },
  { title: "Our Areas of Expertise — V2", type: "Páginas Principales", url: "https://www.welovepaving.com/?page_id=113809&preview=true", sp: 5 },
  { title: "Service Areas — V2", type: "Páginas Principales", url: "https://www.welovepaving.com/?page_id=114037&preview=true", sp: 8 },
  { title: "Projects — V2", type: "Páginas Principales", url: "https://www.welovepaving.com/?page_id=114166&preview=true", sp: 8 },
  { title: "About Us — V2", type: "Páginas Principales", url: "https://www.welovepaving.com/?page_id=114319&preview=true", sp: 5 },
  { title: "Project Gallery — V2", type: "Páginas Principales", url: "https://www.welovepaving.com/?page_id=114475&preview=true", sp: 8 },
  { title: "The Paving Panda Pledge", type: "Páginas Principales", url: "https://www.welovepaving.com/careers-v2/", sp: 5 },
  { title: "Careers — V2", type: "Páginas Principales", url: "https://www.welovepaving.com/careers-v2/", sp: 5 },
  { title: "Empleos — V2", type: "Páginas Principales", url: "https://www.welovepaving.com/empleos-v2/", sp: 5 },
  { title: "Corporate Information — V2", type: "Páginas Principales", url: "https://www.welovepaving.com/corporate-information-v2/", sp: 5 },
  { title: "Our Values — V2", type: "Páginas Principales", url: "https://www.welovepaving.com/?page_id=119440&preview=true#safety-", sp: 5 },
  { title: "Contractor Partnership — V2", type: "Páginas Principales", url: "http://welovepaving.com/?page_id=119455&preview=true", sp: 5 },
  { title: "ADA Upgrades — V2", type: "Servicios Core", url: "https://www.welovepaving.com/?page_id=114631&preview=true", sp: 5 },
  { title: "Business Development Sales", type: "Empleos", url: "https://www.welovepaving.com/business-development-sales-v2/", sp: 3 },
  { title: "Bilingual Office Staff", type: "Empleos", url: "https://www.welovepaving.com/?page_id=119434&preview=true", sp: 3 },
  { title: "CDL Commercial Drivers", type: "Empleos", url: "https://www.welovepaving.com/?page_id=119464&preview=true", sp: 3 },
  { title: "Especialista en Concreto y Formas", type: "Empleos", url: "https://www.welovepaving.com/?page_id=120082&preview=true", sp: 3 },
  { title: "LP Concrete — Service Finder", type: "Landing Pages", url: "https://www.welovepaving.com/lp-concrete-service-finder/", sp: 3, channel: "Bing" },
  { title: "LP Concrete — Construction", type: "Landing Pages", url: "https://www.welovepaving.com/lp-concrete-construction/", sp: 3, channel: "Bing" },
  { title: "LP Concrete — Repair", type: "Landing Pages", url: "https://www.welovepaving.com/lp-concrete-repair/", sp: 3, channel: "Bing" },
];

export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
  const workId = `${id}-w1`;
  return {
    id,
    title: row.title,
    type: row.type,
    channel: row.channel,
    ...parseUrl(row.url),
    importWarnings: [],
    works: [
      {
        id: workId,
        kind: "Página V2",
        title: row.title,
        stage: "Por hacer",
        stageSince: RESET_AT,
        priority: "Normal",
        storyPoints: row.sp,
        tasks: [],
        reviews: [],
        qa: qaItems(row.type, workId),
      },
    ],
    notes: [],
    activity: [{ id: `${id}-a0`, at: RESET_AT, text: "Control reiniciado: la página arranca en Por hacer." }],
  };
}

export const seedPages: Page[] = rows.map(buildPage);
