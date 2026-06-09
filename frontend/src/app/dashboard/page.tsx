"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getSyncedDate, getBrasiliaDateString, formatToBrasilia } from "@/lib/time";
import type { Usuario } from "@/types/usuario.types";
import { listEquipamentosApi } from "@/lib/api/equipamentos";
import { listAlertasApi, marcarLidoApi, marcarTodosLidosApi } from "@/lib/api/alertas";
import { listOrdensManutencaoApi } from "@/lib/api/ordens-manutencao";
import type { Equipamento, StatusEquipamento } from "@/types/equipamento.types";
import type { Alerta } from "@/lib/api/alertas";
import type { OrdemManutencao } from "@/types/om.types";

const statusConfig: Record<StatusEquipamento, { label: string; color: string; bg: string }> = {
  OPERANDO: { label: "Operando", color: "var(--green-badge)", bg: "var(--green-badge-bg)" },
  PARADO: { label: "Parado", color: "var(--red-badge)", bg: "var(--red-badge-bg)" },
  MANUTENCAO: { label: "Manutenção", color: "var(--yellow-badge)", bg: "var(--yellow-badge-bg)" },
};

/**
 * Retorna o peso de criticidade do componente baseado em seu tipo.
 * Componentes vitais têm peso maior na média ponderada de saúde da planta.
 */
function getComponentWeight(tipo: string): number {
  const t = tipo.toLowerCase();
  if (
    t.includes("rolamento") ||
    t.includes("mancal") ||
    t.includes("selo") ||
    t.includes("engrenagem") ||
    t.includes("helice")
  ) {
    return 3;
  }
  if (
    t.includes("acoplamento") ||
    t.includes("valvula") ||
    t.includes("retentor")
  ) {
    return 2;
  }
  return 1; // Correias, filtros, outros
}

