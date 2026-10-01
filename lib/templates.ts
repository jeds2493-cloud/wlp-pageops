import type { PageType, QaItem, TaskCategory } from "./types";

export interface QaGroup {
  group: string;
  /** Categoría de la tarea que se abre cuando un punto no pasa. */
  category: TaskCategory;
  items: string[];
}

/** Grupo de accesibilidad: alimenta el indicador WCAG de la tabla de páginas. */
export const WCAG_GROUP = "Accesibilidad (WCAG)";
export const WCAG_ITEMS = [
  "Contraste AA: 4.5:1 en texto",
  "Alt text en imágenes",
  "Navegación con teclado y foco visible",
  "Botones y enlaces con nombre claro",
];

// Checklist de aprobación: las reglas que se revisan en cada página de WLP.
const base: QaGroup[] = [
  {
    group: "Rendimiento",
    category: "Rendimiento",
    items: ["PageSpeed celular: 80 o más", "PageSpeed escritorio: 90 o más", "Caché de WP Rocket limpia"],
  },
  {
    group: "Reglas WLP",
    category: "Diseño/UI",
    items: [
      "noindex revisado",
      "Fondos alternados entre secciones",
      "Sin rostros en las imágenes",
      "Solo «California» como región",
      "FAQs hechas en GenerateBlocks",
      "El panda no tapa botones en celular",
    ],
  },
  {
    group: "Diseño y responsive",
    category: "Responsive",
    items: ["Amarillo y negro con la saturación de la guía", "Celular, tablet y escritorio sin desbordes"],
  },
  {
    group: "Contenido y SEO",
    category: "SEO",
    items: ["Copy revisado", "CTAs y teléfono correctos", "Title y meta description", "Un solo H1 y slug final"],
  },
  { group: "Técnico", category: "Bug", items: ["Enlaces probados", "Sin errores de consola"] },
  {
    group: WCAG_GROUP,
    category: "Accesibilidad",
    items: WCAG_ITEMS,
  },
  { group: "Entrega", category: "WordPress", items: ["Reporte final con QR"] },
];

const extras: Partial<Record<PageType, QaGroup>> = {
  "Landing Pages": {
    group: "Landing",
    category: "Tracking",
    items: ["Tracking del canal", "Thank-you page", "Key events y UTM"],
  },
  Empleos: { group: "Empleo", category: "Copy", items: ["Datos del puesto correctos"] },
};

export function qaTemplate(type: PageType): QaGroup[] {
  const extra = extras[type];
  return extra ? [...base, extra] : base;
}

/** Labels del checklist anterior: si un trabajo aún los tiene sin marcar, se reemplaza. */
export const LEGACY_QA_LABELS = ["PageSpeed móvil ≥ objetivo", "Formulario enviando"];

export function qaCategory(type: PageType, group: string): TaskCategory {
  return qaTemplate(type).find((g) => g.group === group)?.category ?? "Bug";
}

/** Checklist de QA listo para copiarse a un trabajo nuevo. */
export function qaItems(type: PageType, prefix: string): QaItem[] {
  return qaTemplate(type).flatMap((g, gi) =>
    g.items.map((label, i) => ({ id: `${prefix}-q${gi}-${i}`, group: g.group, label, status: "Pendiente" as const })),
  );
}

/** Story points sugeridos por tipo de página (anclas del plan). */
export const SUGGESTED_SP: Record<PageType, number> = {
  "Páginas Principales": 5,
  "Servicios Core": 5,
  Empleos: 3,
  "Landing Pages": 3,
};
