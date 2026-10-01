import type { ReactNode } from "react";
import { Accessibility as AccessibilityIcon, Check as CheckIcon, ExternalLink as ExternalIcon } from "lucide-react";
import type { Stage } from "@/lib/types";

// "Revisión Admin" usa el amarillo de marca: es la etapa que más se vigila.
const stageStyles: Record<Stage, string> = {
  "Por hacer": "bg-stone-100 text-stone-600 ring-stone-300",
  "En curso": "bg-blue-50 text-blue-800 ring-blue-200",
  QA: "bg-violet-50 text-violet-800 ring-violet-200",
  "Revisión Admin": "bg-[#FDF3CF] text-[#6B4E00] ring-[#F2C230]/60",
  "Cambios solicitados": "bg-red-50 text-[#A32424] ring-red-200",
  Publicado: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Archivado: "bg-stone-50 text-stone-500 ring-stone-200",
};

export const stageDot: Record<Stage, string> = {
  "Por hacer": "bg-stone-400",
  "En curso": "bg-blue-500",
  QA: "bg-violet-500",
  "Revisión Admin": "bg-wlp-yellow",
  "Cambios solicitados": "bg-wlp-red",
  Publicado: "bg-emerald-500",
  Archivado: "bg-stone-300",
};

export function StagePill({ stage }: { stage: Stage }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${stageStyles[stage]}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${stageDot[stage]}`} />
      {stage}
    </span>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" | "info" }) {
  const tones = {
    neutral: "bg-stone-100 text-stone-600",
    warn: "bg-[#FDF3CF] text-[#6B4E00]",
    info: "bg-white text-stone-600 ring-1 ring-inset ring-stone-300",
  };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-4xl leading-none font-extrabold text-balance text-stone-900 uppercase">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Card({
  title,
  action,
  children,
  className = "",
  flush = false,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={`rounded-wlp border border-stone-200 bg-white ${className}`}>
      {title && (
        <header className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-stone-800">{title}</h2>
          {action}
        </header>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}

export function ExternalLink({
  href,
  children,
  primary = false,
  onDark = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
  onDark?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors ${
        primary
          ? "bg-wlp-yellow text-stone-900 hover:bg-wlp-yellow-hover"
          : onDark
            ? "border border-stone-600 text-white hover:border-wlp-yellow hover:text-wlp-yellow"
            : "border border-stone-300 bg-white text-stone-800 hover:border-stone-900"
      }`}
    >
      {children}
      <ExternalIcon aria-hidden className="size-3.5 opacity-70" />
    </a>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-stone-500">{children}</p>;
}

export const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-500 hover:border-stone-400";

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-stone-600">{label}</span>
      {children}
    </label>
  );
}

/** Encabezado de pantalla: franja de asfalto con la línea de carril amarilla. */
export function Masthead({
  crumbs,
  title,
  meta,
  actions,
  children,
}: {
  crumbs?: ReactNode;
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="asphalt text-white">
      <div className="mx-auto max-w-[1600px] px-4 pt-6 pb-6 md:px-10 md:pt-8">
        {crumbs && <nav aria-label="Ruta" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-stone-400">{crumbs}</nav>}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-4xl leading-[0.95] font-extrabold text-balance uppercase md:text-5xl">{title}</h1>
            {meta && <div className="mt-2 text-sm text-stone-300">{meta}</div>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
      <div className="lane-line" aria-hidden />
    </header>
  );
}

export function PageBody({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto px-4 py-6 md:px-10 md:py-8 ${wide ? "" : "max-w-[1600px]"}`}>{children}</div>;
}

const checkTone = {
  pasa: "text-emerald-700",
  "no pasa": "text-[#A32424]",
  pendiente: "text-stone-500",
  "sin checklist": "text-stone-300",
} as const;

const checkWord = { pasa: "pasa", "no pasa": "no pasa", pendiente: "pendiente", "sin checklist": "sin checklist" } as const;

/** Celda de QA: avance del checklist y personita de accesibilidad (WCAG). */
export function QaCell({
  done,
  total,
  failing,
  qa,
  wcag,
}: {
  done: number;
  total: number;
  failing: number;
  qa: keyof typeof checkTone;
  wcag: keyof typeof checkTone;
}) {
  const label = `QA ${qa === "pasa" ? "aprobado" : `${done} de ${total}`}${failing ? `, ${failing} no pasan` : ""}. Accesibilidad WCAG: ${checkWord[wcag]}.`;
  return (
    <span className="inline-flex items-center gap-2" title={label}>
      <span className="sr-only">{label}</span>
      <span aria-hidden className="inline-flex min-w-16 items-center gap-1 font-mono text-sm">
        {qa === "pasa" ? (
          <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-emerald-700">
            <CheckIcon className="size-3.5" /> Aprobado
          </span>
        ) : failing ? (
          <span className="font-semibold text-[#A32424]">
            {done}/{total}
          </span>
        ) : (
          <span className="text-stone-700">{total ? `${done}/${total}` : "—"}</span>
        )}
      </span>
      <AccessibilityIcon aria-hidden className={`size-4.5 ${checkTone[wcag]}`} strokeWidth={2.25} />
    </span>
  );
}
