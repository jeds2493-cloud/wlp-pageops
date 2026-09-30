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
            className={`whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm ${
              active ? "bg-stone-200/70 font-medium text-stone-900" : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
