"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { setStage } from "@/app/actions";
import { Badge, StagePill } from "@/components/ui";
import type { Stage, WorkKind } from "@/lib/types";

export interface BoardCard {
  workId: string;
  pageId: string;
  title: string;
  subtitle?: string;
  kind: WorkKind;
  stage: Stage;
  storyPoints?: number;
  feedback: number;
  blocked: boolean;
  warnings: Partial<Record<Stage, string[]>>;
}

export function Board({ columns, cards }: { columns: Stage[]; cards: BoardCard[] }) {
  const [optimistic, move] = useOptimistic(cards, (state, m: { workId: string; stage: Stage }) =>
    state.map((c) => (c.workId === m.workId ? { ...c, stage: m.stage } : c)),
  );
  const [, start] = useTransition();
  const [over, setOver] = useState<Stage | null>(null);

  function drop(card: BoardCard, target: Stage) {
    if (card.stage === target) return;
    const w = card.warnings[target] ?? [];
    if (w.length && !window.confirm(`Antes de mover a "${target}":\n\n• ${w.join("\n• ")}\n\n¿Continuar de todas formas?`)) return;
    start(async () => {
      move({ workId: card.workId, stage: target });
      await setStage(card.pageId, card.workId, target);
    });
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
      <div className="flex gap-3">
        {columns.map((col) => {
          const items = optimistic.filter((c) => c.stage === col);
          return (
            <section
              key={col}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(col);
              }}
              onDragLeave={() => setOver((o) => (o === col ? null : o))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const card = optimistic.find((c) => c.workId === e.dataTransfer.getData("text/plain"));
                if (card) drop(card, col);
              }}
              className={`w-64 shrink-0 rounded-wlp p-2.5 transition ${
                over === col ? "bg-[#FDF3CF] ring-2 ring-wlp-yellow" : "bg-stone-100"
              }`}
            >
              <header className="mb-2 flex items-center justify-between px-1">
                <StagePill stage={col} />
                <span className="text-xs font-semibold text-stone-600">{items.length}</span>
              </header>
              <ul className="min-h-16 space-y-2">
                {items.map((c) => (
                  <li key={c.workId}>
                    <Link
                      href={`/paginas/${c.pageId}?w=${c.workId}`}
                      draggable
                      aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
                      aria-label={`${c.title}${c.subtitle ? ` (${c.subtitle})` : ""}, ${c.stage}. Alt más flechas para mover de etapa.`}
                      onKeyDown={(e) => {
                        if (!e.altKey || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
                        e.preventDefault();
                        const i = columns.indexOf(c.stage) + (e.key === "ArrowRight" ? 1 : -1);
                        if (i >= 0 && i < columns.length) drop(c, columns[i]);
                      }}
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", c.workId);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      className="block cursor-grab rounded-[10px] border border-stone-200 bg-white p-3 text-sm transition hover:border-stone-900 active:cursor-grabbing"
                    >
                      <div className="leading-snug font-semibold">{c.title}</div>
                      {c.subtitle && <div className="mt-0.5 text-xs text-stone-500">{c.subtitle}</div>}
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <Badge>{c.kind}</Badge>
                        {c.storyPoints !== undefined && <Badge>{c.storyPoints} SP</Badge>}
                        {c.feedback > 0 && <Badge tone="warn">{c.feedback} feedback</Badge>}
                        {c.blocked && <Badge tone="warn">Bloqueado</Badge>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
