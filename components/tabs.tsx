"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

export interface TabDef {
  id: string;
  label: string;
  count?: number;
  /** Resalta el contador (p. ej. feedback pendiente). */
  alert?: boolean;
  content: ReactNode;
}

export function Tabs({ tabs, initial }: { tabs: TabDef[]; initial?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  const onKey = (e: KeyboardEvent, i: number) => {
    const delta = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const to = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : delta ? (i + delta + tabs.length) % tabs.length : -1;
    if (to < 0) return;
    e.preventDefault();
    setActive(tabs[to].id);
    refs.current[to]?.focus();
  };

  return (
    <section className="tile-folder">
      <div className="flex items-end">
        <div className="tile-tab px-3 pt-3">
          <div role="tablist" aria-label="Secciones del trabajo" className="seg w-fit max-w-full overflow-x-auto overflow-y-hidden">
            {tabs.map((t, i) => {
              const selected = t.id === current.id;
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  id={`${base}-tab-${t.id}`}
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`${base}-panel-${t.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(t.id)}
                  onKeyDown={(e) => onKey(e, i)}
                  className={`inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold transition-colors ${
                    selected ? "bg-stone-800 text-ink" : "text-stone-500 hover:bg-white/[.06] hover:text-stone-900"
                  }`}
                >
                  {t.label}
                  {t.count !== undefined && (
                    <span
                      className={`num rounded-full px-1.5 py-0.5 text-sm ${
                        t.alert ? "bg-signal-red text-ink" : selected ? "bg-ink/10" : "bg-stone-200 text-stone-700"
                      }`}
                    >
                      {t.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-1" />
      </div>
      <div
        role="tabpanel"
        id={`${base}-panel-${current.id}`}
        aria-labelledby={`${base}-tab-${current.id}`}
        className="tile-body p-4 md:p-6"
      >
        {current.content}
      </div>
    </section>
  );
}
