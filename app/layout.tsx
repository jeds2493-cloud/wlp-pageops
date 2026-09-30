import type { Metadata } from "next";
import Image from "next/image";
import { Barlow_Semi_Condensed, IBM_Plex_Mono, Inter } from "next/font/google";
import { Nav } from "@/components/nav";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${inter.variable} ${barlow.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-stone-50 font-sans text-stone-900">
        <div className="md:flex">
          <aside className="border-b border-wlp-border-dark bg-wlp-dark px-4 py-4 text-stone-400 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-r md:border-b-0 md:px-5 md:py-6">
            <div className="mb-4 flex items-center gap-3 md:mb-8">
              <Image src="/wlp-logo.png" alt="We Love Paving" width={52} height={30} priority />
              <div className="leading-none">
                <div className="font-display text-lg font-extrabold tracking-wide text-white uppercase">PageOps</div>
                <div className="mt-1 font-mono text-[10px] tracking-[0.12em] text-stone-500 uppercase">welovepaving.com</div>
              </div>
            </div>
            <Nav />
            <p className="mt-8 hidden font-mono text-[10px] leading-relaxed tracking-[0.08em] text-stone-500 uppercase md:block">
              Fase 0 · solo lectura
            </p>
          </aside>
          <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
