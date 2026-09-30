"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/", label: "Inicio" },
  { href: "/paginas", label: "Páginas" },
  { href: "/tablero", label: "Tablero" },
  { href: "/revisiones", label: "Revisiones" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col">
      {items.map((it) => {
        const active = it.href === "/" ? pathname === "/" : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={`relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-wlp-dark-2 text-white md:before:absolute md:before:inset-y-2 md:before:left-0 md:before:w-[3px] md:before:rounded-full md:before:bg-wlp-yellow"
                : "text-stone-400 hover:bg-wlp-dark-2 hover:text-white"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
