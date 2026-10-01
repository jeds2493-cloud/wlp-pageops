import Link from "next/link";
import { connection } from "next/server";
import { RotateCcw, Trash2 } from "lucide-react";
import { createTicket, deleteTicket, reopenTicket } from "@/app/actions";
import { ActionButton, buttonCls, SubmitButton } from "@/components/edit";
import { TearTicket } from "@/components/tear-ticket";
import { Card, Empty, Field, inputCls, Masthead, PageBody } from "@/components/ui";
import { requirePage } from "@/lib/auth";
import { formatDateTime, getPages } from "@/lib/data";
import { loadTickets } from "@/lib/store";
import { PRIORITIES } from "@/lib/types";

const PRIORITY_ORDER = { Urgente: 0, Alta: 1, Normal: 2, Baja: 3 } as const;

export default async function Tickets() {
  await requirePage("/tickets");
  await connection();
  const [tickets, pages] = await Promise.all([loadTickets(), getPages()]);
  const titles = new Map(pages.map((p) => [p.id, p.title]));
  const open = tickets
    .filter((t) => !t.closedAt)
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.number - b.number);
  const closed = tickets.filter((t) => t.closedAt).sort((a, b) => (b.closedAt ?? "").localeCompare(a.closedAt ?? ""));

  return (
    <>
      <Masthead
        title="Tickets"
        meta={
          <>
            <span className="font-mono text-white">{open.length}</span> abiertos ·{" "}
            <span className="font-mono text-white">{closed.length}</span> en el historial. Jala el talón de un ticket para cerrarlo.
          </>
        }
      />
      <PageBody>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section aria-label="Tickets abiertos">
            {open.length ? (
              <ul className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {open.map((t) => (
                  <TearTicket key={t.id} ticket={t} pageTitle={t.pageId ? titles.get(t.pageId) : undefined} />
                ))}
              </ul>
            ) : (
              <div className="rounded-wlp border border-dashed border-stone-300 px-5 py-12 text-center">
                <p className="text-sm text-stone-600">No hay tickets abiertos.</p>
              </div>
            )}
          </section>

          <aside className="space-y-4">
            <Card title="Nuevo ticket">
              <form action={createTicket} className="space-y-3">
                <Field label="Título">
                  <input name="title" required className={inputCls} placeholder="Ej. Subir fotos nuevas a la galería" />
                </Field>
                <Field label="Detalle (opcional)">
                  <textarea name="detail" rows={3} className={inputCls} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Prioridad">
                    <select name="priority" defaultValue="Normal" className={inputCls}>
                      {PRIORITIES.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Página (opcional)">
                    <select name="pageId" defaultValue="" className={inputCls}>
                      <option value="">Ninguna</option>
                      {pages.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <SubmitButton>Crear ticket</SubmitButton>
              </form>
            </Card>

            <Card title={`Historial · ${closed.length}`} flush>
              {closed.length ? (
                <ul className="max-h-[32rem] divide-y divide-stone-100 overflow-y-auto">
                  {closed.map((t) => (
                    <li key={t.id} className="flex items-start gap-2 px-5 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-stone-800">
                          <span className="font-mono text-xs text-stone-500">#{String(t.number).padStart(3, "0")}</span>{" "}
                          <span className="line-through decoration-stone-400">{t.title}</span>
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500">
                          Cerrado por {t.closedBy} · {formatDateTime(t.closedAt!)}
                          {t.pageId && titles.get(t.pageId) && (
                            <>
                              {" · "}
                              <Link href={`/paginas/${t.pageId}`} className="underline-offset-2 hover:underline">
                                {titles.get(t.pageId)}
                              </Link>
                            </>
                          )}
                        </p>
                      </div>
                      <ActionButton action={reopenTicket.bind(null, t.id)} label={`Reabrir ticket #${t.number}`} className={buttonCls.quiet}>
                        <RotateCcw aria-hidden className="size-4" />
                      </ActionButton>
                      <ActionButton
                        action={deleteTicket.bind(null, t.id)}
                        confirmText={`¿Eliminar el ticket #${t.number} del historial?`}
                        label={`Eliminar ticket #${t.number}`}
                        className={`${buttonCls.quiet} hover:text-wlp-red`}
                      >
                        <Trash2 aria-hidden className="size-4" />
                      </ActionButton>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>Aquí aparecen los tickets que cortes.</Empty>
              )}
            </Card>
          </aside>
        </div>
      </PageBody>
    </>
  );
}
