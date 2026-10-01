import type { Metadata } from "next";
import Image from "next/image";
import { Barlow_Semi_Condensed, IBM_Plex_Mono, Inter } from "next/font/google";
import { cookies } from "next/headers";
import { Download, LogOut } from "lucide-react";
import { logout } from "@/app/entrar/actions";
import { isAuthed } from "@/lib/auth";
import { ActorSwitch } from "@/components/edit";
import { Nav } from "@/components/nav";
import { Shortcuts } from "@/components/shortcuts";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const barlow = Barlow_Semi_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["500", "600"] });

export const metadata: Metadata = {
  title: "WLP PageOps",
  description: "Control de producción de páginas de welovepaving.com",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const actor = (await cookies()).get("pageops_actor")?.value === "Admin" ? "Admin" : "Producción";
  const authed = await isAuthed();
  return (
    <html lang="es" className={`${inter.variable} ${barlow.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-stone-50 font-sans text-stone-900">
        {!authed ? (
          children
        ) : (
        <div className="md:flex">
          <aside className="border-b border-wlp-border-dark bg-wlp-dark px-4 py-4 text-stone-400 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0 md:px-5 md:py-6">
            <div className="mb-4 flex items-center gap-3 md:mb-8">
              <Image src="/wlp-logo.png" alt="We Love Paving" width={52} height={30} priority />
              <div className="leading-none">
                <div className="font-display text-lg font-extrabold tracking-wide text-white uppercase">PageOps</div>
                <div className="mt-1 text-xs text-stone-400">welovepaving.com</div>
              </div>
            </div>
            <Nav />
            <ActorSwitch actor={actor} />
            <a
              href="/respaldo"
              className="mt-6 hidden min-h-9 items-center gap-2 rounded-lg px-3 text-sm text-stone-400 hover:bg-wlp-dark-2 hover:text-white md:flex"
            >
              <Download aria-hidden className="size-4" /> Descargar respaldo
            </a>
            <form action={logout} className="hidden md:block">
              <button
                type="submit"
                className="mt-1 flex min-h-9 w-full items-center gap-2 rounded-lg px-3 text-sm text-stone-400 hover:bg-wlp-dark-2 hover:text-white"
              >
                <LogOut aria-hidden className="size-4" /> Salir
              </button>
            </form>
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
          <Shortcuts />
        </div>
        )}
      </body>
    </html>
  );
}
