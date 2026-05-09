import type { Metadata } from "next";
import Sidebar from "@/components/domain/Sidebar";

export const metadata: Metadata = {
  title: "Dashboard — MECÂNI.CÃO PCM",
  description: "Painel de saúde de ativos industriais.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "#0C1322" }}>
      <Sidebar />
      <main className="flex-1 min-h-screen overflow-x-hidden w-full" style={{ background: "#0C1322" }}>
        {children}
      </main>
    </div>
  );
}
