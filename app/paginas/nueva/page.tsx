import Link from "next/link";
import { createPage } from "@/app/actions";
import { SubmitButton } from "@/components/edit";
import { Card, Field, inputCls, PageHeader } from "@/components/ui";
import { PAGE_TYPES, PRIORITIES, STORY_POINTS } from "@/lib/types";

export default async function NuevaPagina({ searchParams }: PageProps<"/paginas/nueva">) {
  const { tipo } = await searchParams;
  const defaultType = PAGE_TYPES.find((t) => t === tipo) ?? "Páginas Principales";
  return (
    <>
      <Link href="/paginas" className="text-xs text-stone-500 hover:text-stone-800">
        ← Páginas
      </Link>
      <div className="mt-2">
        <PageHeader
          eyebrow="Producción web"
          title="Nueva página"
          subtitle="Se crea con su trabajo principal y el checklist de QA de su tipo."
        />
      </div>
      <Card className="max-w-2xl">
        <form action={createPage} className="grid gap-4 sm:grid-cols-2">
          <Field label="Título" className="sm:col-span-2">
            <input name="title" required autoFocus className={inputCls} placeholder="Ej. Our Values — V2" />
          </Field>
          <Field label="Tipo">
            <select name="type" defaultValue={defaultType} className={inputCls}>
              {PAGE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Canal (solo landings)">
            <input name="channel" className={inputCls} placeholder="Bing, Google…" />
          </Field>
          <Field label="ID o preview de WordPress" className="sm:col-span-2">
            <input name="wp" className={inputCls} placeholder="119440 o https://www.welovepaving.com/?page_id=119440&preview=true" />
          </Field>
          <Field label="URL pública (si ya existe)" className="sm:col-span-2">
            <input name="publicUrl" type="url" className={inputCls} placeholder="https://www.welovepaving.com/…" />
          </Field>
          <Field label="Etapa inicial">
            <select name="stage" defaultValue="En curso" className={inputCls}>
              {["Por hacer", "En curso"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Prioridad">
            <select name="priority" defaultValue="Normal" className={inputCls}>
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Story points (vacío = sugerido por tipo)">
            <select name="storyPoints" defaultValue="" className={inputCls}>
              <option value="">Sugerido</option>
              {STORY_POINTS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Fecha de entrega">
            <input type="date" name="dueDate" className={inputCls} />
          </Field>
          <Field label="Documentación" className="sm:col-span-2">
            <input name="docsUrl" type="url" className={inputCls} placeholder="Carpeta del reporte (opcional)" />
          </Field>
          <div className="sm:col-span-2">
            <SubmitButton>Crear página</SubmitButton>
          </div>
        </form>
      </Card>
    </>
  );
}
