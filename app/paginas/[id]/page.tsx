import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  addAdjustment,
  addFeedback,
  addNote,
  addTask,
  closeReview,
  deleteNote,
  deletePage,
  deleteTask,
  deleteWork,
  dismissWarnings,
  feedbackToTask,
  resetQa,
  setBlocked,
  setFeedbackStatus,
  setStage,
  toggleTask,
  updatePage,
  updateWork,
} from "@/app/actions";
import { ActionButton, DiscardFeedback, QaToggle, StageSelect, SubmitButton } from "@/components/edit";
import { Tabs } from "@/components/tabs";
import { Badge, Card, Empty, ExternalLink, Field, inputCls, StagePill } from "@/components/ui";
import {
  daysSince,
  editUrl,
  formatDate,
  formatDateTime,
  getPage,
  mainWork,
  openReview,
  pendingFeedback,
  previewUrl,
  qaProgress,
  stageSince,
  stageWarnings,
} from "@/lib/data";
import {
  BLOCK_REASONS,
  NOTE_KINDS,
  PAGE_TYPES,
  PRIORITIES,
  STAGES,
  STORY_POINTS,
  TASK_CATEGORIES,
  type Page,
  type Stage,
  type WorkItem,
} from "@/lib/types";

const PATH: Stage[] = ["Por hacer", "En curso", "QA", "Revisión Admin", "Publicado"];

