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
export type Priority = "Urgente" | "Alta" | "Normal" | "Baja";

export type TaskCategory =
  | "Diseño/UI"
  | "Color"
  | "Responsive"
  | "Copy"
  | "Rendimiento"
  | "Imágenes"
  | "SEO"
  | "Accesibilidad"
  | "Tracking"
  | "WordPress"
  | "Formularios"
  | "Bug";

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  done: boolean;
  critical: boolean;
  feedbackId?: string;
}

export type FeedbackStatus = "Pendiente" | "Resuelto" | "Descartado";

export interface FeedbackItem {
  id: string;
  text: string;
  status: FeedbackStatus;
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
  tasks: Task[];
  reviews: Review[];
}

export type NoteKind = "Decisión técnica" | "Indicación del Admin" | "General";

export interface Note {
  id: string;
  kind: NoteKind;
  author: "Producción" | "Admin";
  body: string;
  createdAt: string;
}

export interface ActivityEntry {
  id: string;
  at: string;
  text: string;
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
  works: WorkItem[];
  notes: Note[];
  activity: ActivityEntry[];
}
