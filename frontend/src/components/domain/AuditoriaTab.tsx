/**
 * Componente: AuditoriaTab — Histórico de Auditoria de Status do Equipamento
 *
 * Exibe o histórico de alterações de status operacional do equipamento.
 */

"use client";

import { useEffect, useState } from "react";
import { getEquipamentoAuditoriaApi, type EquipamentoAuditoria } from "@/lib/api/equipamentos";
import { formatToBrasiliaDate } from "@/lib/time";
import type { StatusEquipamento } from "@/types/equipamento.types";

interface AuditoriaTabProps {
  equipamentoId: string;
}

/** Mapa de cores e labels para cada status operacional */
const statusConfig: Record<StatusEquipamento, { label: string; color: string; bg: string; border: string }> = {
  OPERANDO: {
    label: "Operando",
    color: "var(--green-badge)",
    bg: "var(--green-badge-bg)",
    border: "var(--green-badge-border)",
  },
  PARADO: {
    label: "Parado",
    color: "var(--red-badge)",
    bg: "var(--red-badge-bg)",
    border: "var(--red-badge-border)",
  },
  MANUTENCAO: {
    label: "Manutenção",
    color: "var(--yellow-badge)",
    bg: "var(--yellow-badge-bg)",
    border: "var(--yellow-badge-border)",
  },
};

export default function AuditoriaTab({ equipamentoId }: AuditoriaTabProps) {
  const [logs, setLogs] = useState<EquipamentoAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function fetchAuditoria() {
      setLoading(true);
      setErro("");
      try {
        const data = await getEquipamentoAuditoriaApi(equipamentoId);
        setLogs(data);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao carregar histórico de auditoria.");
      } finally {
        setLoading(false);
      }
    }

    if (equipamentoId) {
      fetchAuditoria();
    }
  }, [equipamentoId]);

  return (
    <div className="animate-fade-in-up" style={{ animationFillMode: "both" }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-5 h-[3px] rounded-full" style={{ background: "var(--orange)" }} />
        <h3 className="text-[18px] font-bold text-txt-primary">
          Histórico de Auditoria de Status
        </h3>
        {!loading && logs.length > 0 && (
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
            style={{ background: "var(--cyan-badge-bg)", color: "var(--cyan-badge)" }}
          >
            {logs.length}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <svg
            className="w-7 h-7 animate-spin"
            style={{ color: "var(--orange)" }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

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

      {!loading && !erro && logs.length === 0 && (
        <div
          className="glass-card flex flex-col items-center justify-center py-16 text-center"
          style={{ borderRadius: "12px" }}
        >
          <svg
            className="w-14 h-14 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="var(--text-muted)"
            strokeWidth={0.7}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <p className="text-[16px] font-semibold text-txt-secondary mb-1">
            Nenhum histórico de alteração
          </p>
          <p className="text-[13px] text-txt-muted max-w-md">
            Este equipamento não possui histórico de alteração de status operacional registrado.
          </p>
        </div>
      )}

      {!loading && !erro && logs.length > 0 && (
        <div className="glass-card overflow-hidden" style={{ borderRadius: "12px" }}>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ minWidth: 800 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  {[
                    "Data / Hora (Brasília)",
                    "Usuário",
                    "Status Anterior",
                    "Novo Status",
                    "Detalhes / Motivo",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-4 text-[11px] uppercase tracking-widest font-semibold text-txt-muted whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const prevConfig = statusConfig[log.statusAnterior];
                  const newConfig = statusConfig[log.statusNovo];
                  return (
                    <tr
                      key={log.id}
                      className="transition-colors duration-150 animate-fade-in-up"
                      style={{
                        borderBottom: i < logs.length - 1 ? "1px solid var(--border-subtle)" : undefined,
                        animationDelay: `${i * 0.04}s`,
                        animationFillMode: "both",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(148, 163, 184, 0.04)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {/* Data / Hora */}
                      <td className="px-5 py-4 text-[13.5px] font-medium text-txt-primary whitespace-nowrap">
                        {formatToBrasiliaDate(log.criadoEm, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>

                      {/* Usuário */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold text-txt-primary">
                            {log.usuario?.nome ?? "Sistema / Seed"}
                          </span>
                          {log.usuario?.nomeUsuario && (
                            <span className="text-[11px] text-txt-muted mt-0.5">
                              @{log.usuario.nomeUsuario}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Anterior */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {prevConfig ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider"
                            style={{
                              background: prevConfig.bg,
                              color: prevConfig.color,
                              border: `1px solid ${prevConfig.border}`,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: prevConfig.color }}
                            />
                            {prevConfig.label}
                          </span>
                        ) : (
                          <span className="text-txt-muted">—</span>
                        )}
                      </td>

                      {/* Novo Status */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {newConfig ? (
                          <span
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider"
                            style={{
                              background: newConfig.bg,
                              color: newConfig.color,
                              border: `1px solid ${newConfig.border}`,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: newConfig.color }}
                            />
                            {newConfig.label}
                          </span>
                        ) : (
                          <span className="text-txt-muted">—</span>
                        )}
                      </td>

                      {/* Detalhes / Motivo */}
                      <td className="px-5 py-4 text-[13.5px] text-txt-secondary">
                        {log.detalhes || "Atualização de status operacional"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
