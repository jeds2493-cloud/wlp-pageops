import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WLP PageOps",
  description: "Control de producción de páginas de welovepaving.com",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-stone-50 text-stone-900">
        <div className="md:flex">
          <aside className="border-b border-stone-200 bg-stone-50 px-4 py-3 md:sticky md:top-0 md:h-screen md:w-56 md:shrink-0 md:border-r md:border-b-0 md:py-5">
            <div className="mb-3 flex items-center gap-2 md:mb-6">
              <span className="grid size-6 place-items-center rounded bg-[#F2C230] text-[11px] font-bold text-stone-900">
                W
              </span>
              <span className="text-sm font-semibold">WLP PageOps</span>
            </div>
            <Nav />
            <p className="mt-6 hidden text-[11px] leading-snug text-stone-400 md:block">
              Fase 0 · solo lectura con los datos de la hoja
            </p>
          </aside>
          <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
            <div className="mx-auto max-w-6xl">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
