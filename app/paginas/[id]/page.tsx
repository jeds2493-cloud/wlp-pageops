import Link from "next/link";
import { requirePage } from "@/lib/auth";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { Accessibility, Check, ChevronDown, ChevronRight, Lock, RotateCcw, Settings2, Trash2 } from "lucide-react";
import {
  addNote,
  addTask,
  deleteNote,
  deletePage,
  deleteTask,
  deleteWork,
  dismissWarnings,
  resetQa,
  setStage,
  toggleTask,
} from "@/app/actions";
import {
  ActionButton,
  AddAdjustment,
  AddLinkButton,
  BlockToggle,
  buttonCls,
  InlineField,
  PageConfigForm,
  QaRow,
  StageCTA,
  StageStepper,
  SubmitButton,
} from "@/components/edit";
import { Tabs } from "@/components/tabs";
import { WCAG_GROUP } from "@/lib/templates";
import { Badge, Card, Empty, ExternalLink, Field, inputCls, Masthead, PageBody, Panel, stageDot, stageSignal, Underlay } from "@/components/ui";
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
  NOTE_KINDS,
  PAGE_TYPES,
  PRIORITIES,
  STAGES,
  STORY_POINTS,
  TASK_CATEGORIES,
  type Actor,
  type Page,
  type WorkItem,
} from "@/lib/types";

const ACTIVITY_PREVIEW = 8;

