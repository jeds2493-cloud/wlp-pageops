import type { PageType, QaItem } from "./types";

export interface QaGroup {
  group: string;
  items: string[];
}

const base: QaGroup[] = [
  {
    group: "Rendimiento",
    items: [
      "PageSpeed móvil ≥ objetivo",
      "Imagen del hero optimizada (y decidido si se muestra en celular)",
      "Iframes y mapas como imagen estática o con carga diferida",
      "CSS/JS: bloque de código vs. hook, compatible con el diferido de WP Rocket",
    ],
  },
  {
    group: "Color y diseño",
    items: [
      "Amarillo y negro con la saturación de la guía",
      "Secciones claras revisadas",
      "Consistente con las demás páginas V2",
    ],
  },
  { group: "Responsive", items: ["Móvil, tablet y escritorio", "Sin overflow horizontal"] },
  { group: "Contenido", items: ["Copy revisado", "CTAs y teléfono correctos"] },
  { group: "SEO", items: ["Title y meta description", "Un solo H1", "Slug final"] },
  { group: "Técnico", items: ["Enlaces probados", "Formulario enviando", "Sin errores de consola"] },
  { group: "Accesibilidad", items: ["Alt text", "Contraste", "Foco visible"] },
];

const extras: Partial<Record<PageType, QaGroup>> = {
  "Landing Pages": {
    group: "Landing",
    items: ["Tracking del canal", "Thank-you page", "Key events", "UTM"],
  },
  Empleos: {
    group: "Empleo",
    items: ["Formulario de aplicación funcionando", "Datos del puesto correctos"],
  },
};

export function qaTemplate(type: PageType): QaGroup[] {
  const extra = extras[type];
  return extra ? [...base, extra] : base;
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
