import Image from "next/image";
import { redirect } from "next/navigation";
import { isAuthed, passwordMissing } from "@/lib/auth";
import { LoginForm } from "./form";

export const metadata = { title: "Entrar · WLP PageOps" };

export default async function Entrar({ searchParams }: PageProps<"/entrar">) {
  const { next } = await searchParams;
  const target = typeof next === "string" ? next : "/";
  if (await isAuthed()) redirect(target);
  return (
    <div className="grid min-h-screen place-items-center bg-wlp-dark px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <Image src="/wlp-logo.png" alt="We Love Paving" width={52} height={30} priority />
          <span className="font-display text-2xl font-extrabold tracking-wide text-white uppercase">PageOps</span>
        </div>
        <div className="rounded-wlp bg-white p-6">
          {passwordMissing() ? (
            <p className="text-sm text-stone-700">
              Falta configurar la contraseña. En Netlify, agrega la variable de entorno <code className="font-mono">PAGEOPS_PASSWORD</code> y
              vuelve a publicar.
            </p>
          ) : (
            <LoginForm next={target} />
          )}
        </div>
        <div className="lane-line mt-6" aria-hidden />
      </div>
    </div>
  );
}