function TasksTab({ page, w }: { page: Page; w: WorkItem }) {
  return (
    <div className="space-y-3">
      {w.tasks.length ? (
        <ul className="divide-y divide-stone-200">
          {w.tasks.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
              <ActionButton
                action={toggleTask.bind(null, page.id, w.id, t.id)}
                label={t.done ? `Reabrir: ${t.title}` : `Completar: ${t.title}`}
                className={`grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors ${
                  t.done ? "border-signal-green bg-signal-green text-ink" : "border-stone-400 hover:border-stone-900"
                }`}
              >
                {t.done && <Check aria-hidden className="size-4" />}
              </ActionButton>
              <span className={`min-w-40 flex-1 text-sm ${t.done ? "text-stone-500 line-through" : "text-stone-900"}`}>{t.title}</span>
              {t.critical && <Badge tone="danger">Crítica</Badge>}
              {t.feedbackId && <Badge tone="info">Feedback</Badge>}
              {t.qaId && <Badge tone="info">QA</Badge>}
              <Badge>{t.category}</Badge>
              <ActionButton
                action={deleteTask.bind(null, page.id, w.id, t.id)}
                confirmText={`¿Eliminar la tarea "${t.title}"?`}
                label={`Eliminar tarea: ${t.title}`}
                className={`${buttonCls.quiet} hover:text-signal-red`}
              >
                <Trash2 aria-hidden className="size-4" />
              </ActionButton>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Sin tareas. Agrega una abajo o convierte un punto de feedback en tarea.</Empty>
      )}
      <form action={addTask.bind(null, page.id, w.id)} className="flex flex-wrap items-end gap-2 rounded-[20px] border border-dashed border-stone-300 p-3">
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
        <label className="flex min-h-10 items-center gap-2 text-sm text-stone-700">
          <input type="checkbox" name="critical" className="size-4 accent-[#ff5468]" /> Crítica
        </label>
        <SubmitButton variant="ghost">Agregar</SubmitButton>
      </form>
    </div>
  );
}

function QaTab({ page, w }: { page: Page; w: WorkItem }) {
  const { done, total, failing, pending } = qaProgress(w);
  if (!total) {
    return (
      <div className="rounded-[20px] border border-dashed border-stone-300 px-5 py-6 text-center">
        <p className="mb-3 text-sm text-stone-600">Este trabajo no tiene checklist de QA.</p>
        <ActionButton action={resetQa.bind(null, page.id, w.id)} className={buttonCls.ghost}>
          Usar el checklist de {page.type}
        </ActionButton>
      </div>
    );
  }
  const groups = [...new Set(w.qa.map((q) => q.group))];
  const openTasks = new Set(w.tasks.filter((t) => !t.done).map((t) => t.id));
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div
            role="progressbar"
            aria-label="QA aprobado"
            aria-valuenow={done}
            aria-valuemin={0}
            aria-valuemax={total}
            className="flex h-2 w-40 overflow-hidden rounded-full bg-stone-200"
          >
            <div className="h-full bg-signal-green" style={{ width: `${(done / total) * 100}%` }} />
            <div className="h-full bg-signal-red" style={{ width: `${(failing / total) * 100}%` }} />
          </div>
          <span className="text-sm text-stone-700">
            <span className="font-mono font-semibold">{done}</span>/{total} listos
            {failing > 0 && (
              <>
                {" "}· <span className="font-mono font-semibold text-signal-red">{failing}</span> no pasan
              </>
            )}
            {pending > 0 && (
              <>
                {" "}· <span className="font-mono font-semibold">{pending}</span> sin revisar
              </>
            )}
          </span>
        </div>
        <ActionButton
          action={resetQa.bind(null, page.id, w.id)}
          confirmText="Se borran las marcas actuales y se vuelve a copiar el checklist de la plantilla. ¿Continuar?"
        >
          <RotateCcw aria-hidden className="size-4" /> Reiniciar
        </ActionButton>
      </div>
      <p className="mb-3 text-sm text-stone-600">
        Para aprobar, cada punto pasa o no aplica (con motivo). «No pasa» abre una tarea crítica; al cerrarla, el punto vuelve a revisarse.
      </p>
      <div className="space-y-5">
        {groups.map((g) => (
          <section key={g} aria-label={g}>
            <h3 className="mb-1 flex items-center gap-2 border-b border-stone-200 pb-2 font-display text-lg font-bold text-stone-900">
              {g === WCAG_GROUP && <Accessibility aria-hidden className="size-4.5" />} {g}
            </h3>
            <div className="divide-y divide-stone-200/70">
              {w.qa
                .filter((q) => q.group === g)
                .map((q) => (
                  <QaRow
                    key={`${q.id}-${q.status}`}
                    pageId={page.id}
                    workId={w.id}
                    qaId={q.id}
                    status={q.status}
                    label={q.label}
                    reason={q.reason}
                    taskOpen={Boolean(q.taskId && openTasks.has(q.taskId))}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function WorkStatus({ page, w, now }: { page: Page; w: WorkItem; now: Date }) {
  const since = stageSince(w);
  const days = since ? daysSince(since, now) : undefined;
  const warnings = Object.fromEntries(STAGES.map((s) => [s, stageWarnings(page, w, s)]));
  const open = openReview(w);
  const nextReview = open && !open.result ? open.number : (w.reviews.at(-1)?.number ?? 0) + 1;
  const cta = (
    <StageCTA
      pageId={page.id}
      workId={w.id}
      stage={w.stage}
      nextReview={nextReview}
      openReviewId={open?.id}
      pending={pendingFeedback(w)}
      warnings={warnings}
    />
  );
  return (
    <Underlay
      signal="var(--color-signal-red)"
      strip={
        w.blocked && (
          <>
            <Lock aria-hidden className="size-4" /> Bloqueada: {w.blocked.reason} · desde {formatDate(w.blocked.since)}
          </>
        )
      }
    >
      <section aria-label="Estado del trabajo" className="tile-folder">
        <div className="flex flex-wrap items-end">
          <div className="tile-tab px-3 pt-3">
            <nav aria-label="Trabajos de esta página" className="seg w-fit max-w-full flex-wrap rounded-[18px]">
              {page.works.map((x) => {
                const selected = x.id === w.id;
                return (
                  <Link
                    key={x.id}
                    href={`/paginas/${page.id}?w=${x.id}`}
                    scroll={false}
                    aria-current={selected ? "page" : undefined}
                    className={`inline-flex min-h-9 max-w-64 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors ${
                      selected ? "bg-stone-800 text-ink" : "text-stone-500 hover:bg-white/[.06] hover:text-stone-900"
                    }`}
                  >
                    <span aria-hidden className={`size-2 shrink-0 rounded-full ${stageDot[x.stage]}`} />
                    <span className="truncate">{x.kind === "Ajuste" ? `Ajuste: ${x.title}` : "Página V2"}</span>
                    <span className="sr-only">({x.stage})</span>
                  </Link>
                );
              })}
              <AddAdjustment pageId={page.id} />
            </nav>
          </div>
          <div className="hidden min-w-0 flex-1 justify-end py-2 pl-8 sm:flex">{cta}</div>
        </div>
        <div className="tile-body p-4 md:p-6">
          <div className="mb-2 sm:hidden">{cta}</div>
          <Panel
            signal={stageSignal[w.stage]}
            tab={days === undefined ? w.stage : days === 0 ? "Hoy en esta etapa" : `${days} ${days === 1 ? "día" : "días"} en esta etapa`}
          >
            <div className="overflow-x-auto px-2 py-2.5">
              <StageStepper pageId={page.id} workId={w.id} stage={w.stage} warnings={warnings} />
            </div>
          </Panel>
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
            {w.kind === "Ajuste" && (
              <div className="col-span-2 sm:col-span-3 lg:col-span-5">
                <InlineField pageId={page.id} workId={w.id} field="title" label="Ajuste" value={w.title} kind="text" />
              </div>
            )}
            <InlineField pageId={page.id} workId={w.id} field="priority" label="Prioridad" value={w.priority} options={PRIORITIES} />
            <InlineField pageId={page.id} workId={w.id} field="storyPoints" label="Story points" value={w.storyPoints} options={STORY_POINTS} />
            <InlineField pageId={page.id} workId={w.id} field="startDate" label="Inicio" value={w.startDate} kind="date" />
            <InlineField pageId={page.id} workId={w.id} field="dueDate" label="Entrega" value={w.dueDate} kind="date" />
            <InlineField pageId={page.id} workId={w.id} field="deliveredAt" label="Entregada el" value={w.deliveredAt} kind="date" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-200 pt-3">
            <BlockToggle pageId={page.id} workId={w.id} blocked={w.blocked} />
            {w.stage !== "Archivado" && (
              <ActionButton
                action={setStage.bind(null, page.id, w.id, "Archivado")}
                confirmText="¿Archivar este trabajo? Puedes reabrirlo después."
              >
                Archivar
              </ActionButton>
            )}
            {w.kind === "Ajuste" && (
              <ActionButton
                action={deleteWork.bind(null, page.id, w.id)}
                confirmText={`¿Eliminar el ajuste "${w.title}" con sus tareas?`}
                className={`${buttonCls.quiet} hover:text-signal-red`}
              >
                <Trash2 aria-hidden className="size-4" /> Eliminar ajuste
              </ActionButton>
            )}
          </div>
        </div>
      </section>
    </Underlay>
  );
}

export default async function PaginaDetalle({ params, searchParams }: PageProps<"/paginas/[id]">) {
  await requirePage(`/paginas/${(await params).id}`);
  await connection();
  const now = new Date();
  const { id } = await params;
  const { w: selectedId } = await searchParams;
  const page = await getPage(id);
  if (!page) notFound();
  const actor: Actor = (await cookies()).get("pageops_actor")?.value === "Admin" ? "Admin" : "Producción";

  const main = mainWork(page);
  const w = page.works.find((x) => x.id === selectedId) ?? main;
  const qa = qaProgress(w);
  const initialTab = w.stage === "QA" ? "qa" : "tareas";
  const preview = previewUrl(page);
  const edit = editUrl(page);

  return (
    <>
      <Masthead
        crumbs={
          <>
            <Link href="/" className="hover:text-ink hover:underline">
              Páginas
            </Link>
            <ChevronRight aria-hidden className="size-4" />
            <Link href={`/?tipo=${encodeURIComponent(page.type)}`} className="hover:text-ink hover:underline">
              {page.type}
            </Link>
          </>
        }
        title={page.title}
        meta={
          <>
            {page.wpPageId ? <span className="font-mono">WP #{page.wpPageId}</span> : "Sin ID de WordPress"}
            {page.channel && ` · Canal ${page.channel}`}
          </>
        }
        actions={
          <>
            {preview && edit ? (
              <>
                <ExternalLink href={preview} primary>
                  Preview
                </ExternalLink>
                <ExternalLink href={edit}>
                  Editar en WP
                </ExternalLink>
              </>
            ) : (
              <AddLinkButton field="wp">ID de WordPress</AddLinkButton>
            )}
            {page.publicUrl ? (
              <ExternalLink href={page.publicUrl}>
                Pública
              </ExternalLink>
            ) : (
              <AddLinkButton field="publicUrl">URL pública</AddLinkButton>
            )}
            {page.docsUrl ? (
              <ExternalLink href={page.docsUrl}>
                Documentación
              </ExternalLink>
            ) : (
              <AddLinkButton field="docsUrl">Documentación</AddLinkButton>
            )}
          </>
        }
      />

      <PageBody>
      {page.importWarnings.length > 0 && (
        <div role="note" className="mb-5 flex flex-wrap items-start justify-between gap-3 rounded-[20px] bg-signal-yellow px-5 py-3 text-sm font-medium text-ink shadow-[0_14px_30px_-18px_rgb(242_194_48)]">
          <ul className="space-y-0.5">
            {page.importWarnings.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <ActionButton action={dismissWarnings.bind(null, page.id)} className="inline-flex min-h-9 items-center rounded-lg px-2.5 text-sm font-semibold text-ink hover:bg-black/[.08]">
            Ocultar aviso
          </ActionButton>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <WorkStatus key={w.id} page={page} w={w} now={now} />

          <Tabs
            // Cambia de pestaña cuando la etapa pide otra (p. ej. al abrir una revisión).
            key={`${w.id}-${initialTab}`}
            initial={initialTab}
            tabs={[
              {
                id: "tareas",
                label: "Tareas",
                count: w.tasks.filter((t) => !t.done).length || undefined,
                content: <TasksTab page={page} w={w} />,
              },
              { id: "qa", label: qa.total ? `QA ${qa.done}/${qa.total}` : "QA", count: qa.failing || undefined, alert: qa.failing > 0, content: <QaTab page={page} w={w} /> },
              { id: "notas", label: "Notas", count: page.notes.length || undefined, content: <NotesTab page={page} actor={actor} /> },
            ]}
          />
          <details id="config" className="group tile">
            <summary className="flex min-h-14 cursor-pointer list-none flex-wrap items-center gap-x-2 gap-y-0.5 px-6 py-3 text-sm font-semibold text-stone-900 [&::-webkit-details-marker]:hidden">
              <Settings2 aria-hidden className="size-4 text-stone-500" /> Configuración de la página
              <span className="font-normal text-stone-500">título, tipo, ID de WordPress, URL y documentación</span>
              <ChevronDown aria-hidden className="ml-auto size-4 text-stone-500 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-stone-200 p-6">
              <PageConfigForm pageId={page.id}>
                <Field label="Título" className="sm:col-span-2">
                  <input name="title" defaultValue={page.title} required className={inputCls} />
                </Field>
                <Field label="Tipo">
                  <select name="type" defaultValue={page.type} className={inputCls}>
                    {PAGE_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Canal (solo landings)">
                  <input name="channel" defaultValue={page.channel} className={inputCls} placeholder="Bing, Google…" />
                </Field>
                <Field label="ID o enlace de preview de WordPress">
                  <input id="cfg-wp" name="wp" defaultValue={page.wpPageId} className={inputCls} placeholder="114631" />
                </Field>
                <Field label="URL pública">
                  <input id="cfg-publicUrl" name="publicUrl" type="url" defaultValue={page.publicUrl} className={inputCls} placeholder="https://www.welovepaving.com/…" />
                </Field>
                <Field label="Documentación">
                  <input id="cfg-docsUrl" name="docsUrl" type="url" defaultValue={page.docsUrl} className={inputCls} placeholder="Carpeta del reporte" />
                </Field>
              </PageConfigForm>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-signal-red/10 px-4 py-3 ring-1 ring-inset ring-signal-red/25">
                <p className="text-sm text-stone-700">Eliminar la página borra sus trabajos, revisiones, notas y actividad.</p>
                <ActionButton
                  action={deletePage.bind(null, page.id)}
                  confirmText={`¿Eliminar "${page.title}" con todo su historial? No se puede deshacer.`}
                  className="btn-soft text-signal-red"
                >
                  <Trash2 aria-hidden className="size-4" /> Eliminar página
                </ActionButton>
              </div>
            </div>
          </details>
        </div>

        <aside
          className="lg:sticky lg:top-24 lg:self-start"
          aria-label="Actividad de la página"
        >
          <Card title="Actividad" action={<span className="num text-lg text-ink-2">{page.activity.length}</span>} bodyClassName="lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto lg:overscroll-contain">
            <ol className="space-y-3">
              {page.activity.slice(0, ACTIVITY_PREVIEW).map((a) => (
                <li key={a.id} className="text-sm text-stone-800">
                  <span className="block text-xs text-stone-500">
                    {formatDateTime(a.at)}
                    {a.actor && ` · ${a.actor}`}
                  </span>
                  {a.text}
                </li>
              ))}
            </ol>
            {page.activity.length > ACTIVITY_PREVIEW && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-stone-700 hover:text-stone-900">
                  Ver {page.activity.length - ACTIVITY_PREVIEW} más
                </summary>
                <ol className="mt-3 space-y-3">
                  {page.activity.slice(ACTIVITY_PREVIEW).map((a) => (
                    <li key={a.id} className="text-sm text-stone-800">
                      <span className="block text-xs text-stone-500">
                        {formatDateTime(a.at)}
                        {a.actor && ` · ${a.actor}`}
                      </span>
                      {a.text}
                    </li>
                  ))}
                </ol>
              </details>
            )}
          </Card>
        </aside>
      </div>

      </PageBody>
    </>
  );
}

function NotesTab({ page, actor }: { page: Page; actor: Actor }) {
  return (
    <div className="space-y-3">
      {page.notes.length ? (
        <ul className="divide-y divide-stone-200">
          {page.notes.map((n) => (
            <li key={n.id} className="flex items-start gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-stone-500">
                  <span className="font-semibold text-stone-800">{n.kind}</span> · {n.author} · {formatDateTime(n.createdAt)}
                </p>
                <p className="mt-1 text-sm whitespace-pre-line text-stone-800">{n.body}</p>
              </div>
              <ActionButton
                action={deleteNote.bind(null, page.id, n.id)}
                confirmText="¿Eliminar esta nota?"
                label="Eliminar nota"
                className={`${buttonCls.quiet} hover:text-signal-red`}
              >
                <Trash2 aria-hidden className="size-4" />
              </ActionButton>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Sin notas. Aquí van las decisiones técnicas y las indicaciones del Admin.</Empty>
      )}
      <form action={addNote.bind(null, page.id)} className="flex flex-wrap items-end gap-2 rounded-[20px] border border-dashed border-stone-300 p-3">
        <Field label="Nueva nota" className="min-w-48 flex-1">
          <textarea name="body" rows={2} required className={inputCls} placeholder="Ej. El mapa se cambió por imagen por rendimiento." />
        </Field>
        <Field label="Tipo">
          <select name="kind" defaultValue={actor === "Admin" ? "Indicación del Admin" : "Decisión técnica"} className={inputCls}>
            {NOTE_KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <SubmitButton variant="ghost">Agregar</SubmitButton>
      </form>
    </div>
  );
}
