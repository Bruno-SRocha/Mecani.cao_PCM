"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEquipamentoApi } from "@/lib/api/equipamentos";
import type { Equipamento, StatusEquipamento } from "@/types/equipamento.types";
import { deleteComponenteApi } from "@/lib/api/componentes";
import type { ComponenteComDesgaste } from "@/lib/api/componentes";
import ComponenteFormModal from "@/components/domain/ComponenteFormModal";
import ReporteSubstituicaoModal from "@/components/domain/ReporteSubstituicaoModal";
import type { NivelUsuario } from "@/types/usuario.types";
import DiagnosticoTab from "@/components/domain/DiagnosticoTab";
import ModificacoesTab from "@/components/domain/ModificacoesTab";


const statusConfig: Record<StatusEquipamento, { label: string; color: string; bg: string }> = {
  OPERANDO: { label: "Operando", color: "#4ADE80", bg: "rgba(74, 222, 128, 0.1)" },
  PARADO: { label: "Parado", color: "#F87171", bg: "rgba(248, 113, 113, 0.1)" },
  MANUTENCAO: { label: "Manutenção", color: "#FBBF24", bg: "rgba(251, 191, 36, 0.1)" },
};

function calcDesgaste(h: number, v: number) { return v > 0 ? Math.min((h / v) * 100, 100) : 0; }
function desgasteColor(p: number) { return p >= 85 ? "#F87171" : p >= 60 ? "#FBBF24" : "#4ADE80"; }
function desgasteLabel(p: number) { return p >= 85 ? "Crítico" : p >= 60 ? "Atenção" : "Saudável"; }

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function tipoIcon(tipo: string): string {
  const map: Record<string, string> = {
    rolamento: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
    selo_mecanico: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
    mancal: "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375",
    correia: "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
    acoplamento: "M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244",
  };
  return map[tipo] ?? "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z";
}

