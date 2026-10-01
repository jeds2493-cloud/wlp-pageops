import Link from "next/link";
import { connection } from "next/server";
import { AlertTriangle, Plus, Search, X } from "lucide-react";
import { Badge, Masthead, PageBody, StagePill, stageDot } from "@/components/ui";
import {
  attention,
  daysSince,
  formatDate,
  getPages,
  mainWork,
  openAdjustments,
  pendingFeedback,
  stageSince,
} from "@/lib/data";
import { PAGE_TYPES, STAGES, type Page, type PageType, type Stage } from "@/lib/types";

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function href(params: { tipo?: string; etapa?: string; q?: string }) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `/?${s}` : "/";
}

/** Barra de flujo: cuántas páginas hay en cada etapa. Cada tramo filtra la tabla. */
function Pipeline({ pages, tipo, etapa, q }: { pages: Page[]; tipo?: string; etapa?: Stage; q?: string }) {
  const counts = STAGES.map((s) => ({ s, n: pages.filter((p) => mainWork(p).stage === s).length })).filter((c) => c.n);
  const total = pages.length || 1;
  return (
    <div className="mt-7">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-wlp-dark-2" aria-hidden>
        {counts.map(({ s, n }) => (
          <div key={s} className={`${stageDot[s]} ${etapa && etapa !== s ? "opacity-30" : ""} transition-opacity`} style={{ width: `${(n / total) * 100}%` }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-1 gap-y-1" aria-label="Filtrar por etapa">
        {counts.map(({ s, n }) => {
          const active = etapa === s;
          return (
            <li key={s}>
              <Link
                href={href({ tipo, q, etapa: active ? undefined : s })}
                aria-pressed={active}
                className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-sm transition-colors ${
                  active ? "bg-white text-stone-900" : "text-stone-300 hover:bg-wlp-dark-2 hover:text-white"
                }`}
              >
                <span aria-hidden className={`size-2 rounded-full ${stageDot[s]}`} />
                {s}
                <span className={`font-mono text-sm font-semibold ${active ? "text-stone-900" : "text-white"}`}>{n}</span>
              </Link>
            </li>
          );
        })}
        {etapa && (
          <li>
            <Link href={href({ tipo, q })} className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-sm text-wlp-yellow hover:bg-wlp-dark-2">
              <X aria-hidden className="size-4" /> Quitar filtro
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

export default async function PaginasHome({ searchParams }: PageProps<"/">) {
  await connection();
  const now = new Date();
  const sp = await searchParams;
  const tipo = PAGE_TYPES.find((t) => t === sp.tipo) as PageType | undefined;
  const etapa = STAGES.find((s) => s === sp.etapa) as Stage | undefined;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";

  const all = await getPages();
  const ofType = tipo ? all.filter((p) => p.type === tipo) : all;
  const searched = q ? ofType.filter((p) => fold(p.title).includes(fold(q))) : ofType;
  const pages = etapa ? searched.filter((p) => mainWork(p).stage === etapa) : searched;
  const urgent = attention(all, now).filter((a) => a.tone === "warn");
  const totalSp = pages.reduce((n, p) => n + (mainWork(p).storyPoints ?? 0), 0);

  return (
    <>
      <Masthead
        title="Páginas"
        meta={
          <span>
            <span className="font-mono text-white">{all.length}</span> páginas en control · welovepaving.com
          </span>
        }
        actions={
          <>
            <form action="/" role="search" className="relative">
              {tipo && <input type="hidden" name="tipo" value={tipo} />}
              {etapa && <input type="hidden" name="etapa" value={etapa} />}
              <label htmlFor="search" className="sr-only">
                Buscar página
              </label>
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
              <input
                id="search"
                name="q"
                defaultValue={q}
                placeholder="Buscar página"
                autoComplete="off"
                className="min-h-10 w-56 rounded-lg border border-stone-600 bg-wlp-dark-2 pr-9 pl-9 text-sm text-white placeholder:text-stone-400 hover:border-stone-500"
              />
              <kbd className="absolute top-1/2 right-2.5 -translate-y-1/2 text-stone-400">/</kbd>
            </form>
            <Link
              href={tipo ? `/paginas/nueva?tipo=${encodeURIComponent(tipo)}` : "/paginas/nueva"}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-wlp-yellow px-4 text-sm font-semibold text-stone-900 transition-colors hover:bg-wlp-yellow-hover"
            >
              <Plus aria-hidden className="size-4" /> Nueva página <kbd className="text-stone-900">N</kbd>
            </Link>
          </>
        }
      >
        <Pipeline pages={ofType} tipo={tipo} etapa={etapa} q={q} />
      </Masthead>

      <PageBody>
        {urgent.length > 0 && (
          <section aria-label="Necesita atención" className="mb-6 rounded-wlp border border-[#F2C230]/70 bg-[#FDF3CF] px-5 py-3">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#6B4E00]">
              <AlertTriangle aria-hidden className="size-4" /> Necesita atención · <span className="font-mono">{urgent.length}</span>
            </h2>
            <ul className="flex flex-wrap gap-x-5 gap-y-1">
              {urgent.map((a, i) => (
                <li key={i} className="text-sm text-stone-800">
                  <Link href={`/paginas/${a.page.id}`} className="font-semibold underline-offset-2 hover:underline">
                    {a.page.title}
                  </Link>{" "}
                  <span className="text-stone-600">{a.reason}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-stone-200">
          <nav aria-label="Tipo de página" className="-mb-px flex gap-1 overflow-x-auto">
            {[undefined, ...PAGE_TYPES].map((t) => {
              const active = t === tipo;
              const n = t ? all.filter((p) => p.type === t).length : all.length;
              return (
                <Link
                  key={t ?? "todas"}
                  href={href({ tipo: t, etapa, q })}
                  aria-current={active ? "page" : undefined}
                  className={`relative inline-flex min-h-11 items-center gap-2 whitespace-nowrap px-3 text-sm transition-colors ${
                    active ? "font-semibold text-stone-900" : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  {t ?? "Todas"}
                  <span className="font-mono text-xs text-stone-500">{n}</span>
                  {active && <span aria-hidden className="absolute inset-x-2 bottom-0 h-[3px] rounded-full bg-wlp-yellow" />}
                </Link>
              );
            })}
          </nav>
          <p className="pb-2 text-sm text-stone-600">
            <span className="font-mono font-semibold text-stone-900">{pages.length}</span> páginas ·{" "}
            <span className="font-mono font-semibold text-stone-900">{totalSp}</span> SP
          </p>
        </div>

        <ul className="divide-y divide-stone-100 rounded-wlp border border-stone-200 bg-white md:hidden">
          {pages.map((p) => {
            const w = mainWork(p);
            const fb = pendingFeedback(w);
            return (
              <li key={p.id}>
                <Link href={`/paginas/${p.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-stone-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-stone-900">{p.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
                      {p.type}
                      {w.storyPoints !== undefined && <span className="font-mono">{w.storyPoints} SP</span>}
                      {w.dueDate && <span className="font-mono">entrega {formatDate(w.dueDate)}</span>}
                      {fb > 0 && <span className="font-semibold text-[#6B4E00]">{fb} feedback</span>}
                    </p>
                  </div>
                  <StagePill stage={w.stage} />
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden overflow-x-auto rounded-wlp border border-stone-200 bg-white md:block">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-xs text-stone-600">
                <th scope="col" className="px-5 py-3 font-medium">Página</th>
                <th scope="col" className="px-3 py-3 font-medium">Etapa</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">En etapa</th>
                <th scope="col" className="px-3 py-3 font-medium">Entrega</th>
                <th scope="col" className="px-3 py-3 text-right font-medium">SP</th>
                <th scope="col" className="px-5 py-3 font-medium">Pendientes</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => {
                const w = mainWork(p);
                const since = stageSince(w);
                const days = since ? daysSince(since, now) : undefined;
                const fb = pendingFeedback(w);
                const adj = openAdjustments(p).length;
                const overdue = w.dueDate && w.stage !== "Publicado" && daysSince(w.dueDate, now) > 0;
                return (
                  <tr key={p.id} className="group relative border-b border-stone-100 last:border-0 hover:bg-stone-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/paginas/${p.id}`}
                        className="font-semibold text-stone-900 after:absolute after:inset-0 after:content-[''] group-hover:underline"
                      >
                        {p.title}
                      </Link>
                      <div className="text-xs text-stone-500">
                        {p.type}
                        {p.channel && ` · ${p.channel}`}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StagePill stage={w.stage} />
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-stone-700">
                      {days === undefined ? "—" : (
                        <span className={(w.stage === "Revisión Admin" || w.stage === "Cambios solicitados") && days > 2 ? "font-semibold text-[#A32424]" : ""}>
                          {days}d
                        </span>
                      )}
                    </td>
                    <td className={`px-3 py-3 font-mono ${overdue ? "font-semibold text-[#A32424]" : "text-stone-700"}`}>{formatDate(w.dueDate)}</td>
                    <td className="px-3 py-3 text-right font-mono text-stone-700">{w.storyPoints ?? "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {w.blocked && <Badge tone="warn">Bloqueada</Badge>}
                        {fb > 0 && <Badge tone="warn">{fb} feedback</Badge>}
                        {adj > 0 && <Badge tone="info">{adj} ajuste</Badge>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pages.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-stone-600">Ninguna página coincide{q ? ` con «${q}»` : ""}.</p>
              <Link href="/" className="mt-2 inline-block text-sm font-semibold text-stone-900 underline">
                Ver todas
              </Link>
            </div>
          )}
        </div>
      </PageBody>
    </>
  );
}
