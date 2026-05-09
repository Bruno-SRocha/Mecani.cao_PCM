/**
 * Layout: Área Privada (Equipamentos, Dashboard, etc.)
 *
 * Layout compartilhado para todas as páginas autenticadas.
 * Inclui a Sidebar (menu lateral) e a área de conteúdo principal.
 *
 * A Sidebar ocupa 260px fixos à esquerda, e o conteúdo principal
 * preenche o restante da tela com padding responsivo.
 *
 * Este layout é um Server Component — a sidebar é um Client Component
 * importado como "use client" para gerenciar estado de navegação.
 */

import type { Metadata } from "next";
import Sidebar from "@/components/domain/Sidebar";

export const metadata: Metadata = {
  title: "Equipamentos — MECÂNI.CÃO PCM",
  description: "Gestão de equipamentos industriais e componentes mecânicos.",
};

export default function EquipamentosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: "#0C1322" }}>
      {/* Sidebar — menu lateral fixo */}
      <Sidebar />

      {/* Área de conteúdo principal — offset pela largura da sidebar */}
      <main
        className="flex-1 min-h-screen overflow-x-hidden w-full"
        style={{ background: "#0C1322" }}
      >
        {children}
      </main>
    </div>
  );
}
