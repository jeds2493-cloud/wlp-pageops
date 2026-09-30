import Link from "next/link";
import { Badge, PageHeader, StagePill } from "@/components/ui";
import { getPages, pendingFeedback } from "@/lib/data";
import type { Stage } from "@/lib/types";

const COLUMNS: Stage[] = ["Por hacer", "En curso", "QA", "Revisión Admin", "Cambios solicitados", "Publicado"];

export default async function Tablero() {
  const pages = await getPages();
  const cards = pages.flatMap((p) => p.works.map((w) => ({ p, w })));

  return (
    <>
      <PageHeader
        title="Tablero"
        subtitle="Cada tarjeta es un trabajo (la página V2 o un ajuste). Arrastrar para cambiar de etapa llega en Fase 1."
      />
      <div className="-mx-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
        <div className="flex gap-3">
          {COLUMNS.map((col) => {
            const items = cards.filter(({ w }) => w.stage === col);
            return (
              <section key={col} className="w-64 shrink-0 rounded-lg bg-stone-100/70 p-2">
                <header className="mb-2 flex items-center justify-between px-1">
                  <StagePill stage={col} />
                  <span className="text-xs text-stone-500">{items.length}</span>
                </header>
                <ul className="space-y-2">
                  {items.map(({ p, w }) => {
                    const fb = pendingFeedback(w);
                    return (
                      <li key={w.id}>
                        <Link
                          href={`/paginas/${p.id}`}
                          className="block rounded-md border border-stone-200 bg-white p-2.5 text-sm shadow-xs hover:border-stone-300"
                        >
                          <div className="font-medium leading-snug">{w.kind === "Ajuste" ? w.title : p.title}</div>
                          {w.kind === "Ajuste" && <div className="mt-0.5 text-xs text-stone-400">{p.title}</div>}
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            <Badge>{w.kind}</Badge>
                            {w.storyPoints !== undefined && <Badge>{w.storyPoints} SP</Badge>}
                            {fb > 0 && <Badge tone="warn">{fb} feedback</Badge>}
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
