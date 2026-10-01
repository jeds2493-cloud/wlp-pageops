// Acceso con una contraseña compartida (PAGEOPS_PASSWORD en Netlify) mientras llega el
// login. Se valida en el servidor en cada pantalla, acción y descarga.
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "pageops_session";

function password(): string | undefined {
  return process.env.PAGEOPS_PASSWORD || undefined;
}

/** En local sin contraseña configurada se entra directo; en producción, nunca. */
export function passwordMissing(): boolean {
  return !password() && process.env.NODE_ENV === "production";
}

/** El valor de la cookie cambia si cambia la contraseña: cerrar sesión a todos = cambiarla. */
export function sessionToken(): string | undefined {
  const pw = password();
  return pw ? createHash("sha256").update(`pageops:${pw}`).digest("hex") : undefined;
}

export function checkPassword(attempt: string): boolean {
  const pw = password();
  if (!pw) return false;
  const a = createHash("sha256").update(attempt).digest();
  const b = createHash("sha256").update(pw).digest();
  return timingSafeEqual(a, b);
}

export async function isAuthed(): Promise<boolean> {
  const token = sessionToken();
  if (!token) return !passwordMissing();
  return (await cookies()).get(SESSION_COOKIE)?.value === token;
}

/** Para pantallas: sin sesión, manda a /entrar. */
export async function requirePage(from = "/"): Promise<void> {
  if (!(await isAuthed())) redirect(`/entrar?next=${encodeURIComponent(from)}`);
}

/** Para acciones y descargas: sin sesión, no se ejecuta nada. */
export async function requireAction(): Promise<void> {
  if (!(await isAuthed())) throw new Error("No autorizado: entra con la contraseña de PageOps.");
}
