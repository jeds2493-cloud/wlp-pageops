"use client";

import { useActionState, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Check, Lock, Plus, RotateCcw, Unlock, X } from "lucide-react";
import {
  addAdjustment,
  closeReview,
  setActor,
  setBlocked,
  setFeedbackStatus,
  setQa,
  setStage,
  setWorkField,
  updatePage,
} from "@/app/actions";
import { formatDate } from "@/lib/logic";
import { BLOCK_REASONS, type Actor, type QaStatus, type Stage } from "@/lib/types";
import { Field, inputCls } from "./ui";

const btn = {
  primary: "btn-signal",
  ghost: "btn-soft",
  quiet:
    "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-white/[.06] hover:text-stone-900 disabled:opacity-50",
};
export const buttonCls = btn;

function confirmWarnings(target: string, warnings: string[] | undefined): boolean {
  if (!warnings?.length) return true;
  return window.confirm(`Antes de mover a "${target}":\n\n• ${warnings.join("\n• ")}\n\n¿Continuar de todas formas?`);
}

/** Botón de envío de formulario con estado de "guardando". */
export function SubmitButton({ children, variant = "primary" }: { children: ReactNode; variant?: keyof typeof btn }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btn[variant]}>
      {pending ? "Guardando…" : children}
    </button>
  );
}

/** Ejecuta una acción del servidor al hacer clic, con confirmación opcional. */
export function ActionButton({
  action,
  confirmText,
  children,
  className = btn.quiet,
  label,
}: {
  action: () => Promise<void>;
  confirmText?: string;
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={() => {
        if (confirmText && !window.confirm(confirmText)) return;
        start(() => action());
      }}
      className={className}
    >
      {children}
    </button>
  );
}

