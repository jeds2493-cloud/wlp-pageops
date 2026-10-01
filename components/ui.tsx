import type { CSSProperties, ReactNode } from "react";
import { Accessibility as AccessibilityIcon, Check as CheckIcon, ExternalLink as ExternalIcon } from "lucide-react";
import type { Stage } from "@/lib/types";

/** Color de señal de cada etapa (paneles, puntos y barras). "Revisión Admin" usa el amarillo de marca. */
export const stageSignal: Record<Stage, string> = {
  "Por hacer": "var(--color-signal-concrete)",
  "En curso": "var(--color-signal-orange)",
  QA: "var(--color-signal-violet)",
  "Revisión Admin": "var(--color-signal-yellow)",
  "Cambios solicitados": "var(--color-signal-red)",
  Publicado: "var(--color-signal-green)",
  Archivado: "#8a857c",
};

export const stageDot: Record<Stage, string> = {
  "Por hacer": "bg-signal-concrete",
  "En curso": "bg-signal-orange",
  QA: "bg-signal-violet",
  "Revisión Admin": "bg-signal-yellow",
  "Cambios solicitados": "bg-signal-red",
  Publicado: "bg-signal-green",
  Archivado: "bg-stone-400",
};

export function StagePill({ stage }: { stage: Stage }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-800 ring-1 ring-inset ring-white/[.06]">
      <span aria-hidden className={`size-2 rounded-full ${stageDot[stage]}`} />
      {stage}
    </span>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" | "info" | "danger" }) {
  const tones = {
    neutral: "bg-stone-100 text-stone-700",
    warn: "bg-signal-yellow/15 text-signal-yellow",
    danger: "bg-signal-red/15 text-signal-red",
    info: "text-stone-600 ring-1 ring-inset ring-stone-300",
  };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

/**
 * Tile de asfalto. Con `title` toma la silueta de carpeta: la pestaña lleva el título
 * y el hueco a su derecha lleva `action`.
 */
export function Card({
  title,
  action,
  children,
  className = "",
  bodyClassName = "",
  flush = false,
  label,
  as: Tag = "section",
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
  label?: string;
  as?: "section" | "div" | "aside" | "article";
}) {
  if (!title) {
    return (
      <Tag aria-label={label} className={`tile ${flush ? "" : "p-5 md:p-6"} ${className}`}>
        {children}
      </Tag>
    );
  }
  return (
    <Tag aria-label={label} className={`tile-folder ${className}`}>
      <div className="flex items-end">
        <div className="tile-tab">
          {typeof title === "string" ? <h2 className="font-display text-xl leading-tight font-bold">{title}</h2> : title}
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 pb-2.5 pl-8 text-sm text-ink-2">{action}</div>
      </div>
      <div className={`tile-body ${flush ? "" : "p-5 pt-4 md:p-6 md:pt-4"} ${bodyClassName}`}>{children}</div>
    </Tag>
  );
}

/** Panel de color de señal dentro de una tile, con pestaña opcional a la derecha. */
export function Panel({
  signal = "var(--color-signal-yellow)",
  tab,
  children,
  className = "",
  label,
}: {
  signal?: string;
  tab?: ReactNode;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div aria-label={label} className={`panel ${tab ? "mt-8" : ""} ${className}`} style={{ "--signal": signal } as CSSProperties}>
      {tab && <div className="panel-tab">{tab}</div>}
      {children}
    </div>
  );
}

/** Franja de color que asoma debajo de una tile (estado que no debe pasar desapercibido). */
export function Underlay({ signal, strip, children }: { signal: string; strip?: ReactNode; children: ReactNode }) {
  if (!strip) return <>{children}</>;
  return (
    <div className="underlay">
      {children}
      <div className="underlay-strip" style={{ background: signal }}>
        {strip}
      </div>
    </div>
  );
}

/** Número grande condensado, con superíndice opcional (como "09:34⁵³"). */
export function Num({ value, sup, className = "" }: { value: ReactNode; sup?: ReactNode; className?: string }) {
  return (
    <span className={`num inline-flex items-start ${className}`}>
      {value}
      {sup !== undefined && <span className="ml-1 text-[0.38em] leading-none font-semibold opacity-80">{sup}</span>}
    </span>
  );
}

export function ExternalLink({
  href,
  children,
  primary = false,
}: {
  href: string;
  children: ReactNode;
  primary?: boolean;
  onDark?: boolean;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={primary ? "btn-signal" : "btn-soft"}>
      {children}
      <ExternalIcon aria-hidden className="size-3.5 opacity-70" />
    </a>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-stone-500">{children}</p>;
}

export const inputCls =
  "w-full rounded-xl border border-white/10 bg-well px-3 py-2 text-sm text-stone-900 shadow-[inset_0_1px_2px_rgb(0_0_0/0.5)] placeholder:text-stone-500 hover:border-white/20";

export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-stone-500">{label}</span>
      {children}
    </label>
  );
}

/** Encabezado de pantalla, directo sobre el concreto. */
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
    <header className="mx-auto max-w-[1600px] px-4 pt-7 pb-2 md:px-10 md:pt-9">
      {crumbs && <nav aria-label="Ruta" className="mb-2 flex flex-wrap items-center gap-1 text-sm font-medium text-ink-2">{crumbs}</nav>}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="font-display text-[2.6rem] leading-[0.9] font-extrabold tracking-[-0.01em] text-balance text-ink uppercase md:text-6xl">
            {title}
          </h1>
          {meta && <div className="mt-2.5 text-sm text-ink-2">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

export function PageBody({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto px-4 pt-5 pb-12 md:px-10 md:pt-6 ${wide ? "" : "max-w-[1600px]"}`}>{children}</div>;
}

const checkTone = {
  pasa: "text-signal-green",
  "no pasa": "text-signal-red",
  pendiente: "text-stone-500",
  "sin checklist": "text-stone-400",
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
          <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-signal-green">
            <CheckIcon className="size-3.5" /> Aprobado
          </span>
        ) : failing ? (
          <span className="font-semibold text-signal-red">
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