function Stepper({ stage }: { stage: Stage }) {
  const steps =
    stage === "Cambios solicitados" ? ([...PATH.slice(0, 4), "Cambios solicitados", "Publicado"] as Stage[]) : PATH;
  const idx = steps.indexOf(stage);
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
      {steps.map((s, i) => (
        <li key={s} className="flex items-center gap-1">
          <span
            className={`rounded-full px-2 py-0.5 ${
              i === idx
                ? "bg-wlp-dark font-semibold text-wlp-yellow"
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

function WorkCard({ page, w, now }: { page: Page; w: WorkItem; now: Date }) {
  const since = stageSince(w);
  const warnings = Object.fromEntries(STAGES.map((s) => [s, stageWarnings(page, w, s)]));
  return (
    <Card
      title={
        <span className="flex flex-wrap items-center justify-between gap-2">
          <span>
            {w.kind} · {w.title}
          </span>
          {since && <span className="normal-case tracking-normal">En esta etapa desde {formatDate(since)} ({daysSince(since, now)} d)</span>}
        </span>
      }
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <StagePill stage={w.stage} />
          {w.blocked && <Badge tone="warn">Bloqueado: {w.blocked.reason}</Badge>}
        </div>
        <StageSelect pageId={page.id} workId={w.id} stage={w.stage} stages={STAGES} warnings={warnings} />
      </div>
      <Stepper stage={w.stage} />

      <form action={updateWork.bind(null, page.id, w.id)} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Título del trabajo" className="col-span-2 sm:col-span-3">
          <input name="title" defaultValue={w.title} className={inputCls} />
        </Field>
        <Field label="Prioridad">
          <select name="priority" defaultValue={w.priority} className={inputCls}>
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Story points">
          <select name="storyPoints" defaultValue={w.storyPoints ?? ""} className={inputCls}>
            <option value="">—</option>
            {STORY_POINTS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>
        <Field label="Inicio">
          <input type="date" name="startDate" defaultValue={w.startDate} className={inputCls} />
        </Field>
        <Field label="Fecha de entrega">
          <input type="date" name="dueDate" defaultValue={w.dueDate} className={inputCls} />
        </Field>
        <Field label="Entregada el">
          <input type="date" name="deliveredAt" defaultValue={w.deliveredAt} className={inputCls} />
        </Field>
        <div className="flex items-end">
          <SubmitButton variant="ghost">Guardar cambios</SubmitButton>
        </div>
      </form>

      <form
        action={setBlocked.bind(null, page.id, w.id)}
        className="mt-4 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-4"
      >
        {w.blocked ? (
          <>
            <input type="hidden" name="reason" value="" />
            <p className="flex-1 text-sm text-stone-600">
              Bloqueado desde {formatDate(w.blocked.since)} — {w.blocked.reason}
            </p>
            <SubmitButton variant="ghost">Desbloquear</SubmitButton>
          </>
        ) : (
          <>
            <Field label="Bloquear por">
              <select name="reason" className={inputCls} defaultValue="">
                <option value="" disabled>
                  Motivo…
                </option>
                {BLOCK_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Detalle (opcional)" className="min-w-40 flex-1">
              <input name="detail" className={inputCls} placeholder="Ej. esperando fotos del proyecto" />
            </Field>
            <SubmitButton variant="ghost">Marcar bloqueado</SubmitButton>
          </>
        )}
      </form>
    </Card>
  );
}

function ReviewsTab({ page, w, now }: { page: Page; w: WorkItem; now: Date }) {
  const open = openReview(w);
  const reviewWarnings = stageWarnings(page, w, "Revisión Admin");
  return (
    <div className="space-y-3">
      {(!open || open.result) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-wlp border border-dashed border-stone-300 bg-white px-5 py-4">
          <p className="text-sm text-stone-600">
            {w.reviews.length ? "¿Ya quedaron los cambios?" : "¿Lista para que la vea el Admin?"}
          </p>
          <ActionButton
            action={setStage.bind(null, page.id, w.id, "Revisión Admin")}
            confirmText={reviewWarnings.length ? `${reviewWarnings.join("\n")}\n\n¿Pedir revisión de todas formas?` : undefined}
            className="rounded-lg bg-wlp-yellow px-3.5 py-2 text-sm font-semibold text-stone-900 hover:bg-wlp-yellow-hover"
          >
            Solicitar revisión #{(w.reviews.at(-1)?.number ?? 0) + 1}
          </ActionButton>
        </div>
      )}
      {[...w.reviews].reverse().map((r) => {
        const isOpen = !r.closedAt;
        return (
          <Card
            key={r.id}
            title={
              <span className="flex flex-wrap items-center gap-2">
                Revisión #{r.number}
                <span className="text-stone-400">
                  solicitada {formatDate(r.requestedAt)}
                  {isOpen && !r.result && ` · ${daysSince(r.requestedAt, now)} días esperando`}
                </span>
                {r.result ? <Badge tone="warn">{r.result}</Badge> : <Badge tone="info">Esperando al Admin</Badge>}
              </span>
            }
          >
            {r.feedback.length ? (
              <ul className="divide-y divide-stone-100">
                {r.feedback.map((f) => (
                  <li key={f.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
                    <span
                      className={`size-2 shrink-0 rounded-full ${
                        f.status === "Pendiente" ? "bg-wlp-yellow" : f.status === "Resuelto" ? "bg-emerald-500" : "bg-stone-300"
                      }`}
                    />
                    <span className={`min-w-40 flex-1 ${f.status === "Descartado" ? "text-stone-400 line-through" : ""}`}>
                      {f.text}
                      {f.discardReason && <span className="ml-1 text-xs text-stone-400 no-underline">({f.discardReason})</span>}
                    </span>
                    {f.author && <span className="text-xs text-stone-400">{f.author}</span>}
                    {f.taskId && <Badge>Tarea</Badge>}
                    {f.status === "Pendiente" ? (
                      <span className="flex gap-1">
                        {!f.taskId && (
                          <ActionButton
                            action={feedbackToTask.bind(null, page.id, w.id, r.id, f.id)}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100"
                          >
                            → Tarea
                          </ActionButton>
                        )}
                        <ActionButton
                          action={setFeedbackStatus.bind(null, page.id, w.id, r.id, f.id, "Resuelto", undefined)}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                        >
                          Resuelto
                        </ActionButton>
                        <DiscardFeedback pageId={page.id} workId={w.id} reviewId={r.id} feedbackId={f.id} />
                      </span>
                    ) : (
                      <ActionButton
                        action={setFeedbackStatus.bind(null, page.id, w.id, r.id, f.id, "Pendiente", undefined)}
                        className="rounded-md px-2 py-1 text-xs font-semibold text-stone-500 hover:bg-stone-100"
                      >
                        Reabrir
                      </ActionButton>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-stone-400">Sin feedback todavía.</p>
            )}

            {isOpen && (
              <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
                <form action={addFeedback.bind(null, page.id, w.id, r.id)} className="space-y-2">
                  <Field label="Agregar feedback (una línea por punto)">
                    <textarea
                      name="text"
                      rows={3}
                      className={inputCls}
                      placeholder={"Bajar la saturación del amarillo\nRevisar el hero en celular"}
                    />
                  </Field>
                  <SubmitButton variant="ghost">Agregar puntos</SubmitButton>
                </form>
                <div className="flex flex-wrap gap-2">
                  <ActionButton
                    action={closeReview.bind(null, page.id, w.id, r.id, "Aprobado")}
                    confirmText={
                      pendingFeedback(w) ? "Hay feedback pendiente. ¿Aprobar y pasar a Publicado de todas formas?" : undefined
                    }
                    className="rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Aprobar → Publicado
                  </ActionButton>
                  {!r.result && (
                    <ActionButton
                      action={closeReview.bind(null, page.id, w.id, r.id, "Cambios solicitados")}
                      className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold text-stone-800 hover:border-stone-900"
                    >
                      Pedir cambios
                    </ActionButton>
                  )}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function TasksTab({ page, w }: { page: Page; w: WorkItem }) {
  return (
    <div className="space-y-3">
      <form
        action={addTask.bind(null, page.id, w.id)}
        className="flex flex-wrap items-end gap-2 rounded-wlp border border-stone-200 bg-white p-4"
      >
        <Field label="Nueva tarea" className="min-w-48 flex-1">
          <input name="title" required className={inputCls} placeholder="Ej. Optimizar imagen del hero" />
        </Field>
        <Field label="Categoría">
          <select name="category" className={inputCls}>
            {TASK_CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <label className="flex items-center gap-2 pb-2 text-sm text-stone-600">
          <input type="checkbox" name="critical" className="size-4 accent-[#d93838]" /> Crítica
        </label>
        <SubmitButton>Agregar</SubmitButton>
      </form>
      {w.tasks.length ? (
        <ul className="divide-y divide-stone-100 rounded-wlp border border-stone-200 bg-white">
          {w.tasks.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 px-4 py-2.5 text-sm">
              <ActionButton
                action={toggleTask.bind(null, page.id, w.id, t.id)}
                title={t.done ? "Reabrir" : "Completar"}
                className={`grid size-5 shrink-0 place-items-center rounded border text-[11px] font-bold ${
                  t.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-stone-300 hover:border-stone-900"
                }`}
              >
                {t.done ? "✓" : ""}
              </ActionButton>
              <span className={`min-w-40 flex-1 ${t.done ? "text-stone-400 line-through" : ""}`}>{t.title}</span>
              {t.critical && <Badge tone="warn">Crítica</Badge>}
              {t.feedbackId && <Badge tone="info">Feedback</Badge>}
              <Badge>{t.category}</Badge>
              <ActionButton
                action={deleteTask.bind(null, page.id, w.id, t.id)}
                confirmText={`¿Eliminar la tarea "${t.title}"?`}
                className="rounded-md px-2 py-1 text-xs text-stone-400 hover:bg-stone-100 hover:text-wlp-red"
              >
                Eliminar
              </ActionButton>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Sin tareas. Agrega una o convierte un punto de feedback en tarea.</Empty>
      )}
    </div>
  );
}

function QaTab({ page, w }: { page: Page; w: WorkItem }) {
  const { done, total } = qaProgress(w);
  if (!total) {
    return (
      <div className="rounded-wlp border border-dashed border-stone-300 bg-white px-5 py-6 text-center">
        <p className="mb-3 text-sm text-stone-500">Este trabajo no tiene checklist de QA.</p>
        <ActionButton
          action={resetQa.bind(null, page.id, w.id)}
          className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-semibold hover:border-stone-900"
        >
          Usar el checklist de {page.type}
        </ActionButton>
      </div>
    );
  }
  const groups = [...new Set(w.qa.map((q) => q.group))];
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full bg-wlp-yellow" style={{ width: `${(done / total) * 100}%` }} />
          </div>
          <span className="text-sm text-stone-600">
            {done} de {total} revisados
          </span>
        </div>
        <ActionButton
          action={resetQa.bind(null, page.id, w.id)}
          confirmText="Se borran las marcas actuales y se vuelve a copiar el checklist de la plantilla. ¿Continuar?"
          className="text-xs text-stone-400 hover:text-stone-900"
        >
          Reiniciar desde la plantilla
        </ActionButton>
      </div>
      <p className="mb-3 text-xs text-stone-500">Clic en cada punto: Pendiente → OK → No aplica.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((g) => (
          <Card key={g} title={g}>
            <div className="space-y-1">
              {w.qa
                .filter((q) => q.group === g)
                .map((q) => (
                  <QaToggle key={q.id} pageId={page.id} workId={w.id} qaId={q.id} status={q.status} label={q.label} />
                ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function NotesTab({ page }: { page: Page }) {
  return (
    <div className="space-y-3">
      <form action={addNote.bind(null, page.id)} className="space-y-2 rounded-wlp border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap gap-2">
          <Field label="Tipo">
            <select name="kind" className={inputCls}>
              {NOTE_KINDS.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Nota">
          <textarea name="body" rows={3} required className={inputCls} placeholder="Ej. Se cambió el iframe del mapa por imagen por rendimiento." />
        </Field>
        <SubmitButton>Agregar nota</SubmitButton>
      </form>
      {page.notes.length ? (
        page.notes.map((n) => (
          <Card key={n.id}>
            <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <Badge tone={n.author === "Admin" ? "warn" : "info"}>{n.kind}</Badge>
              {n.author} · {formatDateTime(n.createdAt)}
              <ActionButton
                action={deleteNote.bind(null, page.id, n.id)}
                confirmText="¿Eliminar esta nota?"
                className="ml-auto text-xs text-stone-400 hover:text-wlp-red"
              >
                Eliminar
              </ActionButton>
            </div>
            <p className="text-sm whitespace-pre-line text-stone-800">{n.body}</p>
          </Card>
        ))
      ) : (
        <Empty>Sin notas.</Empty>
      )}
    </div>
  );
}

export default async function PaginaDetalle({ params, searchParams }: PageProps<"/paginas/[id]">) {
  await connection();
  const now = new Date();
  const { id } = await params;
  const { w: selectedId } = await searchParams;
  const page = await getPage(id);
  if (!page) notFound();

  const main = mainWork(page);
  const w = page.works.find((x) => x.id === selectedId) ?? main;
  const qa = qaProgress(w);

  return (
    <>
      <Link href="/paginas" className="text-xs text-stone-500 hover:text-stone-800">
        ← Páginas
      </Link>
      <div className="mt-2 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">{page.type}</p>
          <h1 className="font-display text-4xl leading-none font-extrabold text-stone-900 uppercase">{page.title}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {page.channel && `Canal: ${page.channel} · `}
            {page.wpPageId ? `WordPress #${page.wpPageId}` : "Sin ID de WordPress"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExternalLink href={previewUrl(page)} primary>
            Preview
          </ExternalLink>
          <ExternalLink href={editUrl(page)}>Editar en WP</ExternalLink>
          <ExternalLink href={page.publicUrl}>Pública</ExternalLink>
          <ExternalLink href={page.docsUrl}>Documentación</ExternalLink>
          {page.figmaUrl && <ExternalLink href={page.figmaUrl}>Figma</ExternalLink>}
        </div>
      </div>

      {page.importWarnings.length > 0 && (
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3 rounded-wlp border border-wlp-yellow/60 bg-[#FDF3CF] px-5 py-3 text-sm text-[#6B4E00]">
          <div>
            <p className="font-semibold">Revisar</p>
            <ul className="mt-1 list-disc pl-5">
              {page.importWarnings.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </div>
          <ActionButton action={dismissWarnings.bind(null, page.id)} className="text-xs font-semibold underline">
            Marcar como revisado
          </ActionButton>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4">
          <WorkCard key={w.id} page={page} w={w} now={now} />
          <Tabs
            key={w.id}
            tabs={[
              { id: "revisiones", label: "Revisiones", count: w.reviews.length, content: <ReviewsTab page={page} w={w} now={now} /> },
              { id: "tareas", label: "Tareas", count: w.tasks.filter((t) => !t.done).length, content: <TasksTab page={page} w={w} /> },
              { id: "qa", label: `QA ${qa.total ? `${qa.done}/${qa.total}` : ""}`, content: <QaTab page={page} w={w} /> },
              { id: "notas", label: "Notas", count: page.notes.length, content: <NotesTab page={page} /> },
              {
                id: "actividad",
                label: "Actividad",
                content: (
                  <ol className="space-y-3 border-l-2 border-stone-200 pl-4">
                    {page.activity.map((a) => (
                      <li key={a.id} className="text-sm">
                        <span className="block font-mono text-[10.5px] tracking-[0.06em] text-stone-400 uppercase">
                          {formatDateTime(a.at)}
                          {a.actor && ` · ${a.actor}`}
                        </span>
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
          <Card title="Trabajos">
            <ul className="space-y-1">
              {page.works.map((x) => (
                <li key={x.id}>
                  <Link
                    href={`/paginas/${page.id}?w=${x.id}`}
                    scroll={false}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      x.id === w.id ? "bg-wlp-dark text-white" : "hover:bg-stone-100"
                    }`}
                  >
                    <span className="mb-1 flex items-center justify-between gap-2">
                      <span className={`font-mono text-[10px] tracking-[0.1em] uppercase ${x.id === w.id ? "text-wlp-yellow" : "text-stone-500"}`}>
                        {x.kind}
                      </span>
                      <StagePill stage={x.stage} />
                    </span>
                    <span className="block leading-snug">{x.title}</span>
                  </Link>
                  {x.kind === "Ajuste" && x.id === w.id && (
                    <ActionButton
                      action={deleteWork.bind(null, page.id, x.id)}
                      confirmText={`¿Eliminar el ajuste "${x.title}" con sus tareas?`}
                      className="mt-1 ml-3 text-xs text-stone-400 hover:text-wlp-red"
                    >
                      Eliminar ajuste
                    </ActionButton>
                  )}
                </li>
              ))}
            </ul>
            <form action={addAdjustment.bind(null, page.id)} className="mt-4 space-y-2 border-t border-stone-100 pt-4">
              <Field label="Nuevo ajuste">
                <input name="title" required className={inputCls} placeholder="Ej. Mejorar LCP del hero" />
              </Field>
              <SubmitButton variant="ghost">Crear ajuste</SubmitButton>
            </form>
          </Card>

          <Card title="Datos de la página">
            <form action={updatePage.bind(null, page.id)} className="space-y-3">
              <Field label="Título">
                <input name="title" defaultValue={page.title} required className={inputCls} />
              </Field>
              <Field label="Tipo">
                <select name="type" defaultValue={page.type} className={inputCls}>
                  {PAGE_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Canal (landings)">
                <input name="channel" defaultValue={page.channel} className={inputCls} placeholder="Bing, Google…" />
              </Field>
              <Field label="ID o preview de WordPress">
                <input name="wp" defaultValue={page.wpPageId} className={inputCls} placeholder="114631 o el enlace de preview" />
              </Field>
              <Field label="URL pública">
                <input name="publicUrl" type="url" defaultValue={page.publicUrl} className={inputCls} placeholder="https://www.welovepaving.com/…" />
              </Field>
              <Field label="Documentación">
                <input name="docsUrl" type="url" defaultValue={page.docsUrl} className={inputCls} />
              </Field>
              <Field label="Figma">
                <input name="figmaUrl" type="url" defaultValue={page.figmaUrl} className={inputCls} />
              </Field>
              <SubmitButton variant="ghost">Guardar página</SubmitButton>
            </form>
            <div className="mt-4 border-t border-stone-100 pt-3">
              <ActionButton
                action={deletePage.bind(null, page.id)}
                confirmText={`¿Eliminar "${page.title}" con todo su historial? No se puede deshacer.`}
                className="text-xs font-semibold text-stone-400 hover:text-wlp-red"
              >
                Eliminar página
              </ActionButton>
            </div>
          </Card>
        </aside>
      </div>
    </>
  );
}
