"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  listAlertasApi,
  marcarLidoApi,
  marcarTodosLidosApi,
  type Alerta,
} from "@/lib/api/alertas";
import { formatToBrasilia } from "@/lib/time";

export default function NotificacoesPage() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState<"TODOS" | "NAO_LIDOS">("NAO_LIDOS");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const fetchAlertas = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const data = await listAlertasApi(filtro === "NAO_LIDOS");
      setAlertas(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar notificações.");
    } finally {
      setLoading(false);
    }
  }, [filtro]);

  useEffect(() => {
    fetchAlertas();
  }, [fetchAlertas]);

  async function handleMarcarLido(id: string) {
    setActionLoading(id);
    try {
      await marcarLidoApi(id);
      if (filtro === "NAO_LIDOS") {
        setAlertas((prev) => prev.filter((a) => a.id !== id));
      } else {
        setAlertas((prev) =>
          prev.map((a) => (a.id === id ? { ...a, lido: true } : a))
        );
      }
      window.dispatchEvent(new Event("alertStatusChanged"));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao marcar notificação como lida.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarcarTodosLidos() {
    setMarkAllLoading(true);
    try {
      await marcarTodosLidosApi();
      if (filtro === "NAO_LIDOS") {
        setAlertas([]);
      } else {
        setAlertas((prev) => prev.map((a) => ({ ...a, lido: true })));
      }
      window.dispatchEvent(new Event("alertStatusChanged"));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao marcar todas como lidas.");
    } finally {
      setMarkAllLoading(false);
    }
  }

  function formatDatetime(d: string | null) {
    if (!d) return "—";
    return `${formatToBrasilia(d)} BRT`;
  }

  return (
    <div className="page-container animate-fade-in-up" style={{ animationFillMode: "both" }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-[3px] rounded-full" style={{ background: "var(--orange)" }} />
            <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-orange">
              Monitoramento
            </span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight mb-2 text-txt-primary">
            Notificações
          </h1>
          <p className="text-[15px] text-txt-muted">
            Alertas automáticos de desgaste de componentes gerados pelo sistema.
          </p>
        </div>

        {alertas.some((a) => !a.lido) && (
          <button
            onClick={handleMarcarTodosLidos}
            disabled={markAllLoading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer self-start sm:self-center"
            style={{
              background: "rgba(232, 132, 44, 0.08)",
              border: "1px solid rgba(232, 132, 44, 0.2)",
              color: "#E8842C",
            }}
            onMouseEnter={(e) => { if (!markAllLoading) e.currentTarget.style.background = "rgba(232, 132, 44, 0.15)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(232, 132, 44, 0.08)"; }}
          >
            {markAllLoading ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            )}
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setFiltro("NAO_LIDOS")}
          className={`filter-chip ${filtro === "NAO_LIDOS" ? "active" : ""}`}
        >
          Não Lidas
        </button>
        <button
          onClick={() => setFiltro("TODOS")}
          className={`filter-chip ${filtro === "TODOS" ? "active" : ""}`}
        >
          Todas
        </button>
      </div>

      {/* Erro */}
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

      {/* Conteúdo */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <svg className="w-8 h-8 animate-spin" style={{ color: "var(--orange)" }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : alertas.length === 0 ? (
        <div
          className="glass-card flex flex-col items-center justify-center py-16 text-center"
          style={{ borderRadius: "16px" }}
        >
          <svg className="w-14 h-14 mb-4 text-txt-muted opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a9.049 9.049 0 0 1-5.185-2.883 9.049 9.049 0 0 1-2.883-5.185m0 0A8.96 8.96 0 0 1 8 8V7C8 4.24 10.24 2 13 2s5 2.24 5 5v1c0 .38.07.74.205 1.082m-11.348 0a8.96 8.96 0 0 0-1.9 5.46M12 21a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0 3 0m-3 0H9m1.05-3.116A11.95 11.95 0 0 1 12 18c1.328 0 2.583-.217 3.75-.616m-5.7 3.125A1.5 1.5 0 0 1 9 21" />
          </svg>
          <p className="text-[16px] font-medium text-txt-secondary">
            Nenhuma notificação {filtro === "NAO_LIDOS" ? "não lida " : ""}encontrada.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {alertas.map((alerta, i) => {
            const isCritico = alerta.tipo === "Crítico";
            const cor = isCritico ? "var(--red-badge)" : "var(--yellow-badge)";
            const bg = isCritico ? "var(--red-badge-bg)" : "var(--yellow-badge-bg)";
            const border = isCritico ? "var(--red-badge-border)" : "var(--yellow-badge-border)";

            return (
              <div
                key={alerta.id}
                className="glass-card p-5 animate-fade-in-up flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200"
                style={{
                  borderRadius: "14px",
                  animationDelay: `${i * 0.05}s`,
                  animationFillMode: "both",
                  borderLeft: `4px solid ${cor}`,
                  opacity: alerta.lido ? 0.65 : 1,
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: bg, border: `1px solid ${border}` }}
                  >
                    {isCritico ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={cor} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={cor} strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                      </svg>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
                        style={{ background: bg, color: cor, border: `1px solid ${border}` }}
                      >
                        {alerta.tipo}
                      </span>
                      <span className="text-[12px] text-txt-muted">
                        {formatDatetime(alerta.criadoEm)}
                      </span>
                    </div>

                    <p className="text-[14px] font-medium text-txt-primary mb-1.5 leading-relaxed">
                      {alerta.mensagem}
                    </p>

                    {alerta.componente?.equipamento && (
                      <Link
                        href={`/equipamentos/${alerta.componente.equipamento.id}`}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-orange hover:underline"
                      >
                        Ver detalhes do equipamento
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>

                {!alerta.lido && (
                  <button
                    onClick={() => handleMarcarLido(alerta.id)}
                    disabled={actionLoading === alerta.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 cursor-pointer self-end md:self-center"
                    style={{
                      background: "rgba(148, 163, 184, 0.08)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(148, 163, 184, 0.15)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(148, 163, 184, 0.08)"; }}
                  >
                    {actionLoading === alerta.id ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                    Lido
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
