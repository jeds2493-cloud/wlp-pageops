"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Columns3, ListChecks, Rows3, Ticket } from "lucide-react";

const items = [
  { href: "/", label: "Páginas", icon: Rows3, match: (p: string) => p === "/" || p.startsWith("/paginas") },
  { href: "/tablero", label: "Tablero", icon: Columns3, match: (p: string) => p.startsWith("/tablero") },
  { href: "/revisiones", label: "Revisiones", icon: ListChecks, match: (p: string) => p.startsWith("/revisiones") },
  { href: "/tickets", label: "Tickets", icon: Ticket, match: (p: string) => p.startsWith("/tickets") },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="seg w-fit max-w-full overflow-x-auto overflow-y-hidden">
      {items.map((it) => {
        const active = it.match(pathname);
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-signal-yellow text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.5),0_6px_16px_-8px_rgb(242_194_48/0.9)]"
                : "text-stone-500 hover:bg-white/[.06] hover:text-stone-900"
            }`}
          >
            <Icon aria-hidden className="size-4" />
            <span className={active ? "" : "sr-only sm:not-sr-only"}>{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
