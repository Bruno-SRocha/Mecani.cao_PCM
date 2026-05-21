import type { Metadata } from "next";
import Sidebar from "@/components/domain/Sidebar";

export const metadata: Metadata = {
  title: "Aprovações — MECÂNI.CÃO PCM",
  description: "Fila de aprovação de reportes de substituição de componentes mecânicos.",
};

export default function AprovacoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen" style={{ background: "#0C1322" }}>
      <Sidebar />
      <main
        className="flex-1 min-h-screen overflow-x-hidden w-full"
        style={{ background: "#0C1322" }}
      >
        {children}
      </main>
    </div>
  );
}
