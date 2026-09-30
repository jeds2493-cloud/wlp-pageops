import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Tabs } from "@/components/tabs";
import { Badge, Card, Empty, ExternalLink, StagePill } from "@/components/ui";
import {
  daysSince,
  editUrl,
  formatDate,
  getPage,
  mainWork,
  pendingFeedback,
  previewUrl,
  stageSince,
} from "@/lib/data";
import { qaTemplate } from "@/lib/templates";
import type { Stage, WorkItem } from "@/lib/types";

const PATH: Stage[] = ["Por hacer", "En curso", "QA", "Revisión Admin", "Publicado"];

function Stepper({ stage }: { stage: Stage }) {
  const steps = stage === "Cambios solicitados" ? [...PATH.slice(0, 4), "Cambios solicitados" as Stage, "Publicado" as Stage] : PATH;
  const idx = steps.indexOf(stage);
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-1">
          <span
            className={`rounded-full px-2 py-0.5 ${
              i === idx
                ? "bg-stone-900 font-medium text-white"
                : i < idx
                  ? "bg-stone-200 text-stone-600"
                  : "text-stone-400 ring-1 ring-inset ring-stone-200"
            }`}
          >
            {s}
          </span>
          {i < steps.length - 1 && <span className="text-stone-300">→</span>}
        </li>
      ))}
    </ol>
  );
}

