import type { ReactNode } from "react";
import type { Stage } from "@/lib/types";

const stageStyles: Record<Stage, string> = {
  "Por hacer": "bg-stone-100 text-stone-700 ring-stone-200",
  "En curso": "bg-blue-50 text-blue-700 ring-blue-200",
  QA: "bg-violet-50 text-violet-700 ring-violet-200",
  "Revisión Admin": "bg-amber-50 text-amber-800 ring-amber-200",
  "Cambios solicitados": "bg-orange-50 text-orange-800 ring-orange-200",
  Publicado: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Archivado: "bg-stone-50 text-stone-400 ring-stone-200",
};

const stageDot: Record<Stage, string> = {
  "Por hacer": "bg-stone-400",
  "En curso": "bg-blue-500",
  QA: "bg-violet-500",
  "Revisión Admin": "bg-amber-500",
  "Cambios solicitados": "bg-orange-500",
  Publicado: "bg-emerald-500",
  Archivado: "bg-stone-300",
};

export function StagePill({ stage }: { stage: Stage }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${stageStyles[stage]}`}
    >
      <span className={`size-1.5 rounded-full ${stageDot[stage]}`} />
      {stage}
    </span>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" | "info" }) {
  const tones = {
    neutral: "bg-stone-100 text-stone-600",
    warn: "bg-amber-100 text-amber-900",
    info: "bg-sky-50 text-sky-800",
  };
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-stone-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-stone-200 bg-white ${className}`}>
      {title && <h2 className="border-b border-stone-100 px-4 py-2.5 text-sm font-medium text-stone-700">{title}</h2>}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function ExternalLink({ href, children }: { href?: string; children: ReactNode }) {
  if (!href) {
    return (
      <span className="inline-flex items-center rounded-md border border-dashed border-stone-200 px-2.5 py-1 text-xs text-stone-400">
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:border-stone-300 hover:bg-stone-50"
    >
      {children} <span aria-hidden>↗</span>
    </a>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-stone-400">{children}</p>;
}
