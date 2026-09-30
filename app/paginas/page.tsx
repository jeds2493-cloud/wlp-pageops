import Link from "next/link";
import { connection } from "next/server";
import { Badge, Empty, PageHeader, StagePill } from "@/components/ui";
import {
  countByType,
  daysSince,
  formatDate,
  getPages,
  mainWork,
  openAdjustments,
  pendingFeedback,
  stageSince,
} from "@/lib/data";
import { PAGE_TYPES, STAGES, type PageType, type Stage } from "@/lib/types";

function href(tipo?: string, etapa?: string) {
  const q = new URLSearchParams();
  if (tipo) q.set("tipo", tipo);
  if (etapa) q.set("etapa", etapa);
  const s = q.toString();
  return s ? `/paginas?${s}` : "/paginas";
}

export default async function PaginasPage({ searchParams }: PageProps<"/paginas">) {
  await connection();
  const now = new Date();
  const sp = await searchParams;
  const tipo = PAGE_TYPES.find((t) => t === sp.tipo) as PageType | undefined;
  const etapa = STAGES.find((s) => s === sp.etapa) as Stage | undefined;

  const all = await getPages();
  const counts = countByType(all);
  const ofType = tipo ? all.filter((p) => p.type === tipo) : all;
  const pages = etapa ? ofType.filter((p) => mainWork(p).stage === etapa) : ofType;
  const stagesPresent = STAGES.filter((s) => ofType.some((p) => mainWork(p).stage === s));

  return (
    <>
      <PageHeader title="Páginas" subtitle={`${all.length} páginas dadas de alta`} />

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-stone-200">
        {[undefined, ...PAGE_TYPES].map((t) => {
          const active = t === tipo;
          return (
            <Link
              key={t ?? "todas"}
              href={href(t)}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${
                active ? "border-stone-900 font-medium text-stone-900" : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {t ?? "Todas"}{" "}
              <span className="text-stone-400">{t ? counts[t] ?? 0 : all.length}</span>
            </Link>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Link
          href={href(tipo)}
          className={`rounded-full px-2.5 py-1 text-xs ${!etapa ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"}`}
        >
          Todas las etapas
        </Link>
        {stagesPresent.map((s) => (
          <Link
            key={s}
            href={href(tipo, s)}
            className={`rounded-full px-2.5 py-1 text-xs ${etapa === s ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100"}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs font-medium text-stone-500">
              <th className="px-4 py-2.5 font-medium">Página</th>
              <th className="px-3 py-2.5 font-medium">Etapa</th>
              <th className="px-3 py-2.5 font-medium">En esta etapa</th>
              <th className="px-3 py-2.5 font-medium">Entregada</th>
              <th className="px-3 py-2.5 text-right font-medium">SP</th>
              <th className="px-4 py-2.5 font-medium">Pendientes</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => {
              const w = mainWork(p);
              const since = stageSince(w);
              const days = since ? daysSince(since, now) : undefined;
              const fb = pendingFeedback(w);
              const adj = openAdjustments(p).length;
              return (
                <tr key={p.id} className="border-b border-stone-100 last:border-0 hover:bg-stone-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/paginas/${p.id}`} className="font-medium text-stone-900 hover:underline">
                      {p.title}
                    </Link>
                    <div className="text-xs text-stone-400">
                      {p.type}
                      {p.channel && ` · ${p.channel}`}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <StagePill stage={w.stage} />
                  </td>
                  <td className="px-3 py-2.5 text-stone-600">
                    {days === undefined ? (
                      <span className="text-stone-300">—</span>
                    ) : (
                      <span className={w.stage === "Revisión Admin" && days > 2 ? "font-medium text-amber-700" : ""}>
                        {days === 0 ? "hoy" : `${days} d`}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-stone-600">{formatDate(w.deliveredAt ?? w.dueDate)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-stone-600">{w.storyPoints ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {fb > 0 && <Badge tone="warn">{fb} feedback</Badge>}
                      {adj > 0 && <Badge tone="info">{adj} ajuste</Badge>}
                      {p.importWarnings.length > 0 && <Badge tone="warn">revisar enlace</Badge>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pages.length === 0 && <Empty>No hay páginas con este filtro.</Empty>}
      </div>
    </>
  );
}
