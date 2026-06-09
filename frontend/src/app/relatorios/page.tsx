"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getSyncedDate, formatToBrasilia } from "@/lib/time";
import type { Usuario } from "@/types/usuario.types";
import { getBiMetricsApi } from "@/lib/api/bi";
import type { BiMetrics, DisponibilidadeMensal, RulComponente } from "@/lib/api/bi";

type TabId = "operacional" | "engenharia" | "custos";

export default function RelatoriosPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [metrics, setMetrics] = useState<BiMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("operacional");

  // Chart interactivity states
  const [hoveredUptimeIdx, setHoveredUptimeIdx] = useState<number | null>(null);
  const [hoveredMixIdx, setHoveredMixIdx] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("usuario");
    if (stored) {
      try {
        setUsuario(JSON.parse(stored));
      } catch {
        /* noop */
      }
    }
    loadMetrics();
  }, []);

  async function loadMetrics() {
    setLoading(true);
    setError("");
    try {
      const data = await getBiMetricsApi();
      setMetrics(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar métricas de BI."
      );
    } finally {
      setLoading(false);
    }
  }

  // Color mapping helper for OM types
  const omTypeColors: Record<string, string> = {
    PREVENTIVA: "#22A0B4", // Teal
    CORRETIVA_PROGRAMADA: "#E8842C", // Orange
    CORRETIVA_EMERGENCIAL: "#EF4444", // Red
    PREDITIVA: "#10B981", // Green
  };

  const omTypeLabels: Record<string, string> = {
    PREVENTIVA: "Preventiva",
    CORRETIVA_PROGRAMADA: "Corretiva Prog.",
    CORRETIVA_EMERGENCIAL: "Corretiva Emerg.",
    PREDITIVA: "Preditiva",
  };

  // SVG Line Chart coordinates calculation for Physical Availability
  const lineChartData = useMemo(() => {
    if (!metrics?.disponibilidadeGrafico) return null;
    
    const width = 580;
    const height = 180;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Fixed range: 90% to 100%
    const minVal = 90;
    const maxVal = 100;

    const points = metrics.disponibilidadeGrafico.map((d, index) => {
      const x = paddingLeft + (index / (metrics.disponibilidadeGrafico.length - 1)) * chartWidth;
      const y = height - paddingBottom - ((d.disponibilidade - minVal) / (maxVal - minVal)) * chartHeight;
      return { x, y, val: d.disponibilidade, mes: d.mes };
    });

    // Generate path
    let linePath = "";
    let areaPath = "";

    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      areaPath = `M ${points[0].x} ${height - paddingBottom} L ${points[0].x} ${points[0].y}`;
      
      for (let i = 1; i < points.length; i++) {
        linePath += ` L ${points[i].x} ${points[i].y}`;
        areaPath += ` L ${points[i].x} ${points[i].y}`;
      }
      
      areaPath += ` L ${points[points.length - 1].x} ${height - paddingBottom} Z`;
    }

    // Y position for 95% goal line
    const yGoal = height - paddingBottom - ((95 - minVal) / (maxVal - minVal)) * chartHeight;

    return { points, linePath, areaPath, yGoal, width, height, paddingLeft, paddingRight, paddingTop, paddingBottom };
  }, [metrics?.disponibilidadeGrafico]);

  // Donut Chart calculation for Mix de Manutenção
  const donutChartData = useMemo(() => {
    if (!metrics?.mixData) return [];
    
    const radius = 50;
    const strokeWidth = 14;
    const circ = 2 * Math.PI * radius; // ~314.16
    
    let accumulated = 0;
    return metrics.mixData.map((d, idx) => {
      const strokeDasharray = `${(d.percentual / 100) * circ} ${circ}`;
      const strokeDashoffset = -((accumulated / 100) * circ);
      accumulated += d.percentual;
      return {
        ...d,
        color: omTypeColors[d.tipo] || "#71717a",
        strokeDasharray,
        strokeDashoffset,
      };
    });
  }, [metrics?.mixData]);

  // Format currency in Reais
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  return (
    <div className="page-container animate-fade-in-up" style={{ animationFillMode: "both" }}>
      {/* ── Header ──────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-[3px] rounded-full" style={{ background: "var(--orange)" }} />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-orange">
              Inteligência e Confiabilidade
            </span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight mb-1 text-txt-primary">
            Relatórios & BI
          </h1>
          <p className="text-[15px] text-txt-muted">
            Painel analítico do PCM contendo indicadores estratégicos, MTBF, MTTR e custos.
          </p>
        </div>

        <button
          onClick={loadMetrics}
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
          Sincronizar Métricas
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

      {/* ── Tab Selector ────────────────────────────────── */}
      <div className="flex gap-1.5 border-b mb-6" style={{ borderColor: "var(--border-subtle)" }}>
        {[
          { id: "operacional", label: "Gestão Operacional", icon: "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75A2.25 2.25 0 0 1 15.75 13.5H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" },
          { id: "engenharia", label: "Engenharia de Confiabilidade", icon: "M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" },
          { id: "custos", label: "Custos & Peças", icon: "M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
        ].map((tab) => {
          const isAct = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className="flex items-center gap-2 px-5 py-3 text-[14px] font-semibold transition-all duration-200 border-b-2 cursor-pointer relative"
              style={{
                color: isAct ? "var(--orange)" : "var(--text-secondary)",
                borderColor: isAct ? "var(--orange)" : "transparent",
                marginBottom: "-2px",
              }}
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin" style={{ borderColor: "var(--orange)" }} />
          <p className="text-[14px] text-txt-secondary font-semibold">Agregando métricas e compilando gráficos...</p>
        </div>
      ) : metrics ? (
        <div className="animate-fade-in">
          {/* =================================================================
              ABA 1: OPERACIONAL
              ================================================================= */}
          {activeTab === "operacional" && (
            <div>
              {/* KPI operational cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {[
                  {
                    title: "Disponibilidade Física",
                    val: `${metrics.uptimeGeral}%`,
                    desc: "Uptime geral de ativos",
                    color: "var(--green-badge)",
                    bg: "var(--green-badge-bg)",
                    sub: `Meta global: ${metrics.metaUptime}%`,
                  },
                  {
                    title: "Aderência Preventiva (PMC)",
                    val: `${metrics.pmcAderencia}%`,
                    desc: "OS preventivas no prazo",
                    color: "var(--cyan-badge)",
                    bg: "var(--cyan-badge-bg)",
                    sub: "Parâmetro ideal: >= 80%",
                  },
                  {
                    title: "Tempo Médio de Reparo (MTTR)",
                    val: `${metrics.mttrHours}h`,
                    desc: "Duração média das corretivas",
                    color: "var(--yellow-badge)",
                    bg: "var(--yellow-badge-bg)",
                    sub: "Menor valor = melhor eficiência",
                  },
                  {
                    title: "Backlog do PCM",
                    val: `${metrics.backlogDias} dias`,
                    desc: "Carga de trabalho pendente",
                    color: "var(--orange)",
                    bg: "rgba(232, 132, 44, 0.08)",
                    sub: `${metrics.backlogHoras} horas homem totais`,
                  },
                ].map((kpi, idx) => (
                  <div key={idx} className="glass-card p-5 flex flex-col justify-between" style={{ borderRadius: "14px" }}>
                    <span className="text-[12px] text-txt-muted font-medium uppercase tracking-wider">{kpi.title}</span>
                    <div className="my-2">
                      <span className="text-[28px] font-bold text-txt-primary">{kpi.val}</span>
                      <p className="text-[12px] text-txt-secondary mt-0.5">{kpi.desc}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded font-semibold w-fit" style={{ background: kpi.bg, color: kpi.color }}>
                      {kpi.sub}
                    </span>
                  </div>
                ))}
              </div>

              {/* Charts section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
                {/* 1. Availability Timeline */}
                <div className="glass-card p-5" style={{ borderRadius: "14px" }}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-[16px] font-bold text-txt-primary">Disponibilidade Física</h3>
                      <p className="text-[12px] text-txt-muted">Uptime consolidado das máquinas nos últimos 12 meses.</p>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-semibold">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-1 rounded" style={{ background: "var(--green-badge)" }} />
                        <span className="text-txt-secondary">Realizado</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: "#EF4444" }} />
                        <span className="text-txt-secondary">Meta (95%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="relative h-[200px] w-full">
                    {lineChartData && (
                      <svg viewBox={`0 0 ${lineChartData.width} ${lineChartData.height}`} className="w-full h-full">
                        <defs>
                          <linearGradient id="availGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--green-badge)" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="var(--green-badge)" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        {[90, 92, 94, 96, 98, 100].map((v, i) => {
                          const y = lineChartData.height - lineChartData.paddingBottom - ((v - 90) / 10) * (lineChartData.height - lineChartData.paddingTop - lineChartData.paddingBottom);
                          return (
                            <g key={v} className="opacity-10">
                              <line x1={lineChartData.paddingLeft} y1={y} x2={lineChartData.width - lineChartData.paddingRight} y2={y} stroke="var(--text-muted)" strokeWidth={1} />
                              <text x={lineChartData.paddingLeft - 8} y={y + 4} textAnchor="end" fontSize={10} fill="var(--text-primary)">{v}%</text>
                            </g>
                          );
                        })}

                        {/* Goal line */}
                        <line
                          x1={lineChartData.paddingLeft}
                          y1={lineChartData.yGoal}
                          x2={lineChartData.width - lineChartData.paddingRight}
                          y2={lineChartData.yGoal}
                          stroke="#EF4444"
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                        />

                        {/* Filled Area */}
                        <path d={lineChartData.areaPath} fill="url(#availGrad)" />

                        {/* Stroke Line */}
                        <path d={lineChartData.linePath} fill="none" stroke="var(--green-badge)" strokeWidth={2.5} strokeLinecap="round" />

                        {/* Data dots */}
                        {lineChartData.points.map((p, idx) => (
                          <g key={idx}>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={hoveredUptimeIdx === idx ? 6 : 4}
                              fill="var(--green-badge)"
                              stroke="var(--bg-glass)"
                              strokeWidth={1.5}
                              className="cursor-pointer transition-all duration-150"
                              onMouseEnter={() => setHoveredUptimeIdx(idx)}
                              onMouseLeave={() => setHoveredUptimeIdx(null)}
                            />
                            {/* X Label */}
                            <text
                              x={p.x}
                              y={lineChartData.height - 8}
                              textAnchor="middle"
                              fontSize={10}
                              fill="var(--text-muted)"
                              className="opacity-70 font-semibold"
                            >
                              {p.mes}
                            </text>
                          </g>
                        ))}
                      </svg>
                    )}

                    {/* Tooltip Overlay */}
                    {hoveredUptimeIdx !== null && lineChartData && lineChartData.points[hoveredUptimeIdx] && (
                      <div
                        className="absolute p-2 rounded-lg border text-[11px] font-bold shadow-lg pointer-events-none"
                        style={{
                          background: "var(--bg-sub-card)",
                          borderColor: "var(--border-sub-card)",
                          left: `${(hoveredUptimeIdx / (lineChartData.points.length - 1)) * 80 + 8}%`,
                          top: `${lineChartData.points[hoveredUptimeIdx].y / 1.8}px`,
                        }}
                      >
                        <p className="text-txt-muted">{lineChartData.points[hoveredUptimeIdx].mes}</p>
                        <p className="text-txt-primary">Disp: <span style={{ color: "var(--green-badge)" }}>{lineChartData.points[hoveredUptimeIdx].val}%</span></p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Maintenance Mix */}
                <div className="glass-card p-5" style={{ borderRadius: "14px" }}>
                  <div>
                    <h3 className="text-[16px] font-bold text-txt-primary">Mix de Manutenção</h3>
                    <p className="text-[12px] text-txt-muted">Proporção de ordens de serviço executadas por modelo.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 items-center">
                    {/* Donut graphic */}
                    <div className="relative flex items-center justify-center h-[160px]">
                      <svg viewBox="0 0 120 120" className="w-[140px] h-[140px] transform -rotate-90">
                        {/* Circle background track */}
                        <circle cx="60" cy="60" r="50" fill="transparent" stroke="rgba(148, 163, 184, 0.05)" strokeWidth={14} />
                        {donutChartData.map((d, idx) => (
                          <circle
                            key={idx}
                            cx="60"
                            cy="60"
                            r="50"
                            fill="transparent"
                            stroke={d.color}
                            strokeWidth={hoveredMixIdx === idx ? 16 : 14}
                            strokeDasharray={d.strokeDasharray}
                            strokeDashoffset={d.strokeDashoffset}
                            strokeLinecap="round"
                            className="cursor-pointer transition-all duration-150"
                            onMouseEnter={() => setHoveredMixIdx(idx)}
                            onMouseLeave={() => setHoveredMixIdx(null)}
                          />
                        ))}
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-[10px] text-txt-muted font-bold uppercase tracking-wider">
                          {hoveredMixIdx !== null ? omTypeLabels[donutChartData[hoveredMixIdx].tipo] : "Mix Geral"}
                        </span>
                        <p className="text-[20px] font-bold text-txt-primary leading-none mt-1">
                          {hoveredMixIdx !== null
                            ? `${donutChartData[hoveredMixIdx].percentual}%`
                            : `${metrics.mixData.length} Tipos`}
                        </p>
                        {hoveredMixIdx !== null && (
                          <span className="text-[11px] text-txt-muted font-mono block mt-0.5">
                            ({donutChartData[hoveredMixIdx].quantidade} OSs)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Donut Legend */}
                    <div className="space-y-2.5">
                      {donutChartData.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg transition-colors"
                          style={{
                            background: hoveredMixIdx === idx ? "rgba(148, 163, 184, 0.05)" : "transparent",
                          }}
                          onMouseEnter={() => setHoveredMixIdx(idx)}
                          onMouseLeave={() => setHoveredMixIdx(null)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                            <span className="text-[12px] font-semibold text-txt-secondary">{omTypeLabels[item.tipo]}</span>
                          </div>
                          <span className="text-[12px] font-bold text-txt-primary font-mono">{item.percentual}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Backlog by Priority */}
              <div className="glass-card p-5 mb-6" style={{ borderRadius: "14px" }}>
                <h3 className="text-[16px] font-bold text-txt-primary mb-1">Backlog de Carga de Horas por Prioridade</h3>
                <p className="text-[12px] text-txt-muted mb-5">Horas de homem estimadas necessárias para esgotar as ordens em aberto.</p>

                <div className="space-y-4">
                  {metrics.backlogGrafico.map((b) => {
                    const prioColors: Record<string, string> = {
                      CRITICA: "var(--red-badge)",
                      ALTA: "var(--orange)",
                      MEDIA: "var(--yellow-badge)",
                      BAIXA: "var(--green-badge)",
                    };
                    const prioLabels: Record<string, string> = {
                      CRITICA: "Crítica",
                      ALTA: "Alta",
                      MEDIA: "Média",
                      BAIXA: "Baixa",
                    };
                    const color = prioColors[b.prioridade] || "var(--text-muted)";
                    const maxHoras = Math.max(...metrics.backlogGrafico.map(x => x.horas), 10);
                    const pct = (b.horas / maxHoras) * 100;

                    return (
                      <div key={b.prioridade} className="flex items-center gap-4">
                        <span className="w-16 text-[12px] font-bold text-txt-secondary">{prioLabels[b.prioridade]}</span>
                        <div className="flex-1 h-6 bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden relative">
                          <div
                            className="h-full rounded-lg transition-all duration-500"
                            style={{
                              width: `${Math.max(3, pct)}%`,
                              background: color,
                              opacity: 0.85,
                            }}
                          />
                          <span className="absolute inset-y-0 left-3 flex items-center text-[11px] font-bold text-white shadow-sm font-mono">
                            {b.horas} horas
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              ABA 2: ENGENHARIA
              ================================================================= */}
          {activeTab === "engenharia" && (
            <div>
              {/* KPI engineering cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                <div className="glass-card p-5" style={{ borderRadius: "14px" }}>
                  <span className="text-[12px] text-txt-muted font-medium uppercase tracking-wider">Tempo Médio Entre Falhas (MTBF)</span>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-[30px] font-bold text-txt-primary">{metrics.mtbfGeral}h</span>
                    <span className="text-[12px] text-txt-muted">operacionais</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold w-fit text-green-500 bg-green-500/10">
                    Estabilidade Geral: Saudável
                  </span>
                </div>
                <div className="glass-card p-5" style={{ borderRadius: "14px" }}>
                  <span className="text-[12px] text-txt-muted font-medium uppercase tracking-wider">Mortalidade Infantil de Peças</span>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-[30px] font-bold text-txt-primary">{metrics.taxaMortalidadeInfantil}%</span>
                    <span className="text-[12px] text-txt-muted">de trocas</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold w-fit text-red-400 bg-red-400/10">
                    Trocas precoces (antes de 50% de vida útil)
                  </span>
                </div>
                <div className="glass-card p-5" style={{ borderRadius: "14px" }}>
                  <span className="text-[12px] text-txt-muted font-medium uppercase tracking-wider">Ciclo Médio de Peças Críticas</span>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-[30px] font-bold text-txt-primary">31.4k</span>
                    <span className="text-[12px] text-txt-muted">horas nominais</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold w-fit text-cyan-400 bg-cyan-400/10">
                    Vida média projetada pelo OEM
                  </span>
                </div>
              </div>

              {/* 2-column breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
                
                {/* Worst 5 MTBF Assets */}
                <div className="glass-card p-5 lg:col-span-1" style={{ borderRadius: "14px" }}>
                  <h3 className="text-[16px] font-bold text-txt-primary mb-1">Ativos com Pior MTBF</h3>
                  <p className="text-[12px] text-txt-muted mb-4">Máquinas que apresentam falha com maior frequência.</p>

                  <div className="space-y-3">
                    {metrics.mtbfPorAtivo.map((eq) => (
                      <div
                        key={eq.id}
                        onClick={() => router.push(`/equipamentos/${eq.id}`)}
                        className="info-sub-card p-3 flex flex-col gap-1 cursor-pointer hover:border-orange transition-all"
                        style={{ background: "var(--bg-sub-card)", borderColor: "var(--border-sub-card)" }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-txt-primary truncate">{eq.nome}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-mono">
                            MTBF: {eq.mtbf}h
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-txt-muted">
                          <span>{eq.tag}</span>
                          <span>{eq.tipo}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Remaining Useful Life (RUL) */}
                <div className="glass-card p-5 lg:col-span-2" style={{ borderRadius: "14px" }}>
                  <h3 className="text-[16px] font-bold text-txt-primary mb-1">Vida Útil Remanescente de Componentes (RUL)</h3>
                  <p className="text-[12px] text-txt-muted mb-4">Projeção de desgaste em tempo real e tempo estimado de troca.</p>

                  <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                    {metrics.rulComponentes.map((c) => {
                      const isDanger = c.desgastePct >= 85;
                      const isWarn = c.desgastePct >= 65 && c.desgastePct < 85;
                      
                      const barColor = isDanger
                        ? "var(--red-badge)"
                        : isWarn
                        ? "var(--yellow-badge)"
                        : "var(--green-badge)";

                      return (
                        <div
                          key={c.id}
                          className="p-3.5 rounded-xl border flex flex-col gap-2 relative"
                          style={{
                            background: "var(--bg-sub-card)",
                            borderColor: isDanger ? "rgba(239, 68, 68, 0.2)" : "var(--border-sub-card)",
                            borderLeft: `3px solid ${barColor}`,
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[13px] font-bold text-txt-primary">{c.nome}</span>
                              <div className="flex items-center gap-1.5 text-[11px] text-txt-muted mt-0.5 font-semibold">
                                <span className="text-orange">{c.tagEquipamento}</span>
                                <span>•</span>
                                <span>{c.nomeEquipamento}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              {isDanger ? (
                                <span className="inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-500 animate-pulse">
                                  CRÍTICO
                                </span>
                              ) : isWarn ? (
                                <span className="inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500">
                                  ATENÇÃO
                                </span>
                              ) : (
                                <span className="inline-block text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-green-500/10 text-green-500">
                                  NORMAL
                                </span>
                              )}
                              <p className="text-[11px] text-txt-muted font-bold mt-1 font-mono">
                                Prev. Troca: <span className="text-txt-primary">{c.previsaoTrocaDias} dias</span>
                              </p>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-[10px] mb-1 font-semibold">
                              <span className="text-txt-muted">Índice de fadiga física do material</span>
                              <span className="font-bold" style={{ color: barColor }}>{c.desgastePct}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(c.desgastePct, 100)}%`, background: barColor }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* =================================================================
              ABA 3: CUSTOS & PEÇAS
              ================================================================= */}
          {activeTab === "custos" && (
            <div>
              {/* KPI cost cards */}
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                <div className="glass-card p-5" style={{ borderRadius: "14px" }}>
                  <span className="text-[12px] text-txt-muted font-medium uppercase tracking-wider">Custo Estimado de Manutenção (TCO)</span>
                  <div className="my-2 flex items-baseline gap-1">
                    <span className="text-[30px] font-bold text-txt-primary font-mono">{formatCurrency(metrics.tcoTotal)}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold w-fit text-cyan-400 bg-cyan-400/10">
                    Composição: Peças aplicadas + Taxa de serviços
                  </span>
                </div>
                <div className="glass-card p-5" style={{ borderRadius: "14px" }}>
                  <span className="text-[12px] text-txt-muted font-medium uppercase tracking-wider">Consumo Total de Peças</span>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-[30px] font-bold text-txt-primary font-mono">18</span>
                    <span className="text-[12px] text-txt-muted">sobressalentes</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold w-fit text-green-500 bg-green-500/10">
                    Últimos 90 dias com reportes aprovados
                  </span>
                </div>
                <div className="glass-card p-5" style={{ borderRadius: "14px" }}>
                  <span className="text-[12px] text-txt-muted font-medium uppercase tracking-wider">Eficiência de Giro de Estoque</span>
                  <div className="my-2 flex items-baseline gap-2">
                    <span className="text-[30px] font-bold text-txt-primary font-mono">94.2%</span>
                    <span className="text-[12px] text-txt-muted">atendimento</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold w-fit text-yellow-500 bg-yellow-500/10">
                    Aderência ao almoxarifado local
                  </span>
                </div>
              </div>

              {/* Spare parts consumption chart & list */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                
                {/* Horizontal bar chart */}
                <div className="glass-card p-5 lg:col-span-1.5" style={{ borderRadius: "14px" }}>
                  <h3 className="text-[16px] font-bold text-txt-primary mb-1">Frequência de Consumo de Peças Críticas</h3>
                  <p className="text-[12px] text-txt-muted mb-5">Indica quais sobressalentes são mais solicitados no PCM.</p>

                  <div className="space-y-4">
                    {metrics.consumoLotes.map((item) => {
                      const maxQty = Math.max(...metrics.consumoLotes.map(x => x.quantidade), 5);
                      const pct = (item.quantidade / maxQty) * 100;

                      return (
                        <div key={item.peca} className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between text-[12px] font-semibold">
                            <span className="text-txt-secondary truncate max-w-[280px]">{item.peca}</span>
                            <span className="text-txt-primary font-mono">{item.quantidade} un.</span>
                          </div>
                          <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                background: "var(--orange)",
                                opacity: 0.85,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Additional details */}
                <div className="glass-card p-5 lg:col-span-1.5" style={{ borderRadius: "14px" }}>
                  <h3 className="text-[16px] font-bold text-txt-primary mb-1">Análise de Abastecimento</h3>
                  <p className="text-[12px] text-txt-muted mb-4">Rastreamento qualitativo do almoxarifado.</p>

                  <div className="space-y-3 text-[12px]">
                    {[
                      { item: "Rolamentos Radiais", status: "Em conformidade com fabricante OEM SKF.", color: "text-green-500" },
                      { item: "Selos Mecânicos", status: "Estoque flutuante. 1 item importado sem marca rejeitado.", color: "text-amber-500" },
                      { item: "Correias de Transmissão", status: "Consumo elevado em compressores. Planejar compra em lote.", color: "text-cyan-500" },
                      { item: "Filtros Separadores", status: "Substituição preventiva concluída de acordo com plano PM anual.", color: "text-green-500" },
                    ].map((row, idx) => (
                      <div key={idx} className="p-3 rounded-lg flex flex-col gap-1" style={{ background: "var(--bg-sub-card)" }}>
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-txt-primary">{row.item}</span>
                          <span className={`${row.color} text-[10px] uppercase font-bold tracking-wider`}> PCM status </span>
                        </div>
                        <p className="text-txt-muted">{row.status}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-txt-secondary font-bold">Sem dados disponíveis.</p>
        </div>
      )}
    </div>
  );
}
