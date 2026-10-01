"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Atajos globales: "/" busca, "n" crea una página nueva. */
export function Shortcuts() {
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.metaKey || e.ctrlKey || e.altKey || t?.closest("input, textarea, select, [contenteditable=true]")) return;
      if (e.key === "/") {
        const search = document.getElementById("search") as HTMLInputElement | null;
        if (search) {
          e.preventDefault();
          search.focus();
          search.select();
        }
      } else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        router.push("/paginas/nueva");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);
  return null;
}
