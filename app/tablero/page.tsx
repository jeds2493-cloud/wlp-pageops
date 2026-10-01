import { connection } from "next/server";
import { Board, type BoardCard } from "@/components/board";
import { Masthead, PageBody } from "@/components/ui";
import { getPages, pendingFeedback, stageWarnings } from "@/lib/data";
import { STAGES, type Stage } from "@/lib/types";

const COLUMNS: Stage[] = ["Por hacer", "En curso", "QA", "Revisión Admin", "Cambios solicitados", "Publicado"];

export default async function Tablero() {
  await connection();
  const pages = await getPages();
  const cards: BoardCard[] = pages.flatMap((p) =>
    p.works
      .filter((w) => w.stage !== "Archivado")
      .map((w) => ({
        workId: w.id,
        pageId: p.id,
        title: w.kind === "Ajuste" ? w.title : p.title,
        subtitle: w.kind === "Ajuste" ? p.title : undefined,
        kind: w.kind,
        stage: w.stage,
        storyPoints: w.storyPoints,
        feedback: pendingFeedback(w),
        blocked: Boolean(w.blocked),
        warnings: Object.fromEntries(STAGES.map((s) => [s, stageWarnings(p, w, s)])),
      })),
  );

  return (
    <>
      <Masthead
        title="Tablero"
        meta={
          <>
            Arrastra una tarjeta para cambiar su etapa, o enfócala y usa <kbd>Alt</kbd> + <kbd>←</kbd> <kbd>→</kbd>. Cada tarjeta es un
            trabajo: la página V2 o un ajuste.
          </>
        }
      />
      <PageBody>
        <Board columns={COLUMNS} cards={cards} />
      </PageBody>
    </>
  );
}
