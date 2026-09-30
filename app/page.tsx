import Link from "next/link";
import { connection } from "next/server";
import { Badge, Card, Empty, PageHeader, StagePill } from "@/components/ui";
import { attention, countByStage, getPages, mainWork } from "@/lib/data";
import type { Stage } from "@/lib/types";

const SUMMARY: Stage[] = ["En curso", "Revisión Admin", "Cambios solicitados", "Publicado"];

export default async function Inicio() {
  await connection();
  const now = new Date();
  const pages = await getPages();
  const byStage = countByStage(pages);
  const items = attention(pages, now);
  const inProgress = pages.filter((p) => mainWork(p).stage === "En curso");

  return (
    <>
      <PageHeader
        title="Inicio"
        subtitle={now.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SUMMARY.map((s) => (
          <Link
            key={s}
            href={`/paginas?etapa=${encodeURIComponent(s)}`}
            className="rounded-lg border border-stone-200 bg-white p-4 hover:border-stone-300"
          >
            <div className="text-2xl font-semibold tabular-nums">{byStage[s] ?? 0}</div>
            <div className="mt-1">
              <StagePill stage={s} />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card title={`Atención · ${items.length}`}>
          {items.length ? (
            <ul className="-my-1 divide-y divide-stone-100">
              {items.map((it, i) => (
                <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                  <Badge tone={it.tone}>{it.tone === "warn" ? "Atender" : "Pendiente"}</Badge>
                  <Link href={`/paginas/${it.page.id}`} className="font-medium hover:underline">
                    {it.page.title}
                  </Link>
                  <span className="text-stone-500">{it.reason}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Nada requiere atención.</Empty>
          )}
        </Card>

        <Card title={`En curso · ${inProgress.length}`}>
          <ul className="space-y-2 text-sm">
            {inProgress.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2">
                <Link href={`/paginas/${p.id}`} className="hover:underline">
                  {p.title}
                </Link>
                <span className="text-xs text-stone-400">{mainWork(p).storyPoints} SP</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
