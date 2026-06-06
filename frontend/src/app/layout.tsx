/**
 * Layout Raiz — Mecâni.cão PCM
 *
 * Layout principal que envolve todas as páginas da aplicação.
 * Configura a fonte Inter (Google Fonts), metadados SEO e
 * fornece a estrutura HTML base com a classe de fonte global.
 *
 * Atua como Server Component por padrão (Next.js App Router).
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

/* Carrega a fonte Inter com subsets latino e pesos variados */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/* Metadados SEO da aplicação */
export const metadata: Metadata = {
  title: "MECÂNI.CÃO PCM — Gestão de Saúde de Ativos Industriais",
  description:
    "Sistema SaaS de PCM (Planejamento e Controle de Manutenção) para monitoramento de desgaste e saúde de componentes mecânicos industriais.",
  keywords: [
    "PCM",
    "manutenção industrial",
    "gestão de ativos",
    "manutenção preditiva",
    "componentes mecânicos",
  ],
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  if (stored === 'light' || (!stored && window.matchMedia && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('light');
                    document.documentElement.setAttribute('data-theme', 'light');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-surface text-txt-primary">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
