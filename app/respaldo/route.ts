import { loadPages } from "@/lib/store";

// Descarga de respaldo con todas las páginas, en JSON.
export async function GET() {
  const pages = await loadPages();
  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify({ exportedAt: new Date().toISOString(), pages }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="pageops-respaldo-${date}.json"`,
    },
  });
}
