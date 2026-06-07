/**
 * Componente: HistoricoTab — Histórico de Substituições de Componentes
 *
 * Exibe o histórico completo de substituições aprovadas de um equipamento,
 * incluindo:
 *
 * AC1 - Aba dedicada "Histórico" dentro da tela de detalhes do equipamento.
 * AC2 - Dados obrigatórios: data, componente (nome/SKU), motivo, técnico,
 *        vida útil do novo componente, fabricante do novo componente.
 * AC3 - Ordenação cronológica inversa (mais recente primeiro).
 * AC4 - Filtros por período (data inicial/final) e tipo de componente.
 * AC5 - Indicador de MTBF (Mean Time Between Failures) por componente.
 *
 * Design: Tabela responsiva com paginação e etiquetas coloridas por motivo.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getHistoricoEquipamentoApi,
  type HistoricoResult,
  type MotivoTroca,
} from "@/lib/api/reportes-substituicao";
import { formatToBrasiliaDate } from "@/lib/time";

interface HistoricoTabProps {
  equipamentoId: string;
  /** Lista de tipos de componentes disponíveis para filtro */
  tiposComponente: string[];
}

/** Configuração visual para cada motivo de troca */
const motivoConfig: Record<MotivoTroca, { label: string; color: string; bg: string; border: string }> = {
  PREVENTIVA: {
    label: "Preventiva",
    color: "var(--cyan-badge)",
    bg: "var(--cyan-badge-bg)",
    border: "var(--cyan-badge-border)",
  },
  CORRETIVA: {
    label: "Corretiva",
    color: "var(--red-badge)",
    bg: "var(--red-badge-bg)",
    border: "var(--red-badge-border)",
  },
  PREDITIVA: {
    label: "Preditiva",
    color: "var(--green-badge)",
    bg: "var(--green-badge-bg)",
    border: "var(--green-badge-border)",
  },
  DESGASTE_NATURAL: {
    label: "Desgaste Natural",
    color: "var(--yellow-badge)",
    bg: "var(--yellow-badge-bg)",
    border: "var(--yellow-badge-border)",
  },
};

function formatTipoLabel(tipo: string): string {
  const map: Record<string, string> = {
    rolamento: "Rolamento",
    selo_mecanico: "Selo Mecânico",
    mancal: "Mancal",
    correia: "Correia",
    acoplamento: "Acoplamento",
    retentor: "Retentor",
  };
  return map[tipo] ?? tipo.charAt(0).toUpperCase() + tipo.slice(1).replace(/_/g, " ");
}

