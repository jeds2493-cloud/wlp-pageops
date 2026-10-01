import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
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
        <>
          <header className="sticky top-0 z-30 border-b border-wlp-border-dark bg-wlp-dark text-stone-400">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 px-4 py-1.5 md:px-10">
              <Link href="/" className="flex items-center gap-2.5" aria-label="WLP PageOps, inicio">
                <Image src="/wlp-logo.png" alt="" width={44} height={25} priority />
                <span className="font-display text-lg font-extrabold tracking-wide text-white uppercase">PageOps</span>
              </Link>
              <div className="order-last w-full md:order-none md:w-auto md:flex-1">
                <Nav />
              </div>
              <div className="ml-auto flex items-center gap-1">
                <ActorSwitch actor={actor} />
                <a
                  href="/respaldo"
                  title="Descargar respaldo"
                  aria-label="Descargar respaldo"
                  className="ml-2 grid size-9 place-items-center rounded-lg hover:bg-wlp-dark-2 hover:text-white"
                >
                  <Download aria-hidden className="size-4" />
                </a>
                <form action={logout}>
                  <button
                    type="submit"
                    title="Salir"
                    aria-label="Salir"
                    className="grid size-9 place-items-center rounded-lg hover:bg-wlp-dark-2 hover:text-white"
                  >
                    <LogOut aria-hidden className="size-4" />
                  </button>
                </form>
              </div>
            </div>
          </header>
          <main className="min-w-0">{children}</main>
          <Shortcuts />
        </>
        )}
      </body>
    </html>
  );
}
