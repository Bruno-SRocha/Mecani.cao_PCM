"use client";

import { useEffect, useState, useCallback } from "react";
import {
  listAllReportesApi,
  aprovarReporteApi,
  rejeitarReporteApi,
  type ReporteSubstituicao,
  type StatusReporte,
} from "@/lib/api/reportes-substituicao";

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

type FilterStatus = "TODOS" | StatusReporte;

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDatetime(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AprovacoesPage() {
  const [reportes, setReportes] = useState<ReporteSubstituicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("AGUARDANDO_APROVACAO");

  /* Rejeição modal */
  const [rejeitarId, setRejeitarId] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* Detalhe modal */
  const [detalheReporte, setDetalheReporte] = useState<ReporteSubstituicao | null>(null);

  const fetchReportes = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const data = await listAllReportesApi();
      setReportes(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar reportes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportes();
  }, [fetchReportes]);

  const filtered = reportes.filter((r) =>
    filter === "TODOS" ? true : r.status === filter
  );

  const pendingCount = reportes.filter(
    (r) => r.status === "AGUARDANDO_APROVACAO"
  ).length;

  async function handleAprovar(id: string) {
    setActionLoading(id);
    try {
      await aprovarReporteApi(id);
      await fetchReportes();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao aprovar.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejeitar() {
    if (!rejeitarId || !motivoRejeicao.trim()) return;
    setActionLoading(rejeitarId);
    try {
      await rejeitarReporteApi(rejeitarId, motivoRejeicao.trim());
      setRejeitarId(null);
      setMotivoRejeicao("");
      await fetchReportes();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao rejeitar.");
    } finally {
      setActionLoading(null);
    }
  }

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
            Reportes de substituição de componentes aguardando decisão.
          </p>
        </div>

        {pendingCount > 0 && (
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
            {pendingCount} aguardando aprovação
          </div>
        )}
      </div>

      {/* ── Filtros ── */}
      <div className="flex items-center gap-3 mb-6">
        {(["AGUARDANDO_APROVACAO", "APROVADO", "REJEITADO", "TODOS"] as FilterStatus[]).map((f) => {
          const isActive = filter === f;
          const label =
            f === "TODOS"
              ? "Todos"
              : f === "AGUARDANDO_APROVACAO"
              ? "Pendentes"
              : f === "APROVADO"
              ? "Aprovados"
              : "Rejeitados";
          const count =
            f === "TODOS"
              ? reportes.length
              : reportes.filter((r) => r.status === f).length;

          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-chip ${isActive ? "active" : ""}`}
            >
              {label}
              <span
                className="px-1.5 py-0.5 rounded-full text-[11px] font-bold"
                style={{
                  background: isActive ? "rgba(232,132,44,0.2)" : "rgba(148, 163, 184, 0.1)",
                  color: isActive ? "var(--orange)" : "var(--text-secondary)",
                }}
              >
                {count}
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
      ) : filtered.length === 0 ? (
        <div
          className="glass-card flex flex-col items-center justify-center py-16 text-center"
          style={{ borderRadius: "16px" }}
        >
          <svg className="w-14 h-14 mb-4" fill="none" viewBox="0 0 24 24" stroke="#334155" strokeWidth={0.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p className="text-[16px] font-medium text-txt-secondary">
            Nenhum reporte {filter === "TODOS" ? "" : filter === "AGUARDANDO_APROVACAO" ? "pendente" : filter === "APROVADO" ? "aprovado" : "rejeitado"} encontrado.
          </p>
        </div>
      ) : (
        <div className="list-items-lg">
          {filtered.map((reporte, i) => {
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
                        onClick={() => handleAprovar(reporte.id)}
                        disabled={isActioning}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 cursor-pointer"
                        style={{
                          background: "var(--green-badge-bg)",
                          color: "var(--green-badge)",
                          border: "1px solid var(--green-badge-border)",
                          opacity: isActioning ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => { if (!isActioning) e.currentTarget.style.background = "var(--green-badge-border)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--green-badge-bg)"; }}
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
                        onClick={() => { setRejeitarId(reporte.id); setMotivoRejeicao(""); }}
                        disabled={isActioning}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-200 cursor-pointer"
                        style={{
                          background: "var(--red-badge-bg)",
                          color: "var(--red-badge)",
                          border: "1px solid var(--red-badge-border)",
                          opacity: isActioning ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => { if (!isActioning) e.currentTarget.style.background = "var(--red-badge-border)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "var(--red-badge-bg)"; }}
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
      )}

      {/* ── Modal de Rejeição ── */}
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
              className="w-full px-4 py-3 rounded-lg text-[14px] outline-none resize-none mb-5 text-txt-primary"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--red-badge-border)",
              }}
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
                onClick={handleRejeitar}
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
    </div>
  );
}
