"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type PointerEvent } from "react";
import { Scissors } from "lucide-react";
import { closeTicket } from "@/app/actions";
import { formatDateTime } from "@/lib/logic";
import type { Ticket } from "@/lib/types";
import { Badge } from "./ui";

type Phase = "idle" | "dragging" | "tearing" | "gone";

const TEAR_AT = 90; // px que hay que jalar el talón para cortarlo
const MAX_PULL = 150;

function reducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Ticket como boleto: el talón (derecha) se jala para cortarlo por la perforación.
 * Al pasar el umbral se desprende, el ticket se cierra y pasa al historial.
 * También se corta con clic o con Enter/Espacio en el talón.
 */
export function TearTicket({ ticket, pageTitle }: { ticket: Ticket; pageTitle?: string }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [pull, setPull] = useState({ x: 0, y: 0 });
  const [, start] = useTransition();
  const origin = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  const tear = () => {
    if (phase === "tearing" || phase === "gone") return;
    const finish = () => start(() => closeTicket(ticket.id));
    if (reducedMotion()) {
      setPhase("gone");
      finish();
      return;
    }
    setPhase("tearing");
    // El talón cae; luego el resto del boleto se desvanece y el ticket se cierra.
    setTimeout(() => setPhase("gone"), 520);
    setTimeout(finish, 820);
  };

  const onDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (phase !== "idle") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    origin.current = { x: e.clientX, y: e.clientY };
    moved.current = false;
    setPhase("dragging");
  };
  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (phase !== "dragging" || !origin.current) return;
    const x = Math.max(0, Math.min(MAX_PULL, e.clientX - origin.current.x));
    const y = Math.max(-40, Math.min(40, e.clientY - origin.current.y));
    if (x > 4) moved.current = true;
    setPull({ x, y });
  };
  const onUp = () => {
    if (phase !== "dragging") return;
    origin.current = null;
    if (pull.x >= TEAR_AT) return tear();
    setPhase("idle");
    setPull({ x: 0, y: 0 });
  };

  const progress = Math.min(1, pull.x / TEAR_AT);
  const stubStyle =
    phase === "tearing" || phase === "gone"
      ? {
          transform: `translate(${pull.x + 140}px, ${pull.y + 260}px) rotate(38deg)`,
          opacity: 0,
          transition: "transform 560ms cubic-bezier(0.55, 0, 0.75, 0.2), opacity 460ms ease-in 100ms",
        }
      : {
          transform: `translate(${pull.x}px, ${pull.y * 0.35}px) rotate(${pull.x * 0.09}deg)`,
          transition: phase === "dragging" ? "none" : "transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        };
  const torn = phase === "tearing" || phase === "gone";

  return (
    <li
      // Al jalar y al caer, el talón pasa por encima de los tickets vecinos.
      className={`relative list-none transition-[opacity,transform] duration-300 ease-out ${phase === "idle" ? "" : "z-20"}`}
      style={phase === "gone" ? { opacity: 0, transform: "scale(0.96)" } : undefined}
    >
      <article aria-label={`Ticket #${ticket.number}: ${ticket.title}`} className="relative flex min-h-36">
        {/* Cuerpo del boleto */}
        <div className={`relative flex min-w-0 flex-1 flex-col rounded-l-wlp border border-r-0 border-stone-200 bg-white p-5 ${torn ? "torn-right" : ""}`}>
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-stone-500">#{String(ticket.number).padStart(3, "0")}</span>
            {ticket.priority !== "Normal" && <Badge tone={ticket.priority === "Urgente" || ticket.priority === "Alta" ? "warn" : "neutral"}>{ticket.priority}</Badge>}
          </div>
          <h3 className="text-base leading-snug font-semibold text-balance text-stone-900">{ticket.title}</h3>
          {ticket.detail && <p className="mt-1 line-clamp-3 text-sm text-stone-600">{ticket.detail}</p>}
          <p className="mt-auto pt-3 text-xs text-stone-500">
            {ticket.createdBy} · {formatDateTime(ticket.createdAt)}
            {ticket.pageId && pageTitle && (
              <>
                {" · "}
                <Link href={`/paginas/${ticket.pageId}`} className="font-medium text-stone-700 underline-offset-2 hover:underline">
                  {pageTitle}
                </Link>
              </>
            )}
          </p>
        </div>

        {/* Perforación con las muescas del boleto */}
        <div aria-hidden className="relative w-0">
          <span className="absolute -top-px -left-2.5 size-5 -translate-y-1/2 rounded-full border border-stone-200 bg-stone-50" />
          <span className="absolute -bottom-px -left-2.5 size-5 translate-y-1/2 rounded-full border border-stone-200 bg-stone-50" />
          <span
            className="absolute inset-y-3 left-0 border-l-2 border-dashed transition-colors"
            style={{ borderColor: progress > 0.6 ? "var(--color-wlp-red)" : "var(--color-stone-300)" }}
          />
        </div>

        {/* Talón: se jala para cortar */}
        <button
          type="button"
          aria-label={`Cortar el talón para cerrar el ticket #${ticket.number}`}
          title="Jala el talón hacia la derecha (o haz clic) para cerrar"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onClick={() => {
            // Un clic sin arrastre también corta (y Enter/Espacio desde el teclado).
            if (!moved.current && phase === "idle") tear();
            moved.current = false;
          }}
          style={stubStyle}
          className={`group relative flex w-24 shrink-0 cursor-grab touch-none flex-col items-center justify-center gap-2 rounded-r-wlp bg-wlp-dark px-2 text-wlp-yellow select-none origin-left active:cursor-grabbing ${torn ? "torn-left" : ""}`}
        >
          <span className="font-mono text-lg font-semibold">#{String(ticket.number).padStart(3, "0")}</span>
          <span className="flex items-center gap-1 text-xs font-semibold text-stone-300 group-hover:text-white">
            <Scissors aria-hidden className="size-3.5" /> Cortar
          </span>
          <span aria-hidden className="absolute inset-x-3 bottom-3 h-1 overflow-hidden rounded-full bg-wlp-dark-2">
            <span className="block h-full bg-wlp-yellow" style={{ width: `${progress * 100}%` }} />
          </span>
        </button>
      </article>
    </li>
  );
}
