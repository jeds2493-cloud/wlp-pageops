"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Columns3, ListChecks, Rows3 } from "lucide-react";

const items = [
  { href: "/", label: "Páginas", icon: Rows3, match: (p: string) => p === "/" || p.startsWith("/paginas") },
  { href: "/tablero", label: "Tablero", icon: Columns3, match: (p: string) => p.startsWith("/tablero") },
  { href: "/revisiones", label: "Revisiones", icon: ListChecks, match: (p: string) => p.startsWith("/revisiones") },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((it) => {
        const active = it.match(pathname);
        const Icon = it.icon;
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`relative inline-flex min-h-10 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors ${
              active
                ? "bg-wlp-dark-2 text-white md:before:absolute md:before:inset-y-2 md:before:left-0 md:before:w-[3px] md:before:rounded-full md:before:bg-wlp-yellow"
                : "text-stone-400 hover:bg-wlp-dark-2 hover:text-white"
            }`}
          >
            <Icon aria-hidden className={`size-4 ${active ? "text-wlp-yellow" : ""}`} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