export function ActorSwitch({ actor }: { actor: Actor }) {
  const [pending, start] = useTransition();
  return (
    <div role="group" aria-label="Editando como" className="flex items-center gap-2">
      <span className="hidden text-xs text-stone-500 lg:inline">Editando como</span>
      <div className="seg">
        {(["Producción", "Admin"] as const).map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={actor === a}
            disabled={pending}
            onClick={() => start(() => setActor(a))}
            className={`min-h-8 rounded-full px-3 text-sm font-semibold transition-colors ${
              actor === a ? "bg-stone-800 text-ink" : "text-stone-500 hover:text-stone-900"
            }`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Etapas ───────────────────────────────────────────────────────────────────

const PATH: Stage[] = ["Por hacer", "En curso", "QA", "Revisión Admin", "Publicado"];

/** La barra de etapas es el único control de etapa: clic en un paso para moverse. */
export function StageStepper({
  pageId,
  workId,
  stage,
  warnings,
}: {
  pageId: string;
  workId: string;
  stage: Stage;
  warnings: Partial<Record<Stage, string[]>>;
}) {
  const [pending, start] = useTransition();
  const steps: Stage[] =
    stage === "Cambios solicitados" ? [...PATH.slice(0, 4), "Cambios solicitados", "Publicado"] : stage === "Archivado" ? [...PATH, "Archivado"] : PATH;
  const idx = steps.indexOf(stage);
  return (
    <ol aria-label="Etapa" className={`grid min-w-[560px] auto-cols-fr grid-flow-col gap-1 ${pending ? "opacity-60" : ""}`}>
      {steps.map((s, i) => {
        const current = i === idx;
        const past = i < idx;
        return (
          <li key={s}>
            <button
              type="button"
              aria-current={current ? "step" : undefined}
              disabled={pending || current}
              onClick={() => confirmWarnings(s, warnings[s]) && start(() => setStage(pageId, workId, s))}
              className="flex w-full flex-col gap-2 rounded-xl px-2 py-1.5 text-left transition-colors enabled:hover:bg-black/[.07] disabled:cursor-default"
            >
              <span className="flex h-4 items-center text-[11px] font-bold tracking-[0.08em] uppercase">
                {past ? <Check aria-hidden className="size-3.5" strokeWidth={3} /> : current ? "Ahora" : null}
              </span>
              <span className="relative flex h-2 items-center">
                <span aria-hidden className="track absolute inset-x-0 top-1/2 -translate-y-1/2" />
                {(past || current) && (
                  <span aria-hidden className={`relative rounded-full bg-ink ${current ? "h-[7px] w-[88%]" : "h-[5px] w-[70%]"}`} />
                )}
              </span>
              <span className={`text-sm leading-tight ${current ? "font-bold" : past ? "font-semibold" : "font-medium text-ink/70"}`}>{s}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Una sola acción principal, según la etapa del trabajo. */
export function StageCTA({
  pageId,
  workId,
  stage,
  nextReview,
  openReviewId,
  pending,
  warnings,
}: {
  pageId: string;
  workId: string;
  stage: Stage;
  nextReview: number;
  openReviewId?: string;
  pending: number;
  warnings: Partial<Record<Stage, string[]>>;
}) {
  const [busy, start] = useTransition();
  const go = (target: Stage, extra?: string) => {
    const w = [...(warnings[target] ?? []), ...(extra ? [extra] : [])];
    if (confirmWarnings(target, w)) start(() => setStage(pageId, workId, target));
  };
  switch (stage) {
    case "Por hacer":
      return (
        <button type="button" disabled={busy} onClick={() => go("En curso")} className={btn.primary}>
          Empezar
        </button>
      );
    case "En curso":
      return (
        <button type="button" disabled={busy} onClick={() => go("QA")} className={btn.primary}>
          Pasar a QA
        </button>
      );
    case "QA":
      return (
        <button type="button" disabled={busy} onClick={() => go("Revisión Admin")} className={btn.primary}>
          Solicitar revisión #{nextReview}
        </button>
      );
    case "Cambios solicitados":
      return (
        <button
          type="button"
          disabled={busy}
          onClick={() => go("Revisión Admin", pending ? `Quedan ${pending} punto(s) de feedback sin resolver.` : undefined)}
          className={btn.primary}
        >
          Reenviar a revisión #{nextReview}
        </button>
      );
    case "Revisión Admin":
      return (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              if (pending && !window.confirm(`Quedan ${pending} punto(s) de feedback sin resolver. ¿Aprobar y publicar de todas formas?`)) return;
              start(() => (openReviewId ? closeReview(pageId, workId, openReviewId, "Aprobado") : setStage(pageId, workId, "Publicado")));
            }}
            className={btn.primary}
          >
            <Check aria-hidden className="size-4" /> Aprobar y publicar
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              start(() =>
                openReviewId ? closeReview(pageId, workId, openReviewId, "Cambios solicitados") : setStage(pageId, workId, "Cambios solicitados"),
              )
            }
            className={btn.ghost}
          >
            Pedir cambios
          </button>
        </div>
      );
    case "Archivado":
      return (
        <button type="button" disabled={busy} onClick={() => go("Por hacer")} className={btn.ghost}>
          <RotateCcw aria-hidden className="size-4" /> Reabrir
        </button>
      );
    default:
      return (
        <span className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-signal-green">
          <Check aria-hidden className="size-4" /> Publicada
        </span>
      );
  }
}

// ── Edición en línea ─────────────────────────────────────────────────────────

type WorkField = "title" | "priority" | "storyPoints" | "startDate" | "dueDate" | "deliveredAt";

/** Dato que se lee como texto y se edita en su lugar; se guarda al cambiar. */
export function InlineField({
  pageId,
  workId,
  field,
  label,
  value,
  options,
  kind = "select",
}: {
  pageId: string;
  workId: string;
  field: WorkField;
  label: string;
  value?: string | number;
  options?: readonly (string | number)[];
  kind?: "select" | "date" | "text";
}) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLInputElement & HTMLSelectElement>(null);
  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1600);
    return () => clearTimeout(t);
  }, [saved]);

  const shown = value === undefined || value === "" ? "—" : kind === "date" ? formatDate(String(value)) : String(value);
  const save = (v: string) => {
    setEditing(false);
    if (v === String(value ?? "")) return;
    start(async () => {
      await setWorkField(pageId, workId, field, v);
      setSaved(true);
    });
  };

  return (
    <div className="min-w-0">
      <span className="block text-xs font-medium text-stone-500">{label}</span>
      {editing ? (
        kind === "select" ? (
          <select
            ref={ref}
            defaultValue={String(value ?? "")}
            onChange={(e) => save(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
            className={`${inputCls} mt-0.5 py-1`}
          >
            {field === "storyPoints" && <option value="">—</option>}
            {options?.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        ) : (
          <input
            ref={ref}
            type={kind}
            defaultValue={String(value ?? "")}
            onBlur={(e) => save(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save(e.currentTarget.value);
              if (e.key === "Escape") setEditing(false);
            }}
            className={`${inputCls} mt-0.5 py-1`}
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`${label}: ${shown}. Editar`}
          className={`-ml-1.5 flex min-h-9 max-w-full items-center gap-1.5 rounded-lg px-1.5 text-left text-sm font-semibold hover:bg-white/[.06] ${
            shown === "—" ? "text-stone-500" : "text-stone-900"
          } ${pending ? "opacity-50" : ""}`}
        >
          <span className="truncate">{shown}</span>
          {saved && <Check aria-hidden className="size-3.5 text-signal-green" />}
        </button>
      )}
      <span aria-live="polite" className="sr-only">
        {saved ? `${label} guardado` : ""}
      </span>
    </div>
  );
}

// ── Bloqueo ──────────────────────────────────────────────────────────────────

export function BlockToggle({
  pageId,
  workId,
  blocked,
}: {
  pageId: string;
  workId: string;
  blocked?: { reason: string; since: string };
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  // El motivo se ve en la franja roja bajo la tile; aquí solo se desbloquea.
  if (blocked) {
    return (
      <button
        type="button"
        disabled={pending}
        title={`Bloqueado: ${blocked.reason} · desde ${formatDate(blocked.since)}`}
        onClick={() => {
          const fd = new FormData();
          fd.set("reason", "");
          start(() => setBlocked(pageId, workId, fd));
        }}
        className={`${btn.quiet} text-signal-red hover:text-signal-red`}
      >
        <Unlock aria-hidden className="size-4" /> Desbloquear
      </button>
    );
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btn.quiet}>
        <Lock aria-hidden className="size-4" /> Bloquear
      </button>
    );
  }
  return (
    <form
      action={async (fd) => {
        await setBlocked(pageId, workId, fd);
        setOpen(false);
      }}
      className="flex w-full flex-wrap items-end gap-2 rounded-2xl bg-stone-50 p-3"
    >
      <Field label="Motivo">
        <select name="reason" required defaultValue="" className={inputCls} autoFocus>
          <option value="" disabled>
            Elige un motivo
          </option>
          {BLOCK_REASONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </Field>
      <Field label="Detalle (opcional)" className="min-w-40 flex-1">
        <input name="detail" className={inputCls} placeholder="Ej. esperando fotos del proyecto" />
      </Field>
      <SubmitButton variant="ghost">Bloquear</SubmitButton>
      <button type="button" onClick={() => setOpen(false)} className={btn.quiet}>
        Cancelar
      </button>
    </form>
  );
}

// ── Ajustes y notas ──────────────────────────────────────────────────────────

export function AddAdjustment({ pageId, label = "Ajuste" }: { pageId: string; label?: string }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btn.quiet}>
        <Plus aria-hidden className="size-4" /> {label}
      </button>
    );
  }
  return (
    <form
      action={async (fd) => {
        await addAdjustment(pageId, fd);
        setOpen(false);
      }}
      className="flex items-center gap-2"
    >
      <label className="sr-only" htmlFor={`adj-${pageId}`}>
        Nombre del ajuste
      </label>
      <input
        id={`adj-${pageId}`}
        name="title"
        required
        autoFocus
        placeholder="Ej. Mejorar LCP del hero"
        className={`${inputCls} w-56 py-1.5`}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      <SubmitButton variant="ghost">Crear</SubmitButton>
      <button type="button" aria-label="Cancelar" onClick={() => setOpen(false)} className={btn.quiet}>
        <X aria-hidden className="size-4" />
      </button>
    </form>
  );
}

// ── QA y feedback ────────────────────────────────────────────────────────────

const QA_CHOICES: { status: QaStatus; label: string; on: string }[] = [
  { status: "Pasa", label: "Pasa", on: "bg-signal-green text-ink ring-signal-green" },
  { status: "No pasa", label: "No pasa", on: "bg-signal-red text-ink ring-signal-red" },
  { status: "No aplica", label: "No aplica", on: "bg-stone-700 text-ink ring-stone-700" },
];

/** Un punto de QA: pasa, no pasa (abre tarea) o no aplica (con motivo). Clic de nuevo = pendiente. */
export function QaRow({
  pageId,
  workId,
  qaId,
  status,
  label,
  reason,
  taskOpen,
}: {
  pageId: string;
  workId: string;
  qaId: string;
  status: QaStatus;
  label: string;
  reason?: string;
  taskOpen: boolean;
}) {
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();
  const set = (next: QaStatus, why?: string) => start(() => setQa(pageId, workId, qaId, next, why));
  return (
    <div className={`py-2 ${pending ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <p className={`min-w-40 flex-1 text-sm ${status === "No aplica" ? "text-stone-500" : "text-stone-900"}`}>{label}</p>
        <div role="radiogroup" aria-label={label} className="flex gap-1">
          {QA_CHOICES.map((c) => {
            const checked = status === c.status;
            return (
              <button
                key={c.status}
                type="button"
                role="radio"
                aria-checked={checked}
                disabled={pending}
                onClick={() => {
                  if (checked) return set("Pendiente");
                  if (c.status === "No aplica") return setAsking(true);
                  set(c.status);
                }}
                className={`min-h-8 rounded-full px-3 text-xs font-semibold ring-1 ring-inset transition-colors ${
                  checked ? c.on : "text-stone-600 ring-stone-300 hover:text-stone-900 hover:ring-stone-500"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
      {status === "No aplica" && reason && <p className="mt-1 text-xs text-stone-600">Motivo: {reason}</p>}
      {status === "No pasa" && taskOpen && <p className="mt-1 text-xs font-medium text-signal-red">Tarea abierta en Tareas</p>}
      {asking && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const why = String(new FormData(e.currentTarget).get("reason") ?? "").trim();
            if (!why) return;
            setAsking(false);
            set("No aplica", why);
          }}
          className="mt-2 flex items-center gap-2"
        >
          <label className="sr-only" htmlFor={`qa-reason-${qaId}`}>
            Motivo para no aplica
          </label>
          <input
            id={`qa-reason-${qaId}`}
            name="reason"
            required
            autoFocus
            placeholder="¿Por qué no aplica?"
            className={`${inputCls} py-1.5`}
            onKeyDown={(e) => e.key === "Escape" && setAsking(false)}
          />
          <button type="submit" className={btn.ghost}>
            Guardar
          </button>
          <button type="button" aria-label="Cancelar" onClick={() => setAsking(false)} className={btn.quiet}>
            <X aria-hidden className="size-4" />
          </button>
        </form>
      )}
    </div>
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
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={btn.quiet}>
        <X aria-hidden className="size-4" /> Descartar
      </button>
    );
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const reason = String(new FormData(e.currentTarget).get("reason") ?? "");
        start(() => setFeedbackStatus(pageId, workId, reviewId, feedbackId, "Descartado", reason));
      }}
      className="flex w-full items-center gap-2 pt-1"
    >
      <label className="sr-only" htmlFor={`discard-${feedbackId}`}>
        Motivo para descartar
      </label>
      <input
        id={`discard-${feedbackId}`}
        name="reason"
        autoFocus
        placeholder="¿Por qué se descarta? (opcional)"
        className={`${inputCls} py-1.5`}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      />
      <button type="submit" disabled={pending} className={btn.ghost}>
        Descartar
      </button>
      <button type="button" aria-label="Cancelar" onClick={() => setOpen(false)} className={btn.quiet}>
        <X aria-hidden className="size-4" />
      </button>
    </form>
  );
}

// ── Configuración de la página ───────────────────────────────────────────────

/** Abre la sección de configuración y enfoca el campo indicado. */
export function AddLinkButton({ field, children }: { field: string; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={() => {
        const details = document.getElementById("config") as HTMLDetailsElement | null;
        if (details) details.open = true;
        const input = document.getElementById(`cfg-${field}`) as HTMLInputElement | null;
        input?.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => input?.focus(), 250);
      }}
      className="inline-flex min-h-10 items-center gap-1 rounded-[0.875rem] border border-dashed border-ink/40 px-3.5 text-sm font-semibold text-ink-2 transition-colors hover:border-ink hover:text-ink"
    >
      <Plus aria-hidden className="size-3.5" />
      {children}
    </button>
  );
}

export function PageConfigForm({ pageId, children }: { pageId: string; children: ReactNode }) {
  const [message, action] = useActionState(async (_: string, fd: FormData) => {
    await updatePage(pageId, fd);
    return `Guardado a las ${new Date().toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
  }, "");
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {children}
      <div className="flex items-center gap-3 sm:col-span-2">
        <SubmitButton>Guardar configuración</SubmitButton>
        <span aria-live="polite" className="text-sm text-signal-green">
          {message}
        </span>
      </div>
    </form>
  );
}
