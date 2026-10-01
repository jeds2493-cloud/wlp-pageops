"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw } from "lucide-react";

/** Si algo falla en el servidor, se muestra el motivo en vez de una página caída. */
export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="mx-auto max-w-xl px-4 py-16 md:px-10">
      <div className="rounded-wlp border border-red-200 bg-white p-6">
        <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold text-stone-900 uppercase">
          <AlertTriangle aria-hidden className="size-6 text-wlp-red" /> Algo falló
        </h1>
        <p className="mt-3 text-sm text-stone-700">
          No se pudo cargar esta pantalla. Vuelve a intentar. Si sigue fallando, el motivo real está en Netlify:
          <strong> Logs → Functions</strong>, en el error más reciente con este código (Next oculta el mensaje aquí por seguridad).
        </p>
        <p className="mt-3 rounded-lg bg-stone-100 px-3 py-2 font-mono text-xs text-stone-700">
          {error.digest ? `Código: ${error.digest}` : error.message}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending}
            // Vuelve a pedir la pantalla al servidor, no solo a dibujarla.
            onClick={() =>
              start(() => {
                router.refresh();
                reset();
              })
            }
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-wlp-yellow px-4 text-sm font-semibold text-stone-900 hover:bg-wlp-yellow-hover disabled:opacity-50"
          >
            <RotateCcw aria-hidden className="size-4" /> {pending ? "Reintentando…" : "Reintentar"}
          </button>
          <Link href="/" className="text-sm font-semibold text-stone-700 underline">
            Ir a Páginas
          </Link>
        </div>
      </div>
    </div>
  );
}
