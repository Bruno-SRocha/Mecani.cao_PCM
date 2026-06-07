import type { Metadata } from "next";
import Sidebar from "@/components/domain/Sidebar";

export const metadata: Metadata = {
  title: "Gestão de Usuários — MECÂNI.CÃO PCM",
  description: "Cadastro e gerenciamento de acessos de colaboradores à plataforma.",
};

export default function UsuariosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen font-sans" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-x-hidden w-full" style={{ background: "var(--bg-primary)" }}>
        {children}
      </main>
    </div>
  );
}
