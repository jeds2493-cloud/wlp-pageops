"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

/** Si algo falla en el servidor, se muestra el motivo en vez de una página caída. */
export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
          No se pudo cargar esta pantalla. Vuelve a intentar; si sigue fallando, comparte este código con soporte.
        </p>
        <p className="mt-3 rounded-lg bg-stone-100 px-3 py-2 font-mono text-xs text-stone-700">
          {error.digest ? `Código: ${error.digest}` : error.message}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-lg bg-wlp-yellow px-4 text-sm font-semibold text-stone-900 hover:bg-wlp-yellow-hover"
        >
          <RotateCcw aria-hidden className="size-4" /> Reintentar
        </button>
      </div>
    </div>
  );
}
