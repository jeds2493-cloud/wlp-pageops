import { isAuthed } from "@/lib/auth";
import { loadBackup, loadPages } from "@/lib/store";

// Descarga de respaldo con todas las páginas, en JSON.
export async function GET(request: Request) {
  if (!(await isAuthed())) return new Response("No autorizado", { status: 401 });
  // ?copia=<nombre> descarga un respaldo automático (p. ej. antes-schema-2).
  const copia = new URL(request.url).searchParams.get("copia");
  if (copia) {
    const backup = await loadBackup(copia);
    if (!backup) return new Response("No existe ese respaldo", { status: 404 });
    return new Response(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="pageops-${copia}.json"`,
      },
    });
  }
  const pages = await loadPages();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), pages }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="pageops-respaldo-${date}.json"`,
    },
  });
}