function WorkSummary({ w, now }: { w: WorkItem; now: Date }) {
  const since = stageSince(w);
  const fields: [string, React.ReactNode][] = [
    ["Tipo", w.kind],
    ["Prioridad", w.priority],
    ["Story points", w.storyPoints ?? "—"],
    ["Entregada el", formatDate(w.deliveredAt)],
    ["Fecha de entrega", formatDate(w.dueDate)],
    ["En esta etapa", since ? `${daysSince(since, now)} días` : "—"],
  ];
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <StagePill stage={w.stage} />
        {w.blocked && <Badge tone="warn">Bloqueada: {w.blocked.reason}</Badge>}
      </div>
      <Stepper stage={w.stage} />
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
        {fields.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-stone-400">{k}</dt>
            <dd className="text-stone-800">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function PaginaDetalle({ params }: PageProps<"/paginas/[id]">) {
  await connection();
  const now = new Date();
  const { id } = await params;
  const page = await getPage(id);
  if (!page) notFound();

  const main = mainWork(page);
  const others = page.works.filter((w) => w.id !== main.id);
  const tasks = page.works.flatMap((w) => w.tasks.map((t) => ({ ...t, work: w })));
  const reviews = page.works.flatMap((w) => w.reviews);
  const qa = qaTemplate(page.type);

  return (
    <>
      <Link href="/paginas" className="text-xs text-stone-500 hover:text-stone-800">
        ← Páginas
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{page.title}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {page.type}
            {page.channel && ` · Canal: ${page.channel}`}
            {page.wpPageId && ` · WP #${page.wpPageId}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExternalLink href={previewUrl(page)}>Preview</ExternalLink>
          <ExternalLink href={editUrl(page)}>Editar en WP</ExternalLink>
          <ExternalLink href={page.publicUrl}>Pública</ExternalLink>
          <ExternalLink href={page.docsUrl}>Documentación</ExternalLink>
        </div>
      </div>

      {page.importWarnings.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-medium">Revisar al importar</p>
          <ul className="mt-1 list-disc pl-5">
            {page.importWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card title="Trabajo principal">
            <WorkSummary w={main} now={now} />
          </Card>

          <Tabs
            tabs={[
              {
                id: "revisiones",
                label: "Revisiones",
                count: reviews.length,
                content: reviews.length ? (
                  <div className="space-y-3">
                    {reviews.map((r) => (
                      <Card
                        key={r.id}
                        title={
                          <span className="flex flex-wrap items-center gap-2">
                            Revisión #{r.number}
                            <span className="font-normal text-stone-400">
                              solicitada el {formatDate(r.requestedAt)}
                            </span>
                            {r.result ? (
                              <Badge tone="warn">{r.result}</Badge>
                            ) : (
                              !r.closedAt && <Badge tone="warn">Esperando al Admin</Badge>
                            )}
                          </span>
                        }
                      >
                        {r.feedback.length ? (
                          <ul className="space-y-2">
                            {r.feedback.map((f) => (
                              <li key={f.id} className="flex items-start gap-2 text-sm">
                                <span className="mt-0.5 size-4 shrink-0 rounded border border-stone-300" />
                                <span className="flex-1">{f.text}</span>
                                <Badge tone={f.status === "Pendiente" ? "warn" : "neutral"}>{f.status}</Badge>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-stone-400">El Admin aún no deja feedback.</p>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Empty>Sin revisiones registradas.</Empty>
                ),
              },
              {
                id: "tareas",
                label: "Tareas",
                count: tasks.length,
                content: tasks.length ? (
                  <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
                    {tasks.map((t) => (
                      <li key={t.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
                        <span className={`size-4 shrink-0 rounded border ${t.done ? "border-emerald-500 bg-emerald-500" : "border-stone-300"}`} />
                        <span className="flex-1">{t.title}</span>
                        <Badge>{t.category}</Badge>
                        <span className="text-xs text-stone-400">{t.work.kind}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <Empty>Sin tareas. En Fase 1 cada punto de feedback se convierte en tarea con un clic.</Empty>
                ),
              },
              {
                id: "qa",
                label: "QA",
                content: (
                  <div>
                    <p className="mb-3 text-xs text-stone-500">
                      Checklist de la plantilla ({page.type}). La hoja no registraba QA, así que empieza sin marcar.
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {qa.map((g) => (
                        <Card key={g.group} title={g.group}>
                          <ul className="space-y-1.5 text-sm text-stone-700">
                            {g.items.map((it) => (
                              <li key={it} className="flex items-start gap-2">
                                <span className="mt-0.5 size-4 shrink-0 rounded border border-stone-300" />
                                {it}
                              </li>
                            ))}
                          </ul>
                        </Card>
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                id: "notas",
                label: "Notas",
                count: page.notes.length,
                content: page.notes.length ? (
                  <div className="space-y-3">
                    {page.notes.map((n) => (
                      <Card key={n.id}>
                        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-stone-500">
                          <Badge tone={n.author === "Admin" ? "warn" : "info"}>{n.kind}</Badge>
                          {n.author} · {formatDate(n.createdAt)}
                        </div>
                        <p className="text-sm text-stone-800">{n.body}</p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Empty>Sin notas.</Empty>
                ),
              },
              {
                id: "actividad",
                label: "Actividad",
                content: (
                  <ol className="space-y-3 border-l border-stone-200 pl-4">
                    {page.activity.map((a) => (
                      <li key={a.id} className="text-sm">
                        <span className="block text-xs text-stone-400">{formatDate(a.at)}</span>
                        {a.text}
                      </li>
                    ))}
                  </ol>
                ),
              },
            ]}
          />
        </div>

        <aside className="space-y-4">
          <Card title="Otros trabajos">
            {others.length ? (
              <ul className="space-y-3">
                {others.map((w) => (
                  <li key={w.id} className="text-sm">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge>{w.kind}</Badge>
                      <StagePill stage={w.stage} />
                    </div>
                    {w.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-400">Sin ajustes ni trabajos adicionales.</p>
            )}
          </Card>
          <Card title="Resumen">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Feedback pendiente</dt>
                <dd>{pendingFeedback(main)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Tareas abiertas</dt>
                <dd>{tasks.filter((t) => !t.done).length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Notas</dt>
                <dd>{page.notes.length}</dd>
              </div>
            </dl>
          </Card>
        </aside>
      </div>
    </>
  );
}