export default function EquipamentoDetalhesPage() {
  const params = useParams();
  const router = useRouter();
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [activeTab, setActiveTab] = useState<"VISAO_GERAL" | "DIAGNOSTICOS" | "MODIFICACOES">("VISAO_GERAL");
  
  const [userId, setUserId] = useState("");
  const [userNivel, setUserNivel] = useState<NivelUsuario>("TECNICO");
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [editComp, setEditComp] = useState<ComponenteComDesgaste | null>(null);
  const [deleteCompId, setDeleteCompId] = useState<string | null>(null);
  const [reporteModalComp, setReporteModalComp] = useState<ComponenteComDesgaste | null>(null);

  const canWrite = userNivel === "ADMIN" || userNivel === "GESTOR";

  useEffect(() => {
    const stored = localStorage.getItem("usuario");
    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        setUserNivel(parsed.nivel); 
        setUserId(parsed.id);
      } catch { /* noop */ }
    }
  }, []);

  async function fetchEquipamento() {
    setLoading(true);
    try {
      const data = await getEquipamentoApi(params.id as string);
      setEquipamento(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar detalhes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!params.id) return;
    fetchEquipamento();
  }, [params.id]);

  async function handleDeleteComponente() {
    if (!deleteCompId || !equipamento) return;
    try {
      await deleteComponenteApi(equipamento.id, deleteCompId);
      setDeleteCompId(null);
      fetchEquipamento();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao remover componente.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <svg className="w-8 h-8 animate-spin" style={{ color: "#E8842C" }} fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
    );
  }

  if (erro || !equipamento) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm" style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#FCA5A5" }}>
          {erro || "Equipamento não encontrado."}
        </div>
        <button onClick={() => router.push("/equipamentos")} className="mt-4 text-[14px] cursor-pointer" style={{ color: "#E8842C" }}>
          ← Voltar para a listagem
        </button>
      </div>
    );
  }

  const st = statusConfig[equipamento.status];

  return (
    <div className="w-full px-10 py-10 animate-fade-in-up" style={{ animationFillMode: "both" }}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-8 text-[13px]">
        <button onClick={() => router.push("/equipamentos")} className="transition-colors duration-200 cursor-pointer hover:underline" style={{ color: "#64748B" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#E8842C"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#64748B"; }}>
          Equipamentos
        </button>
        <span style={{ color: "#334155" }}>/</span>
        <span style={{ color: "#94A3B8" }}>{equipamento.tag}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-md text-[13px] font-bold tracking-wider" style={{ background: "rgba(26, 122, 138, 0.1)", color: "#22A0B4", border: "1px solid rgba(26, 122, 138, 0.2)" }}>
              {equipamento.tag}
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold" style={{ background: st.bg, color: st.color }}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: st.color }} />
              {st.label}
            </span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight mb-2" style={{ color: "#F1F5F9" }}>
            {equipamento.nome}
          </h1>
          <p className="text-[16px]" style={{ color: "#64748B" }}>{equipamento.tipo}</p>
        </div>
        <button onClick={() => router.push("/equipamentos")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer"
          style={{ color: "#94A3B8", background: "rgba(148, 163, 184, 0.06)", border: "1px solid rgba(148, 163, 184, 0.1)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Voltar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b mb-8" style={{ borderColor: "rgba(148, 163, 184, 0.1)" }}>
        <button
          onClick={() => setActiveTab("VISAO_GERAL")}
          className={`pb-4 text-[14px] font-semibold transition-all cursor-pointer relative ${activeTab === "VISAO_GERAL" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          Visão Geral & Componentes
          {activeTab === "VISAO_GERAL" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A7A8A]" />}
        </button>
        <button
          onClick={() => setActiveTab("DIAGNOSTICOS")}
          className={`pb-4 text-[14px] font-semibold transition-all cursor-pointer relative ${activeTab === "DIAGNOSTICOS" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          Diagnóstico
          {activeTab === "DIAGNOSTICOS" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A7A8A]" />}
        </button>
        <button
          onClick={() => setActiveTab("MODIFICACOES")}
          className={`pb-4 text-[14px] font-semibold transition-all cursor-pointer relative ${activeTab === "MODIFICACOES" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
        >
          Modificações & BOM
          {activeTab === "MODIFICACOES" && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A7A8A]" />}
        </button>
      </div>

      {activeTab === "VISAO_GERAL" ? (
        <>
          {/* Info cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
            {[
              { label: "Fabricante", value: equipamento.fabricante },
              { label: "Modelo", value: equipamento.modelo },
              { label: "Nº Série", value: equipamento.numeroSerie || "—" },
              { label: "Instalação", value: formatDate(equipamento.dataInstalacao) },
            ].map(item => (
              <div key={item.label} className="glass-card px-6 py-5" style={{ borderRadius: "14px" }}>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#475569" }}>{item.label}</p>
                <p className="text-[16px] font-semibold" style={{ color: "#F1F5F9" }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Location + Description */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-10">
            <div className="glass-card px-6 py-5" style={{ borderRadius: "14px" }}>
              <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#475569" }}>Localização</p>
              <p className="text-[16px] font-medium" style={{ color: "#F1F5F9" }}>{equipamento.localizacao}</p>
            </div>
            {equipamento.descricao && (
              <div className="glass-card px-6 py-5" style={{ borderRadius: "14px" }}>
                <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#475569" }}>Descrição</p>
                <p className="text-[14px] leading-relaxed" style={{ color: "#94A3B8" }}>{equipamento.descricao}</p>
              </div>
            )}
          </div>

          {/* Componentes Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-7">
              <div className="flex items-center gap-3">
                <div className="w-5 h-[3px] rounded-full" style={{ background: "#1A7A8A" }} />
                <h2 className="text-[22px] font-bold" style={{ color: "#F1F5F9" }}>Componentes Mecânicos</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "rgba(26, 122, 138, 0.1)", color: "#22A0B4" }}>
                  {equipamento.componentes.length}
                </span>
              </div>
              {canWrite && (
                <button
                  onClick={() => { setEditComp(null); setCompModalOpen(true); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all duration-200 cursor-pointer"
                  style={{ background: "#1A7A8A", boxShadow: "0 4px 12px rgba(26, 122, 138, 0.25)" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#15636F"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "#1A7A8A"; }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Novo Componente
                </button>
              )}
            </div>

            {equipamento.componentes.length === 0 ? (
              <div className="glass-card flex flex-col items-center justify-center py-12 text-center" style={{ borderRadius: "12px" }}>
                <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="#334155" strokeWidth={0.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                </svg>
                <p className="text-[15px] font-medium" style={{ color: "#94A3B8" }}>Nenhum componente cadastrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {equipamento.componentes.map((comp, i) => {
                  const desgaste = calcDesgaste(comp.horasOperacionais, comp.vidaUtilNominal);
                  const cor = desgasteColor(desgaste);
                  const label = desgasteLabel(desgaste);

                  return (
                    <div
                      key={comp.id}
                      className="glass-card px-6 py-5 flex items-center gap-6 animate-fade-in-up"
                      style={{ borderRadius: "12px", animationDelay: `${i * 0.08}s`, animationFillMode: "both", borderLeft: `3px solid ${cor}` }}
                    >
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${cor}12` }}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={cor} strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={tipoIcon(comp.tipo)} />
                        </svg>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-[16px] font-semibold truncate" style={{ color: "#F1F5F9" }}>{comp.nome}</h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider shrink-0" style={{ background: `${cor}15`, color: cor }}>
                            {label}
                          </span>
                          {comp.modificado && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ background: "rgba(34, 160, 180, 0.15)", color: "#22A0B4", border: "1px solid rgba(34, 160, 180, 0.3)" }}>
                              <svg className="w-3 h-3 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 21l8.982-11.795H14l1-7L6 14.09h3.813Z" />
                              </svg>
                              Modificado
                            </span>
                          )}
                        </div>
                        <p className="text-[13px] mt-1" style={{ color: "#64748B" }}>
                          Tipo: <span style={{ color: "#94A3B8" }}>{comp.tipo.replace(/_/g, " ")}</span>
                        </p>
                      </div>

                      {/* Hours info */}
                      <div className="text-right shrink-0 mr-6">
                        <p className="text-[12px] mb-1" style={{ color: "#475569" }}>Horas Operacionais</p>
                        <p className="text-[16px] font-bold" style={{ color: "#F1F5F9" }}>
                          {comp.horasOperacionais.toLocaleString("pt-BR")} <span className="text-[11px] font-normal" style={{ color: "#64748B" }}>/ {comp.vidaUtilNominal.toLocaleString("pt-BR")} h</span>
                        </p>
                      </div>

                      {/* Wear bar and actions */}
                      <div className="flex items-center gap-6 shrink-0">
                        <div className="w-36">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold" style={{ color: cor }}>{desgaste.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-2 rounded-full" style={{ background: "rgba(148, 163, 184, 0.1)" }}>
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${desgaste}%`, background: cor }} />
                          </div>
                        </div>

                        {/* Botão Substituir — disponível para todos os perfis */}
                        <div className="border-l pl-6" style={{ borderColor: "rgba(148, 163, 184, 0.1)" }}>
                          <button
                            onClick={() => setReporteModalComp(comp as ComponenteComDesgaste)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-200 cursor-pointer text-[12px] font-semibold"
                            style={{
                              background: "rgba(232, 132, 44, 0.08)",
                              color: "#E8842C",
                              border: "1px solid rgba(232, 132, 44, 0.2)",
                            }}
                            title="Registrar substituição de componente"
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(232, 132, 44, 0.18)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(232, 132, 44, 0.08)"; }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                            </svg>
                            Substituir
                          </button>
                        </div>

                        {canWrite && (
                          <div className="flex items-center gap-2 border-l pl-6" style={{ borderColor: "rgba(148, 163, 184, 0.1)" }}>
                            <button
                              onClick={() => { setEditComp(comp as ComponenteComDesgaste); setCompModalOpen(true); }}
                              className="p-2 rounded-md transition-all duration-200 cursor-pointer"
                              style={{ color: "#94A3B8" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(232, 132, 44, 0.1)"; e.currentTarget.style.color = "#E8842C"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteCompId(comp.id)}
                              className="p-2 rounded-md transition-all duration-200 cursor-pointer"
                              style={{ color: "#94A3B8" }}
                              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.color = "#F87171"; }}
                              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#94A3B8"; }}
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : activeTab === "DIAGNOSTICOS" ? (
        <DiagnosticoTab 
          equipamentoId={equipamento.id} 
          userNivel={userNivel}
          userId={userId}
        />
      ) : (
        <ModificacoesTab
          equipamentoId={equipamento.id}
          userNivel={userNivel}
          userId={userId}
          componentes={equipamento.componentes as ComponenteComDesgaste[]}
          onBOMUpdated={fetchEquipamento}
        />
      )}

      {/* Delete Component Modal */}
      {deleteCompId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="glass-card p-8 max-w-md w-full mx-4" style={{ background: "#111D35" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#F87171" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
                </svg>
              </div>
              <h3 className="text-[18px] font-bold" style={{ color: "#F1F5F9" }}>Confirmar exclusão</h3>
            </div>
            <p className="text-[14px] mb-6" style={{ color: "#94A3B8" }}>
              Tem certeza que deseja remover este componente? O histórico de horas e desgaste será perdido.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteCompId(null)}
                className="px-5 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-200"
                style={{ color: "#94A3B8", background: "rgba(148, 163, 184, 0.08)", border: "1px solid rgba(148, 163, 184, 0.15)" }}>
                Cancelar
              </button>
              <button onClick={handleDeleteComponente}
                className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all duration-200"
                style={{ background: "#EF4444" }}>
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Componente Modal */}
      {compModalOpen && (
        <ComponenteFormModal
          equipamentoId={equipamento.id}
          componente={editComp}
          onClose={() => { setCompModalOpen(false); setEditComp(null); }}
          onSaved={() => { setCompModalOpen(false); setEditComp(null); fetchEquipamento(); }}
        />
      )}
      {/* Reporte de Substituição Modal */}
      {reporteModalComp && equipamento && (
        <ReporteSubstituicaoModal
          equipamentoId={equipamento.id}
          componente={reporteModalComp}
          onClose={() => setReporteModalComp(null)}
          onSaved={() => { setReporteModalComp(null); }}
        />
      )}
    </div>
  );
}
