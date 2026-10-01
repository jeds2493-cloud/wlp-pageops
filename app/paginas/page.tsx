import { redirect } from "next/navigation";

// Páginas e Inicio son ahora una sola pantalla: la raíz.
export default async function PaginasRedirect({ searchParams }: PageProps<"/paginas">) {
  const sp = await searchParams;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (typeof v === "string") q.set(k, v);
  const s = q.toString();
  redirect(s ? `/?${s}` : "/");
}
