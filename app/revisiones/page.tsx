import Link from "next/link";
import { connection } from "next/server";
import { Badge, Card, Empty, Masthead, PageBody } from "@/components/ui";
import { daysSince, formatDate, getPages, mainWork, pendingFeedback } from "@/lib/data";

export default async function Revisiones() {
  await connection();
  const now = new Date();
  const pages = await getPages();

  const waiting = pages
    .map((p) => ({ p, w: mainWork(p) }))
    .filter(({ w }) => w.stage === "Revisión Admin")
    .map(({ p, w }) => ({ p, w, review: w.reviews.at(-1) }))
    .sort((a, b) => (a.review?.requestedAt ?? "").localeCompare(b.review?.requestedAt ?? ""));

  const changes = pages.filter((p) => mainWork(p).stage === "Cambios solicitados");

  return (
    <>
      <Masthead title="Revisiones" meta="Lo que espera al Admin y lo que regresó con cambios." />
      <PageBody>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={`Esperando al Admin · ${waiting.length}`}>
          {waiting.length ? (
            <ul className="-my-1 divide-y divide-stone-100">
              {waiting.map(({ p, review }) => {
                const d = review ? daysSince(review.requestedAt, now) : 0;
                const fb = review?.feedback.length ?? 0;
                return (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                    <div>
                      <Link href={`/paginas/${p.id}`} className="font-medium hover:underline">
                        {p.title}
                      </Link>
                      <div className="text-xs text-stone-500">
                        Revisión #{review?.number} · desde {formatDate(review?.requestedAt)}
                        {fb > 0 && ` · ${fb} puntos de feedback`}
                      </div>
                    </div>
                    <Badge tone={d > 2 ? "warn" : "neutral"}>{d} días</Badge>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty>Nada esperando al Admin.</Empty>
          )}
        </Card>
        <Card title={`Cambios solicitados · ${changes.length}`}>
          {changes.length ? (
            <ul className="space-y-2 text-sm">
              {changes.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <Link href={`/paginas/${p.id}`} className="hover:underline">
                    {p.title}
                  </Link>
                  <Badge tone="warn">{pendingFeedback(mainWork(p))} pendientes</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              Ninguna todavía. Cuando el Admin cierre una revisión con cambios, la página aparece aquí con sus
              puntos pendientes.
            </Empty>
          )}
        </Card>
      </div>
      </PageBody>
    </>
  );
}
