"use client";

import { useState, type ReactNode } from "react";

export function Tabs({ tabs }: { tabs: { id: string; label: string; count?: number; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div>
      <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto border-b border-stone-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={t.id === current.id}
            onClick={() => setActive(t.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
              t.id === current.id
                ? "border-stone-900 font-medium text-stone-900"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            {t.label}
            {t.count !== undefined && <span className="ml-1 text-stone-400">{t.count}</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel">{current.content}</div>
    </div>
  );
}
