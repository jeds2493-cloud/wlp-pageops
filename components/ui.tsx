import type { ReactNode } from "react";
import type { Stage } from "@/lib/types";

// "Revisión Admin" usa el amarillo de marca: es la etapa que más se vigila.
const stageStyles: Record<Stage, string> = {
  "Por hacer": "bg-stone-100 text-stone-600 ring-stone-300",
  "En curso": "bg-blue-50 text-blue-800 ring-blue-200",
  QA: "bg-violet-50 text-violet-800 ring-violet-200",
  "Revisión Admin": "bg-[#FDF3CF] text-[#6B4E00] ring-[#F2C230]/60",
  "Cambios solicitados": "bg-red-50 text-[#A32424] ring-red-200",
  Publicado: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Archivado: "bg-stone-50 text-stone-400 ring-stone-200",
};

const stageDot: Record<Stage, string> = {
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
      <span className={`size-1.5 rounded-full ${stageDot[stage]}`} />
      {stage}
    </span>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" | "info" }) {
  const tones = {
    neutral: "bg-stone-100 text-stone-600",
    warn: "bg-[#FDF3CF] text-[#6B4E00]",
    info: "bg-wlp-dark text-stone-300",
  };
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0.5 font-mono text-[10.5px] font-medium tracking-[0.04em] uppercase ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function PageHeader({
  title,
  eyebrow,
  subtitle,
  children,
}: {
  title: string;
  eyebrow?: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-4xl leading-none font-extrabold tracking-[0.005em] text-stone-900 uppercase">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-sm text-stone-500">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function Card({ title, children, className = "" }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-wlp border border-stone-200 bg-white ${className}`}>
      {title && (
        <h2 className="border-b border-stone-200 px-5 py-3 font-mono text-[11px] font-medium tracking-[0.1em] text-stone-500 uppercase">
          {title}
        </h2>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function ExternalLink({
  href,
  children,
  primary = false,
}: {
  href?: string;
  children: ReactNode;
  primary?: boolean;
}) {
  if (!href) {
    return (
      <span className="inline-flex items-center rounded-lg border border-dashed border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-400">
        {children}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition active:scale-[0.97] ${
        primary
          ? "bg-wlp-yellow text-stone-900 hover:bg-wlp-yellow-hover"
          : "border border-stone-300 bg-white text-stone-800 hover:border-stone-900"
      }`}
    >
      {children} <span aria-hidden>↗</span>
    </a>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm text-stone-400">{children}</p>;
}
