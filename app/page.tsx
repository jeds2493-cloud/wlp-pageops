import Link from "next/link";
import { requirePage } from "@/lib/auth";
import { connection } from "next/server";
import { ArrowUpRight, Plus, Search, X } from "lucide-react";
import { Badge, Card, Masthead, Num, PageBody, Panel, QaCell, StagePill } from "@/components/ui";
import {
  attention,
  daysSince,
  formatDate,
  getPages,
  mainWork,
  openAdjustments,
  pendingFeedback,
  qaProgress,
  qaState,
  wcagState,
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

const FLOW: { s: Stage; short: string }[] = [
  { s: "Por hacer", short: "Por hacer" },
  { s: "En curso", short: "En curso" },
  { s: "QA", short: "QA" },
  { s: "Revisión Admin", short: "Revisión" },
  { s: "Cambios solicitados", short: "Cambios" },
  { s: "Publicado", short: "Publicado" },
];

/** Flujo: cuántas páginas hay en cada etapa, como pista punteada. Cada tramo filtra la tabla. */
function Flow({ pages, tipo, etapa, q }: { pages: Page[]; tipo?: string; etapa?: Stage; q?: string }) {
  const counts = FLOW.map((f) => ({ ...f, n: pages.filter((p) => mainWork(p).stage === f.s).length }));
  const max = Math.max(1, ...counts.map((c) => c.n));
  return (
    <Card
      title="Flujo"
      className="xl:col-span-2"
      action={
        etapa ? (
          <Link href={href({ tipo, q })} className="btn-soft min-h-9 rounded-full px-3">
            <X aria-hidden className="size-4" /> Quitar filtro
          </Link>
        ) : (
          <span className="font-medium">{tipo ?? "Todas las páginas"}</span>
        )
      }
    >
      <Panel signal="var(--color-signal-yellow)" tab={`${pages.length} páginas`} className="px-3 py-3 sm:px-4">
        <ul aria-label="Filtrar por etapa" className="grid grid-cols-3 gap-1 sm:grid-cols-6">
          {counts.map(({ s, short, n }) => {
            const active = etapa === s;
            const dim = etapa && !active;
            return (
              <li key={s}>
                <Link
                  href={href({ tipo, q, etapa: active ? undefined : s })}
                  aria-pressed={active}
                  aria-label={`${s}: ${n}`}
                  className={`flex flex-col gap-1.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-black/[.07] ${active ? "bg-black/[.09]" : ""} ${
                    dim ? "opacity-45" : ""
                  }`}
                >
                  <Num value={n} className="text-[2.6rem]" />
                  <span className="relative flex h-2 items-center">
                    <span aria-hidden className="track absolute inset-x-0 top-1/2 -translate-y-1/2" />
                    {n > 0 && <span aria-hidden className="relative h-[5px] rounded-full bg-ink" style={{ width: `${Math.max(14, (n / max) * 100)}%` }} />}
                  </span>
                  <span className="truncate text-[11px] font-bold tracking-[0.08em] uppercase">{short}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>
    </Card>
  );
}

export default async function PaginasHome({ searchParams }: PageProps<"/">) {
  await requirePage("/");
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
  const withAdmin = all
    .map((p) => ({ p, w: mainWork(p) }))
    .filter(({ w }) => w.stage === "Revisión Admin")
    .map(({ p, w }) => ({ p, days: stageSince(w) ? daysSince(stageSince(w)!, now) : 0 }))
    .sort((a, b) => b.days - a.days);
  const changes = all.filter((p) => mainWork(p).stage === "Cambios solicitados").length;

  return (
    <>
      <Masthead
        title="Páginas"
        meta={
          <>
            <span className="font-semibold text-ink">{all.length}</span> páginas en control · welovepaving.com
          </>
        }
        actions={
          <>
            <form action="/" role="search" className="relative">
              {tipo && <input type="hidden" name="tipo" value={tipo} />}
              {etapa && <input type="hidden" name="etapa" value={etapa} />}
              <label htmlFor="search" className="sr-only">
                Buscar página
              </label>
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-500" />
              <input
                id="search"
                name="q"
                defaultValue={q}
                placeholder="Buscar página"
                autoComplete="off"
                className="tile min-h-10 w-60 rounded-[0.875rem] pr-9 pl-10 text-sm placeholder:text-stone-500"
              />
              <kbd className="absolute top-1/2 right-2.5 -translate-y-1/2 text-stone-500">/</kbd>
            </form>
            <Link href={tipo ? `/paginas/nueva?tipo=${encodeURIComponent(tipo)}` : "/paginas/nueva"} className="btn-signal">
              <Plus aria-hidden className="size-4" /> Nueva página <kbd>N</kbd>
            </Link>
          </>
        }
      />

      <PageBody>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <Flow pages={ofType} tipo={tipo} etapa={etapa} q={q} />

          <Card
            title="Atención"
            action={urgent.length > 0 && <span className="num rounded-full bg-signal-red px-2.5 py-0.5 text-lg text-ink">{urgent.length}</span>}
          >
            {urgent.length ? (
              <ul className="space-y-2.5">
                {urgent.slice(0, 4).map((a, i) => (
                  <li key={i} className="text-sm leading-snug">
                    <Link href={`/paginas/${a.page.id}`} className="font-semibold text-stone-900 hover:underline">
                      {a.page.title}
                    </Link>
                    <span className="block text-signal-red">{a.reason}</span>
                  </li>
                ))}
                {urgent.length > 4 && <li className="text-sm text-stone-500">y {urgent.length - 4} más</li>}
              </ul>
            ) : (
              <div className="flex h-full flex-col justify-between gap-4">
                <Num value={0} className="text-7xl text-stone-700" />
                <p className="text-sm text-stone-500">Nada vencido, bloqueado ni esperando de más.</p>
              </div>
            )}
          </Card>

          <Card
            title="Con el Admin"
            action={
              <Link href="/revisiones" aria-label="Ver revisiones" title="Ver revisiones" className="btn-round size-9">
                <ArrowUpRight aria-hidden className="size-4" />
              </Link>
            }
          >
            <div className="flex items-end justify-between gap-3">
              <Num value={withAdmin.length} sup={withAdmin.length === 1 ? "pág" : "págs"} className="text-7xl text-stone-900" />
              {changes > 0 && <Badge tone="danger">{changes} con cambios</Badge>}
            </div>
            <p className="mt-3 text-sm text-stone-500">
              {withAdmin.length
                ? `La que más espera: ${withAdmin[0].p.title}, ${withAdmin[0].days === 1 ? "1 día" : `${withAdmin[0].days} días`}.`
                : "Ninguna página esperando revisión."}
            </p>
          </Card>
        </div>

        <Card
          className="mt-6"
          flush
          title={
            <nav aria-label="Tipo de página" className="seg -mt-1 w-fit max-w-full overflow-x-auto overflow-y-hidden">
              {[undefined, ...PAGE_TYPES].map((t) => {
                const active = t === tipo;
                const n = t ? all.filter((p) => p.type === t).length : all.length;
                return (
                  <Link
                    key={t ?? "todas"}
                    href={href({ tipo: t, etapa, q })}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-9 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-sm font-semibold transition-colors ${
                      active ? "bg-stone-800 text-ink" : "text-stone-500 hover:bg-white/[.06] hover:text-stone-900"
                    }`}
                  >
                    {t ?? "Todas"}
                    <span className={`num text-base ${active ? "text-ink/70" : "text-stone-400"}`}>{n}</span>
                  </Link>
                );
              })}
            </nav>
          }
          action={
            <span className="hidden whitespace-nowrap sm:inline">
              <span className="font-semibold text-ink">{pages.length}</span> páginas · <span className="font-semibold text-ink">{totalSp}</span> SP
            </span>
          }
        >
          <ul className="divide-y divide-stone-200 md:hidden">
            {pages.map((p) => {
              const w = mainWork(p);
              const fb = pendingFeedback(w);
              return (
                <li key={p.id}>
                  <Link href={`/paginas/${p.id}`} className="flex items-center gap-3 px-5 py-3.5 active:bg-stone-100">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-stone-900">{p.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-stone-500">
                        {p.type}
                        {w.storyPoints !== undefined && <span className="font-mono">{w.storyPoints} SP</span>}
                        {w.dueDate && <span className="font-mono">entrega {formatDate(w.dueDate)}</span>}
                        {fb > 0 && <span className="font-semibold text-signal-yellow">{fb} feedback</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StagePill stage={w.stage} />
                      <QaCell {...qaProgress(w)} qa={qaState(w)} wcag={wcagState(w)} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-stone-200 text-left text-xs text-stone-500">
                  <th scope="col" className="px-6 py-3.5 font-medium">Página</th>
                  <th scope="col" className="px-3 py-3.5 font-medium">Etapa</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">En etapa</th>
                  <th scope="col" className="px-3 py-3.5 font-medium">Entrega</th>
                  <th scope="col" className="px-3 py-3.5 text-right font-medium">SP</th>
                  <th scope="col" className="px-3 py-3.5 font-medium">
                    <abbr title="Checklist de QA y accesibilidad (WCAG)" className="no-underline">QA · WCAG</abbr>
                  </th>
                  <th scope="col" className="px-6 py-3.5 font-medium">Pendientes</th>
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
                    <tr key={p.id} className="group relative border-b border-stone-200/70 last:border-0 hover:bg-white/[.035]">
                      <td className="px-6 py-3.5">
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
                      <td className="px-3 py-3.5">
                        <StagePill stage={w.stage} />
                      </td>
                      <td className="px-3 py-3.5 text-right font-mono text-stone-700">
                        {days === undefined ? (
                          "—"
                        ) : (
                          <span
                            className={(w.stage === "Revisión Admin" || w.stage === "Cambios solicitados") && days > 2 ? "font-semibold text-signal-red" : ""}
                          >
                            {days}d
                          </span>
                        )}
                      </td>
                      <td className={`px-3 py-3.5 font-mono ${overdue ? "font-semibold text-signal-red" : "text-stone-700"}`}>{formatDate(w.dueDate)}</td>
                      <td className="px-3 py-3.5 text-right font-mono text-stone-700">{w.storyPoints ?? "—"}</td>
                      <td className="px-3 py-3.5">
                        <QaCell {...qaProgress(w)} qa={qaState(w)} wcag={wcagState(w)} />
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {w.blocked && <Badge tone="danger">Bloqueada</Badge>}
                          {fb > 0 && <Badge tone="warn">{fb} feedback</Badge>}
                          {adj > 0 && <Badge tone="info">{adj} ajuste</Badge>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pages.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-stone-500">Ninguna página coincide{q ? ` con «${q}»` : ""}.</p>
              <Link href="/" className="mt-2 inline-block text-sm font-semibold text-stone-900 underline">
                Ver todas
              </Link>
            </div>
          )}
        </Card>
      </PageBody>
    </>
  );
}
