"use client";

import { useEffect, useState, useCallback } from "react";
import {
  listAllReportesApi,
  aprovarReporteApi,
  rejeitarReporteApi,
  type ReporteSubstituicao,
  type StatusReporte,
} from "@/lib/api/reportes-substituicao";
import {
  listAllModificacoesApi,
  iniciarImplementacaoModificacaoApi,
  finalizarModificacaoApi,
  type SolicitacaoModificacao,
  type StatusModificacao,
  type TipoModificacao,
} from "@/lib/api/solicitacoes-modificacao";

/* ── Configuração visual dos status ─────────────────────────── */
const statusConfig: Record<
  StatusReporte,
  { label: string; color: string; bg: string; border: string }
> = {
  AGUARDANDO_APROVACAO: {
    label: "Aguardando Aprovação",
    color: "var(--yellow-badge)",
    bg: "var(--yellow-badge-bg)",
    border: "var(--yellow-badge-border)",
  },
  APROVADO: {
    label: "Aprovado",
    color: "var(--green-badge)",
    bg: "var(--green-badge-bg)",
    border: "var(--green-badge-border)",
  },
  REJEITADO: {
    label: "Rejeitado",
    color: "var(--red-badge)",
    bg: "var(--red-badge-bg)",
    border: "var(--red-badge-border)",
  },
};

const statusModConfig: Record<
  StatusModificacao,
  { label: string; color: string; bg: string; border: string }
> = {
  PENDENTE: {
    label: "Pendente",
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.1)",
    border: "rgba(56, 189, 248, 0.2)",
  },
  EM_IMPLEMENTACAO: {
    label: "Em Implementação",
    color: "#FBBF24",
    bg: "rgba(251, 191, 36, 0.1)",
    border: "rgba(251, 191, 36, 0.2)",
  },
  CONCLUIDO: {
    label: "Concluído",
    color: "#34D399",
    bg: "rgba(52, 211, 153, 0.1)",
    border: "rgba(52, 211, 153, 0.2)",
  },
};

const tipoConfig: Record<TipoModificacao, { label: string; cor: string }> = {
  ADICAO: { label: "Adição", cor: "#10B981" },
  SUBSTITUICAO_TECNOLOGIA: { label: "Substituição", cor: "#F59E0B" },
  REMOCAO: { label: "Remoção", cor: "#EF4444" },
};

import { formatToBrasilia, formatToBrasiliaDate } from "@/lib/time";

function formatDate(d: string | null) {
  if (!d) return "—";
  return formatToBrasiliaDate(d);
}

function formatDatetime(d: string | null) {
  if (!d) return "—";
  return `${formatToBrasilia(d)} BRT`;
}

