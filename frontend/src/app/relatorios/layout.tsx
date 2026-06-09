import type { Metadata } from "next";
import Sidebar from "@/components/domain/Sidebar";

export const metadata: Metadata = {
  title: "Relatórios & BI — MECÂNI.CÃO PCM",
  description: "Painel analítico do PCM contendo indicadores estratégicos, MTBF, MTTR e custos.",
};

export default function RelatoriosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-x-hidden w-full" style={{ background: "var(--bg-primary)" }}>
        {children}
      </main>
    </div>
  );
}