export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [ordens, setOrdens] = useState<OrdemManutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("usuario");
    if (stored) {
      try {
        setUsuario(JSON.parse(stored));
      } catch {
        /* noop */
      }
    }
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    setError("");
    try {
      const [eqData, alData, omData] = await Promise.all([
        listEquipamentosApi(),
        listAlertasApi(true), // apenas alertas não lidos
        listOrdensManutencaoApi(),
      ]);
      setEquipamentos(eqData);
      setAlertas(alData);
      setOrdens(omData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar dados do dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id: string) {
    try {
      await marcarLidoApi(id);
      setAlertas((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Erro ao marcar alerta como lido:", err);
    }
  }

  async function handleMarkAllAsRead() {
    if (alertas.length === 0) return;
    try {
      await marcarTodosLidosApi();
      setAlertas([]);
    } catch (err) {
      console.error("Erro ao marcar todos os alertas como lidos:", err);
    }
  }

  const now = getSyncedDate();
  const horaString = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    hour12: false,
    timeZone: "America/Sao_Paulo",
  });
  const hora = parseInt(horaString, 10);
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  // KPIs
  const totalEquipamentos = equipamentos.length;
  const operandoCount = equipamentos.filter((e) => e.status === "OPERANDO").length;
  const manutencaoCount = equipamentos.filter(
    (e) => e.status === "MANUTENCAO" || e.status === "PARADO"
  ).length;

  // Equipamentos em alerta (qualquer componente com desgaste >= 85%)
  const equipamentosEmAlerta = useMemo(() => {
    return equipamentos.filter((eq) =>
      eq.componentes?.some((c) => {
        const wear = c.vidaUtilNominal > 0 ? (c.horasOperacionais / c.vidaUtilNominal) * 100 : 0;
        return wear >= 85;
      })
    );
  }, [equipamentos]);

  // Ordens de Manutenção do dia de hoje (Brasília Time)
  const ordensDeHoje = useMemo(() => {
    const todayStr = getBrasiliaDateString(now);
    return ordens.filter((om) => {
      if (!om.dataInicioPrevisto) return false;
      const omDateStr = getBrasiliaDateString(new Date(om.dataInicioPrevisto));
      return omDateStr === todayStr;
    });
  }, [ordens, now]);

  // Saúde Geral da Planta (Média ponderada dos componentes)
  const saudeGeral = useMemo(() => {
    let totalWeight = 0;
    let weightedHealthSum = 0;

    equipamentos.forEach((eq) => {
      eq.componentes?.forEach((c) => {
        const wear = c.vidaUtilNominal > 0 ? (c.horasOperacionais / c.vidaUtilNominal) * 100 : 0;
        const health = Math.max(0, 100 - wear);
        const weight = getComponentWeight(c.tipo);

        weightedHealthSum += health * weight;
        totalWeight += weight;
      });
    });

    return totalWeight > 0 ? weightedHealthSum / totalWeight : 100;
  }, [equipamentos]);

  // Máquinas mais críticas (ordenadas por desgaste máximo de seus componentes)
  const maquinasCriticas = useMemo(() => {
    return equipamentos
      .map((eq) => {
        const maxWear =
          eq.componentes && eq.componentes.length > 0
            ? Math.max(
                ...eq.componentes.map((c) =>
                  c.vidaUtilNominal > 0 ? (c.horasOperacionais / c.vidaUtilNominal) * 100 : 0
                )
              )
            : 0;
        return { ...eq, maxWear };
      })
      .filter((eq) => eq.maxWear > 0)
      .sort((a, b) => b.maxWear - a.maxWear)
      .slice(0, 3);
  }, [equipamentos]);

  // Cores e texto para o círculo de Saúde Geral
  const healthStatus = useMemo(() => {
    if (saudeGeral >= 90) {
      return {
        color: "var(--green-badge)",
        label: "Excelente",
        desc: "Os ativos estão operando com níveis ótimos de desgaste.",
      };
    }
    if (saudeGeral >= 75) {
      return {
        color: "var(--yellow-badge)",
        label: "Atenção",
        desc: "Desgaste moderado detectado. Planeje manutenções preventivas.",
      };
    }
    return {
      color: "var(--red-badge)",
      label: "Crítica",
      desc: "Alto índice de desgaste acumulado. Risco elevado de falhas.",
    };
  }, [saudeGeral]);

  // Configuração do círculo SVG do gauge
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (saudeGeral / 100) * circumference;

  return (
    <div className="page-container animate-fade-in-up" style={{ animationFillMode: "both" }}>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-[3px] rounded-full" style={{ background: "var(--orange)" }} />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-orange">
              Painel Operacional
            </span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight mb-1 text-txt-primary">
            {saudacao}{usuario ? `, ${usuario.nome.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-[15px] text-txt-muted">
            Acompanhe a saúde dos ativos e gerencie os alertas em tempo real.
          </p>
        </div>

        <button
          onClick={loadDashboardData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 cursor-pointer"
          style={{
            background: "rgba(148, 163, 184, 0.05)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(148, 163, 184, 0.05)";
          }}
        >
          <svg
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Atualizar Dados
        </button>
      </div>

      {error && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-6 animate-fade-in"
          style={{
            background: "var(--red-badge-bg)",
            border: "1px solid var(--red-badge-border)",
            color: "var(--red-badge)",
          }}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* ── KPI Cards ─────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {[
          {
            label: "Equipamentos",
            value: loading ? "—" : totalEquipamentos,
            sub: "Total cadastrado",
            color: "#22A0B4",
            bg: "rgba(34, 160, 180, 0.08)",
            iconPath:
              "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085",
            pulsing: false,
          },
          {
            label: "Em Operação",
            value: loading ? "—" : operandoCount,
            sub: "Ativos funcionais",
            color: "#4ADE80",
            bg: "rgba(74, 222, 128, 0.08)",
            iconPath: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
            pulsing: false,
          },
          {
            label: "Manutenção / Parado",
            value: loading ? "—" : manutencaoCount,
            sub: "Pendentes de retorno",
            color: "#FBBF24",
            bg: "rgba(251, 191, 36, 0.08)",
            iconPath:
              "M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 1 1-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 0 1 6.336-4.486l-3.276 3.276a3.004 3.004 0 0 0 2.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852Z",
            pulsing: false,
          },
          {
            label: "Equipamentos em Alerta",
            value: loading ? "—" : equipamentosEmAlerta.length,
            sub: "Necessitam de atenção",
            color: "#F87171",
            bg: "rgba(248, 113, 113, 0.08)",
            iconPath:
              "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z",
            pulsing: !loading && equipamentosEmAlerta.length > 0,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="glass-card p-space-lg flex flex-col justify-between"
            style={{
              borderRadius: "14px",
              animation: kpi.pulsing ? "pulse-glow 2.5s infinite" : "none",
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: kpi.bg }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={kpi.color} strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={kpi.iconPath} />
                </svg>
              </div>
              {kpi.pulsing && (
                <span
                  className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded animate-pulse"
                  style={{ background: "rgba(248, 113, 113, 0.12)", color: kpi.color }}
                >
                  Ação Requerida
                </span>
              )}
            </div>
            <div>
              <p className="text-[32px] font-bold leading-none mb-1.5 text-txt-primary">{kpi.value}</p>
              <p className="text-[14px] text-txt-secondary font-medium">{kpi.label}</p>
              <p className="text-[11px] mt-1 text-txt-muted" style={{ opacity: 0.85 }}>
                {kpi.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Seção Operacional Principal (Média Ponderada + Máquinas Críticas + Alertas) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        
        {/* Saúde Geral da Planta (Média Ponderada) */}
        <div className="glass-card p-space-lg flex flex-col justify-between" style={{ borderRadius: "14px" }}>
          <div>
            <h2 className="text-[16px] font-bold mb-1 text-txt-primary">Saúde Geral da Planta</h2>
            <p className="text-[12px] text-txt-muted mb-6">Média ponderada baseada no desgaste acumulado dos componentes.</p>
            
            <div className="flex flex-col items-center justify-center py-4">
              <div className="relative flex items-center justify-center">
                <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 120 120">
                  {/* Círculo fundo */}
                  <circle
                    strokeWidth={strokeWidth}
                    stroke="rgba(148, 163, 184, 0.06)"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                  />
                  {/* Círculo valor */}
                  <circle
                    stroke={healthStatus.color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="60"
                    cy="60"
                    style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
                  />
                </svg>
                <div className="absolute text-center">
                  <p className="text-[30px] font-bold text-txt-primary leading-none">
                    {loading ? "—" : `${saudeGeral.toFixed(0)}%`}
                  </p>
                  <span
                    className="inline-block text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded mt-1.5"
                    style={{
                      background: `${healthStatus.color}15`,
                      color: healthStatus.color,
                      border: `1px solid ${healthStatus.color}35`,
                    }}
                  >
                    {healthStatus.label}
                  </span>
                </div>
              </div>

              <div className="text-center mt-6 max-w-[220px]">
                <p className="text-[13px] leading-relaxed text-txt-secondary">{healthStatus.desc}</p>
              </div>
            </div>
          </div>
          
          <div
            className="info-sub-card text-[11px] text-txt-muted mt-4"
            style={{ background: "var(--bg-sub-card)", borderColor: "var(--border-sub-card)" }}
          >
            💡 Pesos aplicados: Rolamentos/Mancais/Selos (Peso 3), Acoplamentos/Válvulas/Retentores (Peso 2), Correias/Filtros (Peso 1).
          </div>
        </div>

        {/* Máquinas Mais Críticas */}
        <div className="glass-card p-space-lg flex flex-col justify-between" style={{ borderRadius: "14px" }}>
          <div>
            <h2 className="text-[16px] font-bold mb-1 text-txt-primary">Ativos mais Críticos</h2>
            <p className="text-[12px] text-txt-muted mb-5">Ativos com maior nível de desgaste em componentes mecânicos.</p>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="w-6 h-6 animate-spin" style={{ color: "var(--orange)" }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : maquinasCriticas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted)" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <p className="text-[13px] text-txt-secondary font-medium">Todos os ativos saudáveis</p>
              </div>
            ) : (
              <div className="space-y-4">
                {maquinasCriticas.map((eq) => {
                  const st = statusConfig[eq.status];
                  // Cor de alerta do maior desgaste
                  const progressColor =
                    eq.maxWear >= 100
                      ? "var(--red-badge)"
                      : eq.maxWear >= 85
                      ? "var(--yellow-badge)"
                      : "var(--green-badge)";

                  return (
                    <div
                      key={eq.id}
                      onClick={() => router.push(`/equipamentos/${eq.id}`)}
                      className="info-sub-card flex flex-col gap-2.5 cursor-pointer hover:border-orange transition-all duration-200"
                      style={{ background: "var(--bg-sub-card)", borderColor: "var(--border-sub-card)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-txt-primary truncate">{eq.nome}</p>
                          <span
                            className="inline-block text-[11px] font-bold px-1.5 py-0.5 rounded uppercase mt-0.5"
                            style={{ background: "var(--cyan-badge-bg)", color: "var(--cyan-badge)" }}
                          >
                            {eq.tag}
                          </span>
                        </div>
                        <span
                          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold h-fit"
                          style={{ background: st.bg, color: st.color }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
                          {st.label}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-txt-muted">Desgaste Máximo</span>
                          <span className="font-bold" style={{ color: progressColor }}>
                            {eq.maxWear.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(148, 163, 184, 0.08)" }}>
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(eq.maxWear, 100)}%`, background: progressColor }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          <button
            onClick={() => router.push("/equipamentos")}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all duration-200 cursor-pointer"
            style={{ background: "var(--orange)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--orange-dark)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--orange)";
            }}
          >
            Gerenciar Equipamentos
          </button>
        </div>

        {/* Alertas Críticos em Tempo Real */}
        <div className="glass-card p-space-lg flex flex-col justify-between" style={{ borderRadius: "14px" }}>
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-[16px] font-bold text-txt-primary">Alertas Ativos</h2>
              {alertas.length > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-[11px] font-semibold hover:underline cursor-pointer"
                  style={{ color: "var(--orange)" }}
                >
                  Limpar tudo
                </button>
              )}
            </div>
            <p className="text-[12px] text-txt-muted mb-5">Alertas pendentes gerados pelo desgaste de componentes.</p>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <svg className="w-6 h-6 animate-spin" style={{ color: "var(--orange)" }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : alertas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ background: "var(--green-badge-bg)" }}
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="var(--green-badge)" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <p className="text-[14px] font-semibold text-txt-primary">Nenhum alerta pendente</p>
                <p className="text-[11px] text-txt-muted mt-1">Todos os componentes operando sob limites normais.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {alertas.slice(0, 5).map((alerta) => {
                  const severityColor = alerta.tipo === "Crítico" ? "var(--red-badge)" : "var(--yellow-badge)";
                  const severityBg = alerta.tipo === "Crítico" ? "var(--red-badge-bg)" : "var(--yellow-badge-bg)";

                  return (
                    <div
                      key={alerta.id}
                      className="p-3 rounded-lg border flex flex-col gap-2 relative group"
                      style={{
                        background: "var(--bg-sub-card)",
                        borderColor: "var(--border-sub-card)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                              style={{ background: severityBg, color: severityColor }}
                            >
                              {alerta.tipo}
                            </span>
                            {alerta.componente?.equipamento && (
                              <button
                                onClick={() => router.push(`/equipamentos/${alerta.componente?.equipamento?.id}`)}
                                className="text-[10px] font-bold tracking-wider hover:underline"
                                style={{ color: "var(--teal-light)" }}
                              >
                                {alerta.componente.equipamento.tag}
                              </button>
                            )}
                          </div>
                          <p className="text-[12px] text-txt-secondary leading-snug">{alerta.mensagem}</p>
                        </div>

                        <button
                          onClick={() => handleMarkAsRead(alerta.id)}
                          className="shrink-0 text-txt-muted hover:text-white p-1 rounded transition-colors"
                          title="Marcar como lido"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
                {alertas.length > 5 && (
                  <p className="text-center text-[11px] text-txt-muted pt-1">
                    + {alertas.length - 5} alertas na lista.
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => router.push("/notificacoes")}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-all duration-200 cursor-pointer"
            style={{
              background: "rgba(148, 163, 184, 0.05)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(148, 163, 184, 0.05)";
            }}
          >
            Ver Histórico de Alertas
          </button>
        </div>

      </div>

      {/* ── Acesso rápido + Atividades de Hoje + Módulos Planejados ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Atalhos de navegação */}
        <div className="lg:col-span-1 glass-card p-space-lg flex flex-col justify-between" style={{ borderRadius: "14px" }}>
          <div>
            <h2 className="text-[16px] font-bold mb-5 text-txt-primary">Acesso Rápido</h2>
            <div className="space-y-3">
              {[
                {
                  label: "Ver Equipamentos",
                  sub: "Lista de todos os ativos da planta",
                  href: "/equipamentos",
                  color: "#22A0B4",
                  iconPath:
                    "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085",
                },
                {
                  label: "Ordens de Manutenção",
                  sub: "Gerencie as OMs preventivas e corretivas",
                  href: "/ordens-manutencao",
                  color: "#E8842C",
                  iconPath:
                    "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4",
                },
                {
                  label: "Calendário PCM",
                  sub: "Visualização do cronograma preventivo",
                  href: "/calendario",
                  color: "#1A7A8A",
                  iconPath:
                    "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5",
                },
              ].map((link) => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer"
                  style={{
                    background: "rgba(148,163,184,0.05)",
                    border: "1px solid rgba(148,163,184,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${link.color}0D`;
                    e.currentTarget.style.borderColor = `${link.color}30`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(148,163,184,0.05)";
                    e.currentTarget.style.borderColor = "rgba(148,163,184,0.08)";
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${link.color}18` }}
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke={link.color} strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={link.iconPath} />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-txt-primary">{link.label}</p>
                    <p className="text-[12px] text-txt-muted">{link.sub}</p>
                  </div>
                  <svg className="w-4 h-4 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Atividades de Hoje */}
        <div className="lg:col-span-1 glass-card p-space-lg flex flex-col justify-between" style={{ borderRadius: "14px" }}>
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[16px] font-bold text-txt-primary">Atividades de Hoje</h2>
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{
                  background: ordensDeHoje.length > 0 ? "var(--bg-filter-chip-active)" : "var(--border-subtle)",
                  color: ordensDeHoje.length > 0 ? "var(--orange)" : "var(--text-muted)",
                }}
              >
                {ordensDeHoje.length} OM{ordensDeHoje.length !== 1 ? "s" : ""}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--orange)" }} />
              </div>
            ) : ordensDeHoje.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <svg className="w-10 h-10 mb-2 text-txt-muted opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <p className="text-[13px] font-bold text-txt-secondary">Nenhuma atividade agendada</p>
                <p className="text-[11px] text-txt-muted max-w-[220px] mx-auto">Tudo em dia para hoje no plano de manutenções preventivas.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
                {ordensDeHoje.slice(0, 3).map((om) => {
                  const statusColors: Record<string, string> = {
                    ABERTA: "var(--cyan-badge)",
                    AGUARDANDO_INICIO: "var(--cyan-badge)",
                    EM_EXECUCAO: "#FBBF24",
                    PAUSADA: "var(--text-secondary)",
                    CONCLUIDA: "var(--green-badge)",
                    CANCELADA: "var(--text-muted)",
                  };
                  const color = statusColors[om.status] || "var(--text-secondary)";
                  const time = om.dataInicioPrevisto
                    ? formatToBrasilia(om.dataInicioPrevisto, { hour: "2-digit", minute: "2-digit" })
                    : "—";

                  return (
                    <div
                      key={om.id}
                      onClick={() => router.push(`/ordens-manutencao?busca=${om.codigo}`)}
                      className="p-3 rounded-xl border text-[12px] cursor-pointer hover:border-orange transition-all duration-150 flex flex-col gap-1"
                      style={{
                        background: "var(--bg-sub-card)",
                        borderColor: "var(--border-sub-card)",
                        borderLeft: `3px solid ${color}`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-orange">{om.codigo}</span>
                        <span className="text-[10px] font-bold text-txt-muted font-mono">{time}</span>
                      </div>
                      <div className="truncate font-bold text-txt-primary">{om.equipamento.nome}</div>
                      <div className="text-[10px] font-bold text-txt-muted truncate">{om.equipamento.tag}</div>
                    </div>
                  );
                })}
                {ordensDeHoje.length > 3 && (
                  <p className="text-[11px] text-txt-muted text-center pt-1 font-semibold">
                    + {ordensDeHoje.length - 3} outra{ordensDeHoje.length - 3 > 1 ? "s" : ""} atividade{ordensDeHoje.length - 3 > 1 ? "s" : ""} hoje
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => router.push("/calendario")}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold transition-all duration-200 cursor-pointer border"
            style={{
              background: "var(--bg-filter-chip-active)",
              borderColor: "var(--orange)",
              color: "var(--orange)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = "var(--shadow-glow)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "";
            }}
          >
            Ver Calendário
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

        {/* Módulos Futuros/Planejados -> BI Preview */}
        <div className="lg:col-span-1 glass-card p-space-lg flex flex-col justify-between" style={{ borderRadius: "14px" }}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(232,132,44,0.12)" }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#E8842C" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                  </svg>
                </div>
                <h2 className="text-[16px] font-bold text-txt-primary">Painel de BI & PCM</h2>
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-green-500/10 text-green-500 animate-pulse">
                Ativo
              </span>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="p-3 rounded-lg border" style={{ background: "var(--bg-sub-card)", borderColor: "var(--border-sub-card)" }}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[12px] font-semibold text-txt-secondary">Disponibilidade Global</span>
                  <span className="text-[12px] font-bold text-green-500 font-mono">95.5%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div className="h-full rounded-full bg-green-500" style={{ width: "95.5%" }} />
                </div>
              </div>

              <div className="p-3 rounded-lg border" style={{ background: "var(--bg-sub-card)", borderColor: "var(--border-sub-card)" }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] font-semibold text-txt-secondary">Tempo de Resposta (MTTR)</span>
                  <span className="text-[12px] font-bold text-txt-primary font-mono">4.2h</span>
                </div>
                <p className="text-[11px] text-txt-muted">Média ponderada de reparo das corretivas</p>
              </div>

              <div className="p-3 rounded-lg border" style={{ background: "var(--bg-sub-card)", borderColor: "var(--border-sub-card)" }}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[12px] font-semibold text-txt-secondary">Carga de Trabalho (Backlog)</span>
                  <span className="text-[12px] font-bold text-orange font-mono">24h / 1.5 dias</span>
                </div>
                <p className="text-[11px] text-txt-muted">Carga total programada para execução</p>
              </div>
            </div>
          </div>
          
          <div className="mt-5">
            <button
              onClick={() => router.push("/relatorios")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold text-white transition-all cursor-pointer border-0"
              style={{
                background: "var(--orange)",
                boxShadow: "0 4px 12px rgba(232, 132, 44, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--orange-dark)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--orange)";
                e.currentTarget.style.transform = "none";
              }}
            >
              Ver Relatórios & BI
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