export default function AprovacoesPage() {
  const [activeTab, setActiveTab] = useState<"SUBSTITUICOES" | "MODIFICACOES">("SUBSTITUICOES");
  
  // Data lists
  const [reportes, setReportes] = useState<ReporteSubstituicao[]>([]);
  const [modificacoes, setModificacoes] = useState<SolicitacaoModificacao[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [filter, setFilter] = useState<string>("AGUARDANDO_APROVACAO");

  /* Rejeição modal (Reportes) */
  const [rejeitarId, setRejeitarId] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  
  /* Homologação/Parecer modal (Modificações) */
  const [concluirModId, setConcluirModId] = useState<string | null>(null);
  const [parecerTexto, setParecerTexto] = useState("");
  
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const [repData, modData] = await Promise.all([
        listAllReportesApi(),
        listAllModificacoesApi(),
      ]);
      setReportes(repData);
      setModificacoes(modData);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Tab Switch
  const handleTabChange = (tab: "SUBSTITUICOES" | "MODIFICACOES") => {
    setActiveTab(tab);
    setFilter(tab === "SUBSTITUICOES" ? "AGUARDANDO_APROVACAO" : "PENDENTE");
  };

  // Reporte actions
  async function handleAprovarReporte(id: string) {
    setActionLoading(id);
    try {
      await aprovarReporteApi(id);
      await fetchData();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao aprovar.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejeitarReporte() {
    if (!rejeitarId || !motivoRejeicao.trim()) return;
    setActionLoading(rejeitarId);
    try {
      await rejeitarReporteApi(rejeitarId, motivoRejeicao.trim());
      setRejeitarId(null);
      setMotivoRejeicao("");
      await fetchData();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao rejeitar.");
    } finally {
      setActionLoading(null);
    }
  }

  // Modificação actions
  async function handleIniciarModificacao(id: string) {
    setActionLoading(id);
    try {
      await iniciarImplementacaoModificacaoApi(id);
      await fetchData();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao iniciar modificação.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConcluirModificacao() {
    if (!concluirModId) return;
    setActionLoading(concluirModId);
    try {
      await finalizarModificacaoApi(concluirModId, {
        parecerEngenharia: parecerTexto.trim(),
      });
      setConcluirModId(null);
      setParecerTexto("");
      await fetchData();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao concluir modificação.");
    } finally {
      setActionLoading(null);
    }
  }

  // Filter calculations
  const filteredReportes = reportes.filter((r) =>
    filter === "TODOS" ? true : r.status === filter
  );

  const filteredModificacoes = modificacoes.filter((m) =>
    filter === "TODOS" ? true : m.status === filter
  );

  const pendingReportesCount = reportes.filter(
    (r) => r.status === "AGUARDANDO_APROVACAO"
  ).length;

  const pendingModificacoesCount = modificacoes.filter(
    (m) => m.status === "PENDENTE"
  ).length;

  const activePendingCount =
    activeTab === "SUBSTITUICOES" ? pendingReportesCount : pendingModificacoesCount;

  // Filter Chips Configuration
  const filterOptions =
    activeTab === "SUBSTITUICOES"
      ? [
          { value: "AGUARDANDO_APROVACAO", label: "Pendentes", count: pendingReportesCount },
          { value: "APROVADO", label: "Aprovados", count: reportes.filter((r) => r.status === "APROVADO").length },
          { value: "REJEITADO", label: "Rejeitados", count: reportes.filter((r) => r.status === "REJEITADO").length },
          { value: "TODOS", label: "Todos", count: reportes.length },
        ]
      : [
          { value: "PENDENTE", label: "Pendentes", count: pendingModificacoesCount },
          { value: "EM_IMPLEMENTACAO", label: "Em Implementação", count: modificacoes.filter((m) => m.status === "EM_IMPLEMENTACAO").length },
          { value: "CONCLUIDO", label: "Concluídos", count: modificacoes.filter((m) => m.status === "CONCLUIDO").length },
          { value: "TODOS", label: "Todos", count: modificacoes.length },
        ];

  return (
    <div className="page-container animate-fade-in-up" style={{ animationFillMode: "both" }}>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-[3px] rounded-full" style={{ background: "var(--orange)" }} />
            <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-orange">
              Gestão de Manutenção
            </span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight mb-2 text-txt-primary">
            Aprovações
          </h1>
          <p className="text-[15px] text-txt-muted">
            {activeTab === "SUBSTITUICOES"
              ? "Reportes de substituição de componentes aguardando decisão."
              : "Solicitações de modificação técnica e evolução de BOM."}
          </p>
        </div>

        {activePendingCount > 0 && (
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{
              background: "var(--yellow-badge-bg)",
              border: "1px solid var(--yellow-badge-border)",
              color: "var(--yellow-badge)",
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            {activePendingCount} aguardando aprovação
          </div>
        )}
      </div>

      {/* ── Tabs (Substituições vs Modificações) ── */}
      <div className="flex gap-6 border-b border-slate-800 mb-6">
        <button
          onClick={() => handleTabChange("SUBSTITUICOES")}
          className={`pb-3 text-[15px] font-bold transition-all relative cursor-pointer ${
            activeTab === "SUBSTITUICOES" ? "text-txt-primary" : "text-txt-muted hover:text-txt-primary"
          }`}
        >
          Substituição de Peças
          {activeTab === "SUBSTITUICOES" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: "var(--orange)" }} />
          )}
        </button>
        <button
          onClick={() => handleTabChange("MODIFICACOES")}
          className={`pb-3 text-[15px] font-bold transition-all relative cursor-pointer ${
            activeTab === "MODIFICACOES" ? "text-txt-primary" : "text-txt-muted hover:text-txt-primary"
          }`}
        >
          Modificação de Projeto (BOM)
          {activeTab === "MODIFICACOES" && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: "var(--orange)" }} />
          )}
        </button>
      </div>

      {/* ── Filtros ── */}
      <div className="flex items-center gap-3 mb-6">
        {filterOptions.map((opt) => {
          const isActive = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`filter-chip ${isActive ? "active" : ""}`}
            >
              {opt.label}
              <span
                className="px-1.5 py-0.5 rounded-full text-[11px] font-bold"
                style={{
                  background: isActive ? "rgba(232,132,44,0.2)" : "rgba(148, 163, 184, 0.1)",
                  color: isActive ? "var(--orange)" : "var(--text-secondary)",
                }}
              >
                {opt.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Erro ── */}
      {erro && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-6"
          style={{
            background: "var(--red-badge-bg)",
            border: "1px solid var(--red-badge-border)",
            color: "var(--red-badge)",
          }}
        >
          {erro}
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="w-8 h-8 animate-spin" style={{ color: "var(--orange)" }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : activeTab === "SUBSTITUICOES" ? (
        /* ── Lista: Substituição de Peças ── */
        filteredReportes.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 text-center" style={{ borderRadius: "16px" }}>
            <svg className="w-14 h-14 mb-4" fill="none" viewBox="0 0 24 24" stroke="#334155" strokeWidth={0.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <p className="text-[16px] font-medium text-txt-secondary">
              Nenhum reporte encontrado.
            </p>
          </div>
        ) : (
          <div className="list-items-lg">
            {filteredReportes.map((reporte, i) => {
              const st = statusConfig[reporte.status];
              const isPending = reporte.status === "AGUARDANDO_APROVACAO";
              const isActioning = actionLoading === reporte.id;

              return (
                <div
                  key={reporte.id}
                  className="glass-card p-6 animate-fade-in-up"
                  style={{
                    borderRadius: "14px",
                    animationDelay: `${i * 0.06}s`,
                    animationFillMode: "both",
                    borderLeft: `3px solid ${st.color}`,
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2.5 flex-wrap">
                        <span
                          className="px-2.5 py-1 rounded-full text-[12px] font-semibold"
                          style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                        >
                          {st.label}
                        </span>
                        <span className="text-[13px] text-txt-muted">
                          Criado em {formatDatetime(reporte.criadoEm)}
                        </span>
                      </div>

                      <h3 className="text-[18px] font-bold mb-1.5 text-txt-primary">
                        {reporte.pecaInstalada}
                      </h3>
                      <p className="text-[14px] text-txt-muted">
                        Vida útil da nova peça:{" "}
                        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                          {reporte.vidaUtilNovaPeca.toLocaleString("pt-BR")} h
                        </span>
                        {" · "}Data da troca:{" "}
                        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                          {formatDate(reporte.dataSubstituicao)}
                        </span>
                      </p>
                    </div>

                    {/* Actions */}
                    {isPending && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleAprovarReporte(reporte.id)}
                          disabled={isActioning}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 cursor-pointer"
                          style={{
                            background: "var(--green-badge-bg)",
                            color: "var(--green-badge)",
                            border: "1px solid var(--green-badge-border)",
                            opacity: isActioning ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!isActioning) e.currentTarget.style.background = "var(--green-badge-border)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--green-badge-bg)";
                          }}
                        >
                          {isActioning ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                          )}
                          Aprovar
                        </button>
                        <button
                          onClick={() => {
                            setRejeitarId(reporte.id);
                            setMotivoRejeicao("");
                          }}
                          disabled={isActioning}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 cursor-pointer"
                          style={{
                            background: "var(--red-badge-bg)",
                            color: "var(--red-badge)",
                            border: "1px solid var(--red-badge-border)",
                            opacity: isActioning ? 0.6 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!isActioning) e.currentTarget.style.background = "var(--red-badge-border)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--red-badge-bg)";
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                          Rejeitar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Info cards row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Equipamento */}
                    <div className="info-sub-card">
                      <p className="text-[11px] uppercase tracking-widest mb-1.5 text-txt-muted">Equipamento</p>
                      <p className="text-[14px] font-semibold truncate text-txt-primary">
                        {reporte.equipamento?.nome ?? "—"}
                      </p>
                      <p className="text-[12px] mt-0.5 text-txt-muted">
                        {reporte.equipamento?.tag ?? ""}
                      </p>
                    </div>

                    {/* Componente */}
                    <div className="info-sub-card">
                      <p className="text-[11px] uppercase tracking-widest mb-1.5 text-txt-muted">Componente</p>
                      <p className="text-[14px] font-semibold truncate text-txt-primary">
                        {reporte.componente?.nome ?? "—"}
                      </p>
                      <p className="text-[12px] mt-0.5 text-txt-muted">
                        {reporte.componente?.tipo?.replace(/_/g, " ") ?? ""}
                      </p>
                    </div>

                    {/* Técnico */}
                    <div className="info-sub-card">
                      <p className="text-[11px] uppercase tracking-widest mb-1.5 text-txt-muted">Técnico</p>
                      <p className="text-[14px] font-semibold truncate text-txt-primary">
                        {reporte.tecnico?.nome ?? "—"}
                      </p>
                      <p className="text-[12px] mt-0.5 text-txt-muted">
                        {reporte.tecnico?.nomeUsuario ?? ""}
                      </p>
                    </div>

                    {/* Aprovador ou Status */}
                    <div className="info-sub-card">
                      <p className="text-[11px] uppercase tracking-widest mb-1.5 text-txt-muted">
                        {reporte.status === "AGUARDANDO_APROVACAO" ? "Localização" : "Decidido por"}
                      </p>
                      {reporte.status === "AGUARDANDO_APROVACAO" ? (
                        <p className="text-[14px] font-semibold truncate text-txt-primary">
                          {reporte.equipamento?.localizacao ?? "—"}
                        </p>
                      ) : (
                        <>
                          <p className="text-[14px] font-semibold truncate text-txt-primary">
                            {reporte.aprovador?.nome ?? "—"}
                          </p>
                          <p className="text-[12px] mt-0.5 text-txt-muted">
                            {formatDate(reporte.decididoEm)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Observações */}
                  {reporte.observacoes && (
                    <div
                      className="mt-4 px-4 py-3 rounded-lg text-[13px]"
                      style={{
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <span className="font-semibold text-txt-muted">Obs: </span>
                      {reporte.observacoes}
                    </div>
                  )}

                  {/* Motivo rejeição */}
                  {reporte.status === "REJEITADO" && reporte.motivoRejeicao && (
                    <div
                      className="mt-4 px-4 py-3 rounded-lg text-[13px] flex items-start gap-2"
                      style={{
                        background: "var(--red-badge-bg)",
                        border: "1px solid var(--red-badge-border)",
                        color: "var(--red-badge)",
                      }}
                    >
                      <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                      <span>
                        <span className="font-semibold">Motivo da rejeição: </span>
                        {reporte.motivoRejeicao}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── Lista: Modificação de Projeto (BOM) ── */
        filteredModificacoes.length === 0 ? (
          <div className="glass-card flex flex-col items-center justify-center py-16 text-center" style={{ borderRadius: "16px" }}>
            <svg className="w-14 h-14 mb-4" fill="none" viewBox="0 0 24 24" stroke="#334155" strokeWidth={0.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
            <p className="text-[16px] font-medium text-txt-secondary">
              Nenhuma solicitação de modificação encontrada.
            </p>
          </div>
        ) : (
          <div className="list-items-lg">
            {filteredModificacoes.map((mod, i) => {
              const st = statusModConfig[mod.status];
              const tp = tipoConfig[mod.tipoModificacao];
              const isPending = mod.status === "PENDENTE";
              const isImplementing = mod.status === "EM_IMPLEMENTACAO";
              const isActioning = actionLoading === mod.id;

              return (
                <div
                  key={mod.id}
                  className="glass-card p-6 animate-fade-in-up flex flex-col gap-5"
                  style={{
                    borderRadius: "14px",
                    animationDelay: `${i * 0.06}s`,
                    animationFillMode: "both",
                    borderLeft: `3px solid ${st.color}`,
                  }}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-4 flex-wrap md:flex-nowrap border-b border-slate-800/60 pb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span
                          className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
                          style={{ background: `${tp.cor}15`, color: tp.cor }}
                        >
                          {tp.label}
                        </span>
                        <span
                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold animate-pulse-badge"
                          style={{ background: st.bg, color: st.color }}
                        >
                          {st.label}
                        </span>
                        <span className="text-[13px] text-txt-muted">
                          Solicitada por <span className="font-semibold text-slate-300">{mod.solicitante?.nome ?? "—"}</span> em {formatDatetime(mod.criadoEm)}
                        </span>
                      </div>
                      
                      <h3 className="text-[18px] font-bold text-txt-primary">
                        {mod.equipamento?.nome ?? "—"} ({mod.equipamento?.tag ?? "Sem Tag"})
                      </h3>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending && (
                        <button
                          onClick={() => handleIniciarModificacao(mod.id)}
                          disabled={isActioning}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-bold text-white transition-all cursor-pointer bg-sky-600 hover:bg-sky-500"
                        >
                          {isActioning ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : null}
                          Iniciar Implementação
                        </button>
                      )}

                      {(isPending || isImplementing) && (
                        <button
                          onClick={() => {
                            setConcluirModId(mod.id);
                            setParecerTexto("");
                          }}
                          disabled={isActioning}
                          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-[13px] font-bold text-white transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-500"
                        >
                          Concluir e Aprovar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Workflow Comparison Antes vs Depois */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ANTES */}
                    <div className="bg-[#0B1121]/50 p-4 rounded-xl border border-slate-900 flex flex-col gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        Antes (BOM Original)
                      </p>
                      {mod.tipoModificacao === "ADICAO" ? (
                        <div className="flex-1 flex items-center justify-center py-6 text-slate-500 text-[13px] italic">
                          [ Sem componente - Nova Adição ]
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-[15px] font-bold text-slate-300">
                            {mod.componenteSaida ? mod.componenteSaida.nome : `Peça ID: ${mod.componenteSaidaId}`}
                          </h4>
                          <div className="text-[12px] text-slate-400 mt-2 space-y-1">
                            <p>
                              Tipo: <span className="text-slate-300 uppercase">{mod.componenteSaida?.tipo.replace(/_/g, " ")}</span>
                            </p>
                            <p>
                              Vida Nominal: <span className="text-slate-300">{mod.componenteSaida?.vidaUtilNominal.toLocaleString()} h</span>
                            </p>
                            <p>
                              Horas Operadas: <span className="text-slate-300">{mod.componenteSaida?.horasOperacionais.toLocaleString()} h</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* DEPOIS */}
                    <div className="bg-[#0B1121]/50 p-4 rounded-xl border border-slate-900 flex flex-col gap-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#22A0B4]">
                        Depois (BOM Proposta)
                      </p>
                      {mod.tipoModificacao === "REMOCAO" ? (
                        <div className="flex-1 flex items-center justify-center py-6 text-red-400/80 text-[13px] font-semibold">
                          ⚠️ Componente Removido da Ficha Técnica
                        </div>
                      ) : (
                        <div>
                          {mod.status === "CONCLUIDO" && mod.componenteEntrada ? (
                            <h4 className="text-[15px] font-bold text-white flex items-center gap-1.5">
                              {mod.componenteEntrada.nome}
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-teal-500/10 text-teal-400 border border-teal-500/20">
                                BOM Ativa
                              </span>
                            </h4>
                          ) : (
                            <h4 className="text-[15px] font-bold text-emerald-400 font-mono">
                              {mod.novoComponenteNome} (Proposto)
                            </h4>
                          )}
                          <div className="text-[12px] text-slate-400 mt-2 space-y-1">
                            <p>
                              Tipo:{" "}
                              <span className="text-slate-300 uppercase">
                                {mod.status === "CONCLUIDO" && mod.componenteEntrada
                                  ? mod.componenteEntrada.tipo.replace(/_/g, " ")
                                  : mod.novoComponenteTipo?.replace(/_/g, " ")}
                              </span>
                            </p>
                            <p>
                              Vida Nominal:{" "}
                              <span className="text-slate-300">
                                {mod.status === "CONCLUIDO" && mod.componenteEntrada
                                  ? mod.componenteEntrada.vidaUtilNominal.toLocaleString()
                                  : mod.novoComponenteVidaUtilNominal?.toLocaleString()}{" "}
                                h
                              </span>
                            </p>
                            <p>
                              Horas Iniciais: <span className="text-slate-300">0 h (Nova)</span>
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Justificativa */}
                  <div className="bg-[#0B1121]/30 p-4 rounded-xl border border-slate-900/60">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                      Justificativa Técnica da Solicitação
                    </p>
                    <p className="text-[13px] text-slate-300 italic">
                      "{mod.justificativa}"
                    </p>
                  </div>

                  {/* Parecer Técnico */}
                  {mod.parecerEngenharia && (
                    <div className="bg-teal-950/10 p-4 rounded-xl border border-teal-900/30">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#22A0B4] mb-1">
                        Parecer Técnico da Engenharia / Finalização
                      </p>
                      <p className="text-[13px] text-slate-300 leading-relaxed">
                        {mod.parecerEngenharia}
                      </p>
                      {mod.dataImplementacao && (
                        <p className="text-[11px] text-teal-500 mt-2 font-medium">
                          Homologado em: {formatDatetime(mod.dataImplementacao)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Modal de Rejeição (Reportes) ── */}
      {rejeitarId && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setRejeitarId(null)}
        >
          <div
            className="glass-card p-8 max-w-md w-full mx-4 animate-fade-in-up"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", animationDuration: "0.2s" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "var(--red-badge-bg)" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="var(--red-badge)" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-txt-primary">
                  Rejeitar Reporte
                </h3>
                <p className="text-[13px] text-txt-muted">
                  Informe o motivo da rejeição.
                </p>
              </div>
            </div>

            <textarea
              value={motivoRejeicao}
              onChange={(e) => setMotivoRejeicao(e.target.value)}
              placeholder="Descreva o motivo da rejeição..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg text-[14px] outline-none resize-none mb-5 text-txt-primary bg-[#0B1121] border border-red-500/30 focus:border-red-500"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setRejeitarId(null)}
                className="px-5 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-200"
                style={{
                  color: "var(--text-secondary)",
                  background: "rgba(148, 163, 184, 0.08)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleRejeitarReporte}
                disabled={!motivoRejeicao.trim() || !!actionLoading}
                className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all duration-200 flex items-center gap-2"
                style={{
                  background: "#EF4444",
                  opacity: !motivoRejeicao.trim() ? 0.5 : 1,
                }}
              >
                {actionLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : null}
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Homologação (Modificações) ── */}
      {concluirModId && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
          onClick={() => setConcluirModId(null)}
        >
          <div
            className="glass-card p-8 max-w-md w-full mx-4 animate-fade-in-up"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)", animationDuration: "0.2s" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/10"
              >
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 5.636 3.745 3.745 0 0 1-7.1 0 3.745 3.745 0 0 1-1.087-5.636A9 9 0 1 1 21 12Z" />
                </svg>
              </div>
              <div>
                <h3 className="text-[18px] font-bold text-txt-primary">
                  Homologação da Engenharia
                </h3>
                <p className="text-[13px] text-txt-muted">
                  Escreva o parecer técnico que ficará documentado.
                </p>
              </div>
            </div>

            <textarea
              value={parecerTexto}
              onChange={(e) => setParecerTexto(e.target.value)}
              placeholder="Ex: Homologado. Novo selo mecânico instalado com sucesso, garantindo melhor vedação sob alta pressão e aumentando a confiabilidade..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg text-[14px] outline-none resize-none mb-5 text-txt-primary bg-[#0B1121] border border-slate-800 focus:border-emerald-500"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConcluirModId(null)}
                className="px-5 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-200"
                style={{
                  color: "var(--text-secondary)",
                  background: "rgba(148, 163, 184, 0.08)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConcluirModificacao}
                disabled={!parecerTexto.trim() || !!actionLoading}
                className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all duration-200 flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500"
              >
                {actionLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : null}
                Homologar e Atualizar BOM
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