export default function HistoricoTab({ equipamentoId, tiposComponente }: HistoricoTabProps) {
  const [data, setData] = useState<HistoricoResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  /* Filtros */
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [tipoComponente, setTipoComponente] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const fetchHistorico = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const result = await getHistoricoEquipamentoApi(equipamentoId, {
        dataInicio: dataInicio || undefined,
        dataFim: dataFim || undefined,
        tipoComponente: tipoComponente || undefined,
        page,
        limit: LIMIT,
      });
      setData(result);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar histórico.");
    } finally {
      setLoading(false);
    }
  }, [equipamentoId, dataInicio, dataFim, tipoComponente, page]);

  useEffect(() => {
    fetchHistorico();
  }, [fetchHistorico]);

  /* Resetar página ao mudar filtros */
  function handleFilterChange() {
    setPage(1);
  }

  const mtbfEntries = data ? Object.entries(data.mtbfPorComponente) : [];

  return (
    <div className="animate-fade-in-up" style={{ animationFillMode: "both" }}>
      {/* ── MTBF Cards (AC5) ──────────────────────────────────── */}
      {mtbfEntries.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-5 h-[3px] rounded-full" style={{ background: "var(--orange)" }} />
            <h3 className="text-[18px] font-bold text-txt-primary">
              MTBF — Tempo Médio Entre Falhas
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
              style={{ background: "var(--orange-glow)", color: "var(--orange)", border: "1px solid var(--orange)" }}>
              Indicador
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {mtbfEntries.map(([compId, info]) => (
              <div key={compId} className="glass-card p-space-lg" style={{ borderRadius: "14px" }}>
                <p className="text-[10px] uppercase tracking-widest mb-2 text-txt-muted">
                  {info.componenteNome}
                </p>
                <div className="flex items-end gap-2 mb-2">
                  <p className="text-[28px] font-bold text-txt-primary leading-none">
                    {info.mtbfDias > 0 ? info.mtbfDias : "—"}
                  </p>
                  {info.mtbfDias > 0 && (
                    <span className="text-[13px] font-medium text-txt-muted mb-0.5">dias</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3" />
                  </svg>
                  <span className="text-[12px] text-txt-muted">
                    {info.totalTrocas} {info.totalTrocas === 1 ? "troca registrada" : "trocas registradas"}
                  </span>
                </div>
                {info.mtbfDias === 0 && info.totalTrocas < 2 && (
                  <p className="text-[11px] mt-2 text-txt-muted italic">
                    Dados insuficientes para cálculo de MTBF
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Filtros (AC4) ────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-5 h-[3px] rounded-full" style={{ background: "var(--teal)" }} />
        <h3 className="text-[18px] font-bold text-txt-primary">
          Histórico de Substituições
        </h3>
        {data && (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: "var(--cyan-badge-bg)", color: "var(--cyan-badge)" }}>
            {data.total}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-4 mb-6">
        {/* Data Início */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-widest font-semibold text-txt-muted">
            Data Início
          </label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => { setDataInicio(e.target.value); handleFilterChange(); }}
            className="search-input !w-auto !pl-3"
            style={{ minWidth: 160 }}
          />
        </div>

        {/* Data Fim */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-widest font-semibold text-txt-muted">
            Data Fim
          </label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => { setDataFim(e.target.value); handleFilterChange(); }}
            className="search-input !w-auto !pl-3"
            style={{ minWidth: 160 }}
          />
        </div>

        {/* Tipo Componente */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] uppercase tracking-widest font-semibold text-txt-muted">
            Tipo de Componente
          </label>
          <select
            value={tipoComponente}
            onChange={(e) => { setTipoComponente(e.target.value); handleFilterChange(); }}
            className="form-select"
            style={{ minWidth: 180 }}
          >
            <option value="">Todos</option>
            {tiposComponente.map(t => (
              <option key={t} value={t}>{formatTipoLabel(t)}</option>
            ))}
          </select>
        </div>

        {/* Limpar Filtros */}
        {(dataInicio || dataFim || tipoComponente) && (
          <button
            onClick={() => { setDataInicio(""); setDataFim(""); setTipoComponente(""); handleFilterChange(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all duration-200 cursor-pointer"
            style={{ color: "var(--text-secondary)", background: "rgba(148, 163, 184, 0.08)", border: "1px solid var(--border-subtle)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpar Filtros
          </button>
        )}
      </div>

      {/* ── Loading ───────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg className="w-7 h-7 animate-spin" style={{ color: "var(--orange)" }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {/* ── Erro ──────────────────────────────────────────────── */}
      {erro && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-6"
          style={{ background: "var(--red-badge-bg)", border: "1px solid var(--red-badge-border)", color: "var(--red-badge)" }}>
          {erro}
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────── */}
      {!loading && !erro && data && data.registros.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center" style={{ borderRadius: "12px" }}>
          <svg className="w-14 h-14 mb-4" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={0.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <p className="text-[16px] font-semibold text-txt-secondary mb-1">Nenhuma substituição encontrada</p>
          <p className="text-[13px] text-txt-muted max-w-md">
            {(dataInicio || dataFim || tipoComponente)
              ? "Nenhum registro encontrado para os filtros selecionados. Tente ajustar o período ou o tipo de componente."
              : "Este equipamento ainda não possui substituições aprovadas registradas no sistema."
            }
          </p>
        </div>
      )}

      {/* ── Tabela de Registros (AC2/AC3) ────────────────────── */}
      {!loading && !erro && data && data.registros.length > 0 && (
        <>
          <div className="glass-card overflow-hidden" style={{ borderRadius: "12px" }}>
            <div className="overflow-x-auto">
              <table className="w-full" style={{ minWidth: 900 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {["Data", "Componente", "Motivo", "Técnico", "Vida Útil", "Fabricante"].map(h => (
                      <th key={h} className="text-left px-5 py-4 text-[11px] uppercase tracking-widest font-semibold text-txt-muted whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.registros.map((reg, i) => {
                    const motivo = motivoConfig[reg.motivo] ?? motivoConfig.CORRETIVA;
                    return (
                      <tr
                        key={reg.id}
                        className="transition-colors duration-150 animate-fade-in-up"
                        style={{
                          borderBottom: i < data.registros.length - 1 ? "1px solid var(--border-subtle)" : undefined,
                          animationDelay: `${i * 0.04}s`,
                          animationFillMode: "both",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(148, 163, 184, 0.04)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        {/* Data */}
                        <td className="px-5 py-4 text-[14px] font-medium text-txt-primary whitespace-nowrap">
                          {formatToBrasiliaDate(reg.dataSubstituicao, { day: "2-digit", month: "short", year: "numeric" })}
                        </td>

                        {/* Componente (Nome/SKU) */}
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-[14px] font-semibold text-txt-primary">{reg.pecaInstalada}</span>
                            {reg.componente && (
                              <span className="text-[11px] text-txt-muted mt-0.5">
                                {formatTipoLabel(reg.componente.tipo)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Motivo — Badge colorida */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider"
                            style={{ background: motivo.bg, color: motivo.color, border: `1px solid ${motivo.border}` }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: motivo.color }} />
                            {motivo.label}
                          </span>
                        </td>

                        {/* Técnico Responsável */}
                        <td className="px-5 py-4 text-[14px] text-txt-secondary whitespace-nowrap">
                          {reg.tecnico?.nome ?? "—"}
                        </td>

                        {/* Vida Útil */}
                        <td className="px-5 py-4 text-[14px] font-medium text-txt-primary whitespace-nowrap">
                          {reg.vidaUtilNovaPeca.toLocaleString("pt-BR")} h
                        </td>

                        {/* Fabricante */}
                        <td className="px-5 py-4 text-[14px] text-txt-secondary whitespace-nowrap">
                          {reg.fabricanteNovaPeca || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Paginação ─────────────────────────────────────── */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between mt-5 px-1">
              <p className="text-[13px] text-txt-muted">
                Mostrando <span className="font-semibold text-txt-secondary">{(data.page - 1) * LIMIT + 1}</span>–
                <span className="font-semibold text-txt-secondary">{Math.min(data.page * LIMIT, data.total)}</span> de{" "}
                <span className="font-semibold text-txt-secondary">{data.total}</span> registros
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: "var(--text-secondary)", background: "rgba(148, 163, 184, 0.08)", border: "1px solid var(--border-subtle)" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                  </svg>
                  Anterior
                </button>

                {/* Page numbers */}
                {Array.from({ length: data.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === data.totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="text-[13px] text-txt-muted px-1">…</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className="w-8 h-8 rounded-lg text-[13px] font-semibold transition-all duration-200 cursor-pointer"
                        style={{
                          color: p === page ? "white" : "var(--text-secondary)",
                          background: p === page ? "var(--teal)" : "transparent",
                        }}
                      >
                        {p}
                      </button>
                    </span>
                  ))}

                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ color: "var(--text-secondary)", background: "rgba(148, 163, 184, 0.08)", border: "1px solid var(--border-subtle)" }}
                >
                  Próximo
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
