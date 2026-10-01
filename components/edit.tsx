"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { setActor, setFeedbackStatus, setQa, setStage } from "@/app/actions";
import type { Actor, QaStatus, Stage } from "@/lib/types";

/** Botón de envío de formulario con estado de "guardando". */
export function SubmitButton({ children, variant = "primary" }: { children: ReactNode; variant?: "primary" | "ghost" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold transition active:scale-[0.97] disabled:opacity-50 ${
        variant === "primary"
          ? "bg-wlp-yellow text-stone-900 hover:bg-wlp-yellow-hover"
          : "border border-stone-300 bg-white text-stone-800 hover:border-stone-900"
      }`}
    >
      {pending ? "Guardando…" : children}
    </button>
  );
}

/** Ejecuta una acción del servidor al hacer clic, con confirmación opcional. */
export function ActionButton({
  action,
  confirmText,
  children,
  className = "",
  title,
}: {
  action: () => Promise<void>;
  confirmText?: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      title={title}
      disabled={pending}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        start(() => action());
      }}
      className={`transition disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function ActorSwitch({ actor }: { actor: Actor }) {
  const [pending, start] = useTransition();
  return (
    <div className="mt-3 md:mt-6">
      <p className="mb-2 hidden font-mono text-[10px] tracking-[0.12em] text-stone-500 uppercase md:block">Editando como</p>
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-wlp-dark-2 p-1">
        {(["Producción", "Admin"] as const).map((a) => (
          <button
            key={a}
            type="button"
            disabled={pending}
            onClick={() => start(() => setActor(a))}
            className={`rounded-md px-2 py-1.5 text-xs font-semibold transition ${
              actor === a ? "bg-wlp-yellow text-stone-900" : "text-stone-400 hover:text-white"
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StageSelect({
  pageId,
  workId,
  stage,
  stages,
  warnings,
}: {
  pageId: string;
  workId: string;
  stage: Stage;
  stages: readonly Stage[];
  warnings: Partial<Record<Stage, string[]>>;
}) {
  const [pending, start] = useTransition();
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="font-mono text-[10.5px] tracking-[0.1em] text-stone-500 uppercase">Mover a</span>
      <select
        value={stage}
        disabled={pending}
        onChange={(e) => {
          const target = e.target.value as Stage;
          const w = warnings[target] ?? [];
          if (w.length && !window.confirm(`Antes de mover a "${target}":\n\n• ${w.join("\n• ")}\n\n¿Continuar de todas formas?`)) {
            e.target.value = stage;
            return;
          }
          start(() => setStage(pageId, workId, target));
        }}
        className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-sm font-semibold focus:border-stone-900 focus:outline-none"
      >
        {stages.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {pending && <span className="text-xs text-stone-400">Guardando…</span>}
    </label>
  );
}

const QA_NEXT: Record<QaStatus, QaStatus> = { Pendiente: "OK", OK: "N/A", "N/A": "Pendiente" };

export function QaToggle({
  pageId,
  workId,
  qaId,
  status,
  label,
}: {
  pageId: string;
  workId: string;
  qaId: string;
  status: QaStatus;
  label: string;
}) {
  const [optimistic, setOptimistic] = useState(status);
  const [, start] = useTransition();
  const shown = optimistic;
  return (
    <button
      type="button"
      onClick={() => {
        const next = QA_NEXT[shown];
        setOptimistic(next);
        start(() => setQa(pageId, workId, qaId, next));
      }}
      className="flex w-full items-start gap-2 rounded-md px-1 py-0.5 text-left text-sm hover:bg-stone-50"
      title="Clic: Pendiente → OK → N/A"
    >
      <span
        className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border text-[10px] font-bold ${
          shown === "OK"
            ? "border-emerald-600 bg-emerald-600 text-white"
            : shown === "N/A"
              ? "border-stone-300 bg-stone-100 text-stone-400"
              : "border-stone-300"
        }`}
      >
        {shown === "OK" ? "✓" : shown === "N/A" ? "–" : ""}
      </span>
      <span className={shown === "N/A" ? "text-stone-400 line-through" : "text-stone-700"}>{label}</span>
    </button>
  );
}

export function DiscardFeedback({
  pageId,
  workId,
  reviewId,
  feedbackId,
}: {
  pageId: string;
  workId: string;
  reviewId: string;
  feedbackId: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const reason = window.prompt("¿Por qué se descarta este punto?");
        if (reason === null) return;
        start(() => setFeedbackStatus(pageId, workId, reviewId, feedbackId, "Descartado", reason));
      }}
      className="rounded-md px-2 py-1 text-xs font-semibold text-stone-500 hover:bg-stone-100 hover:text-stone-900"
    >
      Descartar
    </button>
  );
}
