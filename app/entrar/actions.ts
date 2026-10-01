"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { checkPassword, SESSION_COOKIE, sessionToken } from "@/lib/auth";

function safeNext(raw: string): string {
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

export async function login(_: string, fd: FormData): Promise<string> {
  const attempt = String(fd.get("password") ?? "");
  if (!checkPassword(attempt)) {
    await new Promise((r) => setTimeout(r, 600)); // frena intentos repetidos
    return "Contraseña incorrecta.";
  }
  (await cookies()).set(SESSION_COOKIE, sessionToken()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect(safeNext(String(fd.get("next") ?? "/")));
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/entrar");
}
