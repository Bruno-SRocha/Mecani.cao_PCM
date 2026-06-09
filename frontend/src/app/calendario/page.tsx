"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSyncedDate, getBrasiliaDateString, formatToBrasilia } from "@/lib/time";
import type { Usuario } from "@/types/usuario.types";
import type { OrdemManutencao, StatusOM, TipoManutencao, PrioridadeOM } from "@/types/om.types";
import {
  STATUS_OM_LABELS,
  STATUS_OM_COLORS,
  TIPO_MANUTENCAO_LABELS,
  PRIORIDADE_LABELS,
  PRIORIDADE_COLORS,
} from "@/types/om.types";
import { listOrdensManutencaoApi, updateOrdemManutencaoApi } from "@/lib/api/ordens-manutencao";

type CalendarView = "month" | "week" | "day";

// Status colors and background maps for the calendar
const statusBgs: Record<StatusOM, string> = {
  ABERTA: "var(--cyan-badge-bg)",
  AGUARDANDO_INICIO: "var(--yellow-badge-bg)",
  EM_EXECUCAO: "rgba(251, 191, 36, 0.12)", // Orange-yellow
  PAUSADA: "var(--border-subtle)",
  CONCLUIDA: "var(--green-badge-bg)",
  CANCELADA: "var(--red-badge-bg)",
};

const statusColors: Record<StatusOM, string> = {
  ABERTA: "var(--cyan-badge)",
  AGUARDANDO_INICIO: "var(--cyan-badge)", // Planejado (Azul)
  EM_EXECUCAO: "#FBBF24", // Em Andamento (Amarelo)
  PAUSADA: "var(--text-secondary)",
  CONCLUIDA: "var(--green-badge)", // Concluído (Verde)
  CANCELADA: "var(--text-muted)",
};

