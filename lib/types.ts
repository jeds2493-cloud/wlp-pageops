export const PAGE_TYPES = [
  "Páginas Principales",
  "Servicios Core",
  "Empleos",
  "Landing Pages",
] as const;
export type PageType = (typeof PAGE_TYPES)[number];

export const STAGES = [
  "Por hacer",
  "En curso",
  "QA",
  "Revisión Admin",
  "Cambios solicitados",
  "Publicado",
  "Archivado",
] as const;
export type Stage = (typeof STAGES)[number];

export type WorkKind = "Página V2" | "Ajuste";
export const PRIORITIES = ["Urgente", "Alta", "Normal", "Baja"] as const;
export type Priority = (typeof PRIORITIES)[number];
export const STORY_POINTS = [1, 2, 3, 5, 8, 13] as const;

export const BLOCK_REASONS = [
  "Decisión del Admin",
  "Contenido/copy",
  "Fotos/video",
  "Accesos",
  "Dependencia técnica",
  "Otro",
] as const;

export type Actor = "Producción" | "Admin";

export const TASK_CATEGORIES = [
  "Diseño/UI",
  "Color",
  "Responsive",
  "Copy",
  "Rendimiento",
  "Imágenes",
  "SEO",
  "Accesibilidad",
  "Tracking",
  "WordPress",
  "Formularios",
  "Bug",
] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  done: boolean;
  critical: boolean;
  feedbackId?: string;
  /** Punto de QA que no pasó y generó esta tarea. */
  qaId?: string;
}

export type FeedbackStatus = "Pendiente" | "Resuelto" | "Descartado";

export interface FeedbackItem {
  id: string;
  text: string;
  status: FeedbackStatus;
  author?: Actor;
  discardReason?: string;
  taskId?: string;
}

export interface Review {
  id: string;
  number: number;
  requestedAt: string; // ISO date
  respondedAt?: string;
  closedAt?: string;
  result?: "Aprobado" | "Cambios solicitados";
  feedback: FeedbackItem[];
}

export interface WorkItem {
  id: string;
  kind: WorkKind;
  title: string;
  stage: Stage;
  priority: Priority;
  storyPoints?: number;
  startDate?: string;
  dueDate?: string;
  deliveredAt?: string;
  blocked?: { reason: string; since: string };
  /** Desde cuándo está en la etapa actual (fecha ISO). */
  stageSince?: string;
  tasks: Task[];
  reviews: Review[];
  qa: QaItem[];
}

export const QA_STATUSES = ["Pendiente", "Pasa", "No pasa", "No aplica"] as const;
export type QaStatus = (typeof QA_STATUSES)[number];

export interface QaItem {
  id: string;
  group: string;
  label: string;
  status: QaStatus;
  /** Motivo obligatorio cuando no aplica. */
  reason?: string;
  /** Tarea abierta cuando no pasa. */
  taskId?: string;
}

export const NOTE_KINDS = ["Decisión técnica", "Indicación del Admin", "General"] as const;
export type NoteKind = (typeof NOTE_KINDS)[number];

export interface Note {
  id: string;
  kind: NoteKind;
  author: Actor;
  body: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  /** Fecha (YYYY-MM-DD) o fecha y hora ISO. */
  at: string;
  text: string;
  actor?: Actor;
}

export interface Page {
  id: string;
  title: string;
  type: PageType;
  channel?: string;
  wpPageId?: number;
  publicUrl?: string;
  docsUrl?: string;
  /** Problemas detectados al importar desde la hoja. */
  importWarnings: string[];
  /** Versión del formato de datos (ver migrate en lib/store.ts). */
  schema?: number;
  works: WorkItem[];
  notes: Note[];
  activity: ActivityEntry[];
}

export interface Ticket {
  id: string;
  number: number;
  title: string;
  detail?: string;
  priority: Priority;
  /** Página relacionada (opcional). */
  pageId?: string;
  createdAt: string;
  createdBy: Actor;
  closedAt?: string;
  closedBy?: Actor;
}
