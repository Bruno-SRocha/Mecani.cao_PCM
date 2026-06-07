import type { Metadata } from "next";
import Sidebar from "@/components/domain/Sidebar";

export const metadata: Metadata = {
  title: "Calendário de Manutenções — MECÂNI.CÃO PCM",
  description: "Cronograma e planejamento visual de manutenções preventivas.",
};

export default function CalendarioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-x-hidden w-full" style={{ background: "var(--bg-primary)" }}>
        {children}
      </main>
    </div>
  );
}