export default function CalendarioPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [ordens, setOrdens] = useState<OrdemManutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // View settings
  const [currentDate, setCurrentDate] = useState<Date>(() => getSyncedDate());
  const [view, setView] = useState<CalendarView>("month");
  const [filtroTipo, setFiltroTipo] = useState<"PREVENTIVA" | "TODAS">("TODAS");
  const [busca, setBusca] = useState("");

  // Modals / Details
  const [selectedOM, setSelectedOM] = useState<OrdemManutencao | null>(null);
  const [hoveredOM, setHoveredOM] = useState<OrdemManutencao | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [omParaReagendar, setOmParaReagendar] = useState<OrdemManutencao | null>(null);
  const [novaDataReagendar, setNovaDataReagendar] = useState<string | null>(null);
  const [reagendando, setReagendando] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("usuario");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      setUsuario(JSON.parse(stored));
    } catch {
      router.push("/");
    }
  }, [router]);

  const carregarOMs = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const allOMs = await listOrdensManutencaoApi();
      setOrdens(allOMs);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar cronograma.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarOMs();
  }, [carregarOMs]);

  const isGestorOuAdmin = usuario?.nivel === "GESTOR" || usuario?.nivel === "ADMIN";

  // Filtered OMs to display
  const ordensFiltradas = useMemo(() => {
    return ordens.filter((om) => {
      const matchesTipo = filtroTipo === "TODAS" || om.tipo === "PREVENTIVA";
      const matchesBusca =
        om.codigo.toLowerCase().includes(busca.toLowerCase()) ||
        om.equipamento.nome.toLowerCase().includes(busca.toLowerCase()) ||
        om.equipamento.tag.toLowerCase().includes(busca.toLowerCase()) ||
        om.descricao.toLowerCase().includes(busca.toLowerCase());
      return matchesTipo && matchesBusca;
    });
  }, [ordens, filtroTipo, busca]);

  // Map each OM to its date in Brasília Time (YYYY-MM-DD)
  const ordensPorData = useMemo(() => {
    const map: Record<string, OrdemManutencao[]> = {};
    ordensFiltradas.forEach((om) => {
      if (!om.dataInicioPrevisto) return;
      const dateStr = getBrasiliaDateString(new Date(om.dataInicioPrevisto));
      if (!map[dateStr]) {
        map[dateStr] = [];
      }
      map[dateStr].push(om);
    });

    // Sort OMs inside each day by time (if available), then by priority
    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => {
        if (a.dataInicioPrevisto && b.dataInicioPrevisto) {
          return new Date(a.dataInicioPrevisto).getTime() - new Date(b.dataInicioPrevisto).getTime();
        }
        return 0;
      });
    });

    return map;
  }, [ordensFiltradas]);

  // Helper: Status label, color and styling mapping
  const getStatusDisplay = useCallback((om: OrdemManutencao) => {
    const dataPrevista = om.dataInicioPrevisto ? new Date(om.dataInicioPrevisto) : null;
    const isConcluida = om.status === "CONCLUIDA";
    const isCancelada = om.status === "CANCELADA";
    const now = getSyncedDate();

    // Overdue check
    if (!isConcluida && !isCancelada && dataPrevista && dataPrevista < now) {
      return {
        label: "Atrasada",
        color: "var(--red-badge)",
        bg: "var(--red-badge-bg)",
        border: "var(--red-badge-border)",
      };
    }

    const labelMap: Record<StatusOM, string> = {
      ABERTA: "Agendada",
      AGUARDANDO_INICIO: "Agendada",
      EM_EXECUCAO: "Em Andamento",
      PAUSADA: "Pausada",
      CONCLUIDA: "Concluído",
      CANCELADA: "Cancelado",
    };

    const label = labelMap[om.status] || om.status;
    const color = statusColors[om.status] || "var(--text-secondary)";
    const bg = statusBgs[om.status] || "rgba(148, 163, 184, 0.08)";
    const border = om.status === "EM_EXECUCAO" ? "rgba(251, 191, 36, 0.3)" : "var(--border-subtle)";

    return { label, color, bg, border };
  }, []);

  // Helper: Maintenance type label, color and styling mapping
  const getTipoManutencaoDisplay = useCallback((tipo: TipoManutencao) => {
    const bgMap: Record<TipoManutencao, string> = {
      PREVENTIVA: "var(--cyan-badge-bg)",
      CORRETIVA_PROGRAMADA: "var(--yellow-badge-bg)",
      CORRETIVA_EMERGENCIAL: "var(--red-badge-bg)",
      PREDITIVA: "var(--orange-glow)",
    };

    const colorMap: Record<TipoManutencao, string> = {
      PREVENTIVA: "var(--cyan-badge)",
      CORRETIVA_PROGRAMADA: "var(--yellow-badge)",
      CORRETIVA_EMERGENCIAL: "var(--red-badge)",
      PREDITIVA: "var(--orange)",
    };

    const borderMap: Record<TipoManutencao, string> = {
      PREVENTIVA: "var(--cyan-badge-border)",
      CORRETIVA_PROGRAMADA: "var(--yellow-badge-border)",
      CORRETIVA_EMERGENCIAL: "var(--red-badge-border)",
      PREDITIVA: "var(--border-accent)",
    };

    return {
      bg: bgMap[tipo] || "rgba(148, 163, 184, 0.08)",
      color: colorMap[tipo] || "var(--text-secondary)",
      border: borderMap[tipo] || "var(--border-subtle)",
    };
  }, []);

  // Calendar Math: MONTH VIEW
  const diasNoMes = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
    const totalDays = new Date(year, month + 1, 0).getDate();

    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const totalDaysPrev = new Date(prevMonthYear, prevMonth + 1, 0).getDate();

    const grid: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(prevMonthYear, prevMonth, totalDaysPrev - i);
      const mStr = String(prevMonth + 1).padStart(2, "0");
      const dStr = String(totalDaysPrev - i).padStart(2, "0");
      grid.push({
        date: d,
        dateStr: `${prevMonthYear}-${mStr}-${dStr}`,
        isCurrentMonth: false,
      });
    }

    // Current month days
    const currMStr = String(month + 1).padStart(2, "0");
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      const dStr = String(i).padStart(2, "0");
      grid.push({
        date: d,
        dateStr: `${year}-${currMStr}-${dStr}`,
        isCurrentMonth: true,
      });
    }

    // Next month padding (complete to multiples of 7, 35 or 42)
    const totalGridSize = grid.length <= 35 ? 35 : 42;
    const remaining = totalGridSize - grid.length;
    const nextMonthYear = month === 11 ? year + 1 : year;
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextMStr = String(nextMonth + 1).padStart(2, "0");
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(nextMonthYear, nextMonth, i);
      const dStr = String(i).padStart(2, "0");
      grid.push({
        date: d,
        dateStr: `${nextMonthYear}-${nextMStr}-${dStr}`,
        isCurrentMonth: false,
      });
    }

    return grid;
  }, [currentDate]);

  // Calendar Math: WEEK VIEW
  const diasNaSemana = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day); // Rollback to Sunday

    const grid: { date: Date; dateStr: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const dayVal = String(d.getDate()).padStart(2, "0");
      grid.push({
        date: d,
        dateStr: `${year}-${month}-${dayVal}`,
      });
    }
    return grid;
  }, [currentDate]);

  // Date Navigation
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(currentDate.getMonth() - 1);
    } else if (view === "week") {
      newDate.setDate(currentDate.getDate() - 7);
    } else {
      newDate.setDate(currentDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(currentDate.getMonth() + 1);
    } else if (view === "week") {
      newDate.setDate(currentDate.getDate() + 7);
    } else {
      newDate.setDate(currentDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(getSyncedDate());
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, om: OrdemManutencao) => {
    if (!isGestorOuAdmin) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", om.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const omId = e.dataTransfer.getData("text/plain");
    const om = ordens.find((o) => o.id === omId);
    if (!om) return;

    const currentOMDate = om.dataInicioPrevisto ? getBrasiliaDateString(new Date(om.dataInicioPrevisto)) : "";
    if (currentOMDate === targetDateStr) return; // Same day drop

    // Format new date correctly preserving original time or defaulting
    const [year, month, day] = targetDateStr.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day);
    
    let targetTime = "08:00:00";
    if (om.dataInicioPrevisto) {
      const original = new Date(om.dataInicioPrevisto);
      const hours = String(original.getHours()).padStart(2, "0");
      const minutes = String(original.getMinutes()).padStart(2, "0");
      const seconds = String(original.getSeconds()).padStart(2, "0");
      targetTime = `${hours}:${minutes}:${seconds}`;
    }

    // Format ISO string representing that local date at original time
    const newISOString = `${targetDateStr}T${targetTime}.000Z`;

    setOmParaReagendar(om);
    setNovaDataReagendar(newISOString);
  };

  const confirmarReagendamento = async () => {
    if (!omParaReagendar || !novaDataReagendar) return;
    setReagendando(true);
    setErro(null);
    try {
      const atualizada = await updateOrdemManutencaoApi(omParaReagendar.id, {
        dataInicioPrevisto: novaDataReagendar,
      });
      // Update local state
      setOrdens((prev) => prev.map((o) => (o.id === atualizada.id ? atualizada : o)));
      setOmParaReagendar(null);
      setNovaDataReagendar(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao reagendar ordem.");
    } finally {
      setReagendando(false);
    }
  };

  // Hover Popover details helpers
  const handleMouseEnterCard = (e: React.MouseEvent, om: OrdemManutencao) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPosition({
      x: rect.left + window.scrollX + rect.width / 2,
      y: rect.top + window.scrollY - 10,
    });
    setHoveredOM(om);
  };

  const handleMouseLeaveCard = () => {
    setHoveredOM(null);
  };

  // Format date helper for the header title
  const getHeaderTitle = () => {
    if (view === "month") {
      return currentDate.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
      }).replace(/^\w/, (c) => c.toUpperCase());
    } else if (view === "week") {
      const start = diasNaSemana[0].date;
      const end = diasNaSemana[6].date;
      const format = (d: Date) =>
        d.toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "short",
          timeZone: "America/Sao_Paulo",
        });
      return `${format(start)} - ${format(end)} (${currentDate.getFullYear()})`;
    } else {
      return currentDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
      });
    }
  };

  const weekDayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="page-container animate-fade-in-up" style={{ animationFillMode: "both" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-[3px] rounded-full" style={{ background: "var(--orange)" }} />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-orange">
              Planejamento Visual
            </span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight mb-1 text-txt-primary">
            Calendário de Manutenções
          </h1>
          <p className="text-[15px] text-txt-muted">
            Visualize, organize e reagende o cronograma de manutenção preventiva.
          </p>
        </div>

        {/* View Switches */}
        <div className="flex items-center gap-2 rounded-xl border p-1" style={{ background: "rgba(148, 163, 184, 0.03)", borderColor: "var(--border-subtle)" }}>
          {(["month", "week", "day"] as CalendarView[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all duration-150 cursor-pointer uppercase ${
                view === v
                  ? "text-orange"
                  : "text-txt-secondary hover:text-txt-primary"
              }`}
              style={{
                background: view === v ? "var(--bg-filter-chip-active)" : "transparent",
              }}
            >
              {v === "month" ? "Mês" : v === "week" ? "Semana" : "Dia"}
            </button>
          ))}
        </div>
      </div>

      {/* Filters & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-2.5 rounded-xl border flex items-center justify-center cursor-pointer text-txt-secondary hover:text-txt-primary transition-all duration-150"
            style={{ background: "rgba(148,163,184,0.04)", borderColor: "var(--border-subtle)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            onClick={handleToday}
            className="px-4 py-2.5 rounded-xl border text-[13px] font-bold cursor-pointer text-txt-secondary hover:text-txt-primary transition-all duration-150"
            style={{ background: "rgba(148,163,184,0.04)", borderColor: "var(--border-subtle)" }}
          >
            Hoje
          </button>

          <button
            onClick={handleNext}
            className="p-2.5 rounded-xl border flex items-center justify-center cursor-pointer text-txt-secondary hover:text-txt-primary transition-all duration-150"
            style={{ background: "rgba(148,163,184,0.04)", borderColor: "var(--border-subtle)" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          <h2 className="text-[20px] font-bold text-txt-primary ml-2 select-none tracking-tight">
            {getHeaderTitle()}
          </h2>
        </div>

        {/* Filter controls */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Quick Search */}
          <div className="search-input-wrapper" style={{ minWidth: "220px" }}>
            <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="search-input"
              aria-label="Buscar manutenções no calendário"
              style={{ padding: "0.5rem 0.875rem 0.5rem 2.5rem" }}
            />
          </div>

          {/* Type Toggle */}
          <div className="flex items-center gap-1.5 border p-1 rounded-xl" style={{ background: "rgba(148,163,184,0.03)", borderColor: "var(--border-subtle)" }}>
            <button
              onClick={() => setFiltroTipo("PREVENTIVA")}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-150 cursor-pointer ${
                filtroTipo === "PREVENTIVA" ? "text-orange" : "text-txt-secondary hover:text-txt-primary"
              }`}
              style={{ background: filtroTipo === "PREVENTIVA" ? "var(--bg-filter-chip-active)" : "transparent" }}
            >
              Apenas Preventivas
            </button>
            <button
              onClick={() => setFiltroTipo("TODAS")}
              className={`px-3.5 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-150 cursor-pointer ${
                filtroTipo === "TODAS" ? "text-orange" : "text-txt-secondary hover:text-txt-primary"
              }`}
              style={{ background: filtroTipo === "TODAS" ? "var(--bg-filter-chip-active)" : "transparent" }}
            >
              Todas OMs
            </button>
          </div>
        </div>
      </div>

      {erro && (
        <div className="mb-6 px-4 py-3 rounded-xl flex items-center gap-3 border" style={{ background: "var(--red-badge-bg)", borderColor: "var(--red-badge-border)" }}>
          <svg className="w-5 h-5 text-red-badge shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span className="text-[13px] font-medium" style={{ color: "var(--red-badge)" }}>{erro}</span>
        </div>
      )}

      {/* Main Calendar Viewport */}
      {loading ? (
        <div className="glass-card flex items-center justify-center py-32" style={{ borderRadius: "16px" }}>
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--orange)" }} />
        </div>
      ) : (
        <>
          {/* =================================================================
              MONTH VIEW
              ================================================================= */}
          {view === "month" && (
            <div className="glass-card overflow-hidden" style={{ borderRadius: "16px" }}>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b" style={{ borderColor: "var(--border-subtle)", background: "rgba(148, 163, 184, 0.02)" }}>
                {weekDayLabels.map((lbl) => (
                  <div key={lbl} className="text-center py-3 text-[12px] font-bold tracking-wider uppercase text-txt-secondary">
                    {lbl}
                  </div>
                ))}
              </div>

              {/* Day cells grid */}
              <div className="grid grid-cols-7 auto-rows-[140px] divide-x divide-y divide-[var(--border-subtle)]">
                {diasNoMes.map(({ date, dateStr, isCurrentMonth }) => {
                  const omsDia = ordensPorData[dateStr] || [];
                  const isTodayCell = dateStr === getBrasiliaDateString(getSyncedDate());

                  return (
                    <div
                      key={dateStr}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => handleDrop(e, dateStr)}
                      className={`p-2 flex flex-col gap-1 transition-colors duration-150 relative group ${
                        isCurrentMonth ? "bg-transparent" : "bg-navy-950/20 opacity-50"
                      }`}
                      style={{
                        background: isTodayCell ? "rgba(232, 132, 44, 0.02)" : undefined,
                      }}
                    >
                      {/* Day Number Header */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[12px] font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                            isTodayCell
                              ? "bg-orange text-white"
                              : isCurrentMonth
                              ? "text-txt-primary"
                              : "text-txt-muted"
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {omsDia.length > 0 && (
                          <span className="text-[10px] text-txt-muted font-bold">
                            {omsDia.length} OM{omsDia.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>

                      {/* Card lists within cell */}
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                        {omsDia.map((om) => {
                          const status = getStatusDisplay(om);
                          const tipoStyle = getTipoManutencaoDisplay(om.tipo);
                          return (
                            <div
                              key={om.id}
                              draggable={isGestorOuAdmin}
                              onDragStart={(e) => handleDragStart(e, om)}
                              onClick={() => setSelectedOM(om)}
                              onMouseEnter={(e) => handleMouseEnterCard(e, om)}
                              onMouseLeave={handleMouseLeaveCard}
                              className="p-1.5 rounded-lg border text-[11px] cursor-grab active:cursor-grabbing hover:border-orange transition-all duration-150 select-none overflow-hidden"
                              style={{
                                background: tipoStyle.bg,
                                borderColor: tipoStyle.border,
                                borderLeft: `3px solid ${tipoStyle.color}`,
                              }}
                            >
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span className="font-bold font-mono text-txt-primary leading-none">
                                  {om.codigo}
                                </span>
                                <span
                                  className="text-[9px] font-bold uppercase px-1 py-0.2 rounded shrink-0 leading-none"
                                  style={{
                                    background: `${status.color}15`,
                                    color: status.color,
                                  }}
                                >
                                  {status.label}
                                </span>
                              </div>
                              <div className="text-txt-secondary font-semibold truncate leading-tight">
                                {om.equipamento.tag}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================================
              WEEK VIEW
              ================================================================= */}
          {view === "week" && (
            <div className="glass-card grid grid-cols-7 overflow-hidden divide-x divide-[var(--border-subtle)] min-h-[500px]" style={{ borderRadius: "16px" }}>
              {diasNaSemana.map(({ date, dateStr }) => {
                const omsDia = ordensPorData[dateStr] || [];
                const isTodayCell = dateStr === getBrasiliaDateString(getSyncedDate());
                const dayLabel = weekDayLabels[date.getDay()];

                return (
                  <div
                    key={dateStr}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, dateStr)}
                    className="flex flex-col p-3 transition-all"
                    style={{
                      background: isTodayCell ? "rgba(232, 132, 44, 0.02)" : undefined,
                    }}
                  >
                    {/* Header */}
                    <div className="border-b pb-3 mb-4 text-center" style={{ borderColor: "var(--border-subtle)" }}>
                      <p className="text-[11px] font-bold uppercase tracking-wider text-txt-secondary">
                        {dayLabel}
                      </p>
                      <p
                        className={`text-[20px] font-black w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-1 ${
                          isTodayCell ? "bg-orange text-white" : "text-txt-primary"
                        }`}
                      >
                        {date.getDate()}
                      </p>
                    </div>

                    {/* OMs list */}
                    <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[450px] pr-1">
                      {omsDia.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-subtle rounded-xl p-4 text-center">
                          <p className="text-[11px] text-txt-muted">Vazio</p>
                        </div>
                      ) : (
                        omsDia.map((om) => {
                          const status = getStatusDisplay(om);
                          const tipoStyle = getTipoManutencaoDisplay(om.tipo);
                          const time = om.dataInicioPrevisto
                            ? formatToBrasilia(om.dataInicioPrevisto, { hour: "2-digit", minute: "2-digit" })
                            : "—";

                          return (
                            <div
                              key={om.id}
                              draggable={isGestorOuAdmin}
                              onDragStart={(e) => handleDragStart(e, om)}
                              onClick={() => setSelectedOM(om)}
                              onMouseEnter={(e) => handleMouseEnterCard(e, om)}
                              onMouseLeave={handleMouseLeaveCard}
                              className="p-3 rounded-xl border text-[12px] cursor-grab active:cursor-grabbing hover:border-orange transition-all duration-150 select-none flex flex-col gap-1.5"
                              style={{
                                background: tipoStyle.bg,
                                borderColor: tipoStyle.border,
                                borderLeft: `3px solid ${tipoStyle.color}`,
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold font-mono text-txt-primary">{om.codigo}</span>
                                <span className="text-[10px] font-bold font-mono text-txt-muted">{time}</span>
                              </div>

                              <div>
                                <p className="font-bold text-txt-secondary truncate">{om.equipamento.nome}</p>
                                <p className="text-[10px] font-bold text-txt-muted">{om.equipamento.tag}</p>
                              </div>

                              <div className="flex items-center justify-between mt-1">
                                <span
                                  className="text-[9px] font-bold uppercase px-2 py-0.5 rounded"
                                  style={{ background: `${status.color}15`, color: status.color }}
                                >
                                  {status.label}
                                </span>
                                <span className="text-[9px] font-bold text-txt-muted">
                                  {PRIORIDADE_LABELS[om.prioridade]}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* =================================================================
              DAY VIEW
              ================================================================= */}
          {view === "day" && (
            <div className="glass-card p-6" style={{ borderRadius: "16px" }}>
              {(() => {
                const dateStr = getBrasiliaDateString(currentDate);
                const omsDia = ordensPorData[dateStr] || [];

                return (
                  <div>
                    <div className="flex items-center justify-between border-b pb-4 mb-6" style={{ borderColor: "var(--border-subtle)" }}>
                      <div>
                        <h3 className="text-[18px] font-bold text-txt-primary">Cronograma do Dia</h3>
                        <p className="text-[13px] text-txt-muted">
                          {omsDia.length} ordem{omsDia.length !== 1 ? "ns" : ""} programada{omsDia.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    {omsDia.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <svg className="w-12 h-12 mb-3 text-txt-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                        </svg>
                        <p className="text-[15px] font-semibold text-txt-secondary">Nenhuma ordem para hoje</p>
                        <p className="text-[12px] text-txt-muted">Use as setas para navegar ou planeje novas OMs.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 max-w-4xl">
                        {omsDia.map((om) => {
                          const status = getStatusDisplay(om);
                          const tipoStyle = getTipoManutencaoDisplay(om.tipo);
                          const time = om.dataInicioPrevisto
                            ? formatToBrasilia(om.dataInicioPrevisto, { hour: "2-digit", minute: "2-digit" })
                            : "—";

                          return (
                            <div
                              key={om.id}
                              onClick={() => setSelectedOM(om)}
                              className="info-sub-card flex items-start gap-4 cursor-pointer hover:border-orange transition-all duration-150 border-l-4"
                              style={{
                                borderLeftColor: tipoStyle.color,
                              }}
                            >
                              {/* Time Column */}
                              <div className="shrink-0 text-center py-1">
                                <p className="text-[16px] font-bold font-mono text-txt-primary">{time}</p>
                                <span className="text-[10px] font-bold text-txt-muted uppercase tracking-wider">Hora</span>
                              </div>

                              {/* Main Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono font-bold text-orange text-[14px]">
                                    {om.codigo}
                                  </span>
                                  <span
                                    className="text-[9px] font-bold uppercase px-2 py-0.5 rounded"
                                    style={{ background: `${status.color}15`, color: status.color }}
                                  >
                                    {status.label}
                                  </span>
                                  <span
                                    className="text-[9px] font-bold uppercase px-2 py-0.5 rounded"
                                    style={{
                                      background: tipoStyle.bg,
                                      color: tipoStyle.color,
                                    }}
                                  >
                                    {TIPO_MANUTENCAO_LABELS[om.tipo]}
                                  </span>
                                </div>

                                <h4 className="text-[16px] font-bold text-txt-primary mb-1">
                                  {om.equipamento.nome} ({om.equipamento.tag})
                                </h4>
                                <p className="text-[13px] text-txt-muted line-clamp-2">{om.descricao}</p>

                                <div className="flex flex-wrap items-center gap-4 text-[12px] text-txt-muted mt-3 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                                  <span>
                                    <strong>Solicitante:</strong> {om.solicitante.nome}
                                  </span>
                                  <span>
                                    <strong>Técnicos:</strong> {om.tecnicos.map((t) => t.nome).join(", ") || "Nenhum"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* =================================================================
          HOVER POPOVER (TOOLTIP) - DESKTOP ONLY
          ================================================================= */}
      {hoveredOM && view === "month" && (
        <div
          className="fixed z-50 pointer-events-none w-72 p-4 rounded-xl border shadow-xl flex flex-col gap-2 transition-all duration-150 animate-fade-in"
          style={{
            left: `${hoverPosition.x}px`,
            top: `${hoverPosition.y}px`,
            transform: "translate(-50%, -100%)",
            background: "var(--bg-secondary)",
            borderColor: "var(--border-accent)",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div className="flex items-center justify-between border-b pb-1.5" style={{ borderColor: "var(--border-subtle)" }}>
            <span className="font-mono font-black text-orange text-[12px]">{hoveredOM.codigo}</span>
            <span
              className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded"
              style={{
                background: `${getStatusDisplay(hoveredOM).color}15`,
                color: getStatusDisplay(hoveredOM).color,
              }}
            >
              {getStatusDisplay(hoveredOM).label}
            </span>
          </div>

          <div>
            <p className="text-[12px] font-bold text-txt-primary truncate">
              {hoveredOM.equipamento.nome}
            </p>
            <p className="text-[10px] font-bold text-txt-muted mb-1">{hoveredOM.equipamento.tag}</p>
            <p className="text-[11px] text-txt-muted line-clamp-3 leading-relaxed">
              {hoveredOM.descricao}
            </p>
          </div>

          <div className="flex flex-col gap-0.5 text-[10px] text-txt-muted border-t pt-1.5" style={{ borderColor: "var(--border-subtle)" }}>
            <p>
              <strong>Horário:</strong>{" "}
              {hoveredOM.dataInicioPrevisto
                ? formatToBrasilia(hoveredOM.dataInicioPrevisto, { hour: "2-digit", minute: "2-digit" })
                : "—"}
            </p>
            <p>
              <strong>Técnico:</strong>{" "}
              {hoveredOM.tecnicos.map((t) => t.nome.split(" ")[0]).join(", ") || "—"}
            </p>
          </div>
        </div>
      )}

      {/* =================================================================
          OM QUICK DETAIL MODAL
          ================================================================= */}
      {selectedOM && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedOM(null)}
        >
          <div
            className="glass-card w-full max-w-lg overflow-hidden animate-fade-in-up"
            style={{ background: "var(--bg-secondary)", borderRadius: "16px", animationDuration: "0.2s" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border-subtle)" }}>
              <div className="flex items-center gap-2">
                <span className="font-mono font-black text-orange text-[18px]">
                  {selectedOM.codigo}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase border"
                  style={{
                    background: `${getStatusDisplay(selectedOM).color}15`,
                    color: getStatusDisplay(selectedOM).color,
                    borderColor: getStatusDisplay(selectedOM).color,
                  }}
                >
                  {getStatusDisplay(selectedOM).label}
                </span>
              </div>
              <button
                onClick={() => setSelectedOM(null)}
                className="text-txt-muted hover:text-txt-primary p-1 rounded-lg cursor-pointer"
                aria-label="Fechar modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Descrição */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-txt-muted mb-1">
                  Descrição do Plano
                </h4>
                <p className="text-[14px] text-txt-secondary leading-relaxed bg-[rgba(148,163,184,0.02)] p-3 rounded-lg border border-subtle">
                  {selectedOM.descricao}
                </p>
              </div>

              {/* Equipamento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-txt-muted mb-1">
                    Equipamento
                  </h4>
                  <p className="text-[14px] font-bold text-txt-primary">
                    {selectedOM.equipamento.nome}
                  </p>
                  <span
                    className="inline-block text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded uppercase mt-0.5"
                    style={{ background: "var(--cyan-badge-bg)", color: "var(--cyan-badge)" }}
                  >
                    {selectedOM.equipamento.tag}
                  </span>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-txt-muted mb-1">
                    Tipo de Manutenção
                  </h4>
                  <span
                    className="inline-block text-[12px] font-bold tracking-wider px-2 py-0.5 rounded uppercase mt-0.5"
                    style={{
                      background: getTipoManutencaoDisplay(selectedOM.tipo).bg,
                      color: getTipoManutencaoDisplay(selectedOM.tipo).color,
                    }}
                  >
                    {TIPO_MANUTENCAO_LABELS[selectedOM.tipo]}
                  </span>
                </div>
              </div>

              {/* Responsável e Data */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-txt-muted mb-1">
                    Horário Previsto
                  </h4>
                  <p className="text-[14px] font-bold text-txt-primary">
                    {selectedOM.dataInicioPrevisto
                      ? formatToBrasilia(selectedOM.dataInicioPrevisto, {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) + " BRT"
                      : "Sem horário definido"}
                  </p>
                </div>

                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-txt-muted mb-1">
                    Técnico Responsável
                  </h4>
                  <p className="text-[14px] font-bold text-txt-primary">
                    {selectedOM.tecnicos.map((t) => t.nome).join(", ") || "—"}
                  </p>
                </div>
              </div>

              {/* Observações adicionais */}
              {selectedOM.observacoes && (
                <div className="border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-txt-muted mb-1">
                    Observações
                  </h4>
                  <p className="text-[13px] text-txt-secondary leading-relaxed bg-[rgba(232,132,44,0.01)] p-3 rounded-lg border border-dashed border-accent">
                    {selectedOM.observacoes}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t flex gap-3" style={{ borderColor: "var(--border-subtle)" }}>
              <button
                onClick={() => setSelectedOM(null)}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium cursor-pointer"
                style={{
                  background: "rgba(148,163,184,0.06)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Voltar
              </button>
              <button
                onClick={() => {
                  setSelectedOM(null);
                  router.push(`/ordens-manutencao?busca=${selectedOM.codigo}`);
                }}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-bold cursor-pointer text-white text-center flex items-center justify-center gap-2"
                style={{ background: "var(--orange)" }}
              >
                Ver OM Completa
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          DRAG & DROP CONFIRMATION MODAL
          ================================================================= */}
      {omParaReagendar && novaDataReagendar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div
            className="glass-card p-6 w-full max-w-md animate-fade-in-up"
            style={{ background: "var(--bg-secondary)", borderRadius: "16px", animationDuration: "0.2s" }}
          >
            <h3 className="text-[18px] font-bold mb-2 text-txt-primary flex items-center gap-2">
              <svg className="w-5 h-5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              Confirmar Reagendamento
            </h3>
            
            <p className="text-[14px] text-txt-secondary mb-5 leading-relaxed">
              Deseja alterar a data da OM <strong className="text-orange">{omParaReagendar.codigo}</strong> para o dia{" "}
              <strong className="text-txt-primary">
                {formatToBrasilia(novaDataReagendar, { day: "2-digit", month: "2-digit", year: "numeric" })}
              </strong>?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setOmParaReagendar(null);
                  setNovaDataReagendar(null);
                }}
                disabled={reagendando}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-medium cursor-pointer"
                style={{
                  background: "rgba(148,163,184,0.06)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                Cancelar
              </button>
              
              <button
                onClick={confirmarReagendamento}
                disabled={reagendando}
                className="flex-1 py-2.5 rounded-xl text-[14px] font-bold cursor-pointer text-white flex items-center justify-center gap-2"
                style={{ background: "var(--orange)" }}
              >
                {reagendando ? (
                  <>
                    <div className="w-4 h-4 rounded-full border border-t-transparent animate-spin" style={{ borderColor: "#fff" }} />
                    Salvando...
                  </>
                ) : (
                  "Confirmar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
