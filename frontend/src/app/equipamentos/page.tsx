"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { listEquipamentosApi, deleteEquipamentoApi } from "@/lib/api/equipamentos";
import type { Equipamento, StatusEquipamento } from "@/types/equipamento.types";
import type { NivelUsuario } from "@/types/usuario.types";
import EquipamentoFormModal from "@/components/domain/EquipamentoFormModal";

/** Mapa de cores e labels para cada status operacional */
const statusConfig: Record<StatusEquipamento, { label: string; color: string; bg: string }> = {
  OPERANDO: { label: "Operando", color: "var(--green-badge)", bg: "var(--green-badge-bg)" },
  PARADO: { label: "Parado", color: "var(--red-badge)", bg: "var(--red-badge-bg)" },
  MANUTENCAO: { label: "Manutenção", color: "var(--yellow-badge)", bg: "var(--yellow-badge-bg)" },
};

/** Calcula o desgaste percentual de um componente */
function calcDesgaste(horas: number, vidaUtil: number): number {
  if (vidaUtil <= 0) return 0;
  return Math.min((horas / vidaUtil) * 100, 100);
}

/** Retorna a cor do indicador de desgaste (verde → amarelo → vermelho) */
function desgasteColor(pct: number): string {
  if (pct >= 85) return "var(--red-badge)";
  if (pct >= 60) return "var(--yellow-badge)";
  return "var(--green-badge)";
}

export default function EquipamentosPage() {
  const router = useRouter();
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
  const [userNivel, setUserNivel] = useState<NivelUsuario>("TECNICO");
  const [modalOpen, setModalOpen] = useState(false);
  const [editEquip, setEditEquip] = useState<Equipamento | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canWrite = userNivel === "ADMIN" || userNivel === "GESTOR";

  useEffect(() => {
    const stored = localStorage.getItem("usuario");
    if (stored) {
      try { setUserNivel(JSON.parse(stored).nivel); } catch { /* noop */ }
    }
    fetchEquipamentos();
  }, []);

  async function fetchEquipamentos() {
    setLoading(true);
    setErro("");
    try {
      const data = await listEquipamentosApi();
      setEquipamentos(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar equipamentos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteEquipamentoApi(deleteId);
      setDeleteId(null);
      fetchEquipamentos();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao remover.");
    }
  }

  const filtered = useMemo(() => {
    return equipamentos.filter((eq) => {
      const matchBusca = busca === "" ||
        eq.nome.toLowerCase().includes(busca.toLowerCase()) ||
        eq.tag.toLowerCase().includes(busca.toLowerCase()) ||
        eq.tipo.toLowerCase().includes(busca.toLowerCase()) ||
        eq.fabricante.toLowerCase().includes(busca.toLowerCase());
      const matchStatus = filtroStatus === "TODOS" || eq.status === filtroStatus;
      return matchBusca && matchStatus;
    });
  }, [equipamentos, busca, filtroStatus]);

  const counts = useMemo(() => ({
    total: equipamentos.length,
    operando: equipamentos.filter(e => e.status === "OPERANDO").length,
    parado: equipamentos.filter(e => e.status === "PARADO").length,
    manutencao: equipamentos.filter(e => e.status === "MANUTENCAO").length,
  }), [equipamentos]);

  return (
    <div className="page-container animate-fade-in-up" style={{ animationFillMode: "both", maxWidth: "1400px" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-[3px] rounded-full" style={{ background: "var(--orange)" }} />
            <span className="text-[12px] font-semibold tracking-[0.2em] uppercase text-orange">
              Gestão de Ativos
            </span>
          </div>
          <h1 className="text-[32px] font-bold tracking-tight text-txt-primary">
            Equipamentos
          </h1>
          <p className="text-[15px] mt-2 text-txt-muted" aria-live="polite">
            {counts.total} equipamento{counts.total !== 1 ? "s" : ""} cadastrado{counts.total !== 1 ? "s" : ""}
          </p>
        </div>

        {canWrite && (
          <button
            onClick={() => { setEditEquip(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-3 rounded-lg text-[14px] font-semibold text-white transition-all duration-200 cursor-pointer"
            style={{ background: "var(--orange)", boxShadow: "0 4px 16px var(--orange-glow)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--orange-dark)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--orange)"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Novo Equipamento
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-5 mb-10">
        {[
          { label: "Total", value: counts.total, color: "var(--text-secondary)", bg: "var(--border-subtle)", icon: "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" },
          { label: "Operando", value: counts.operando, color: "var(--green-badge)", bg: "var(--green-badge-bg)", icon: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
          { label: "Parado", value: counts.parado, color: "var(--red-badge)", bg: "var(--red-badge-bg)", icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" },
          { label: "Manutenção", value: counts.manutencao, color: "var(--yellow-badge)", bg: "var(--yellow-badge-bg)", icon: "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card p-space-lg flex items-center gap-5" style={{ borderRadius: "14px" }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: kpi.bg }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={kpi.color} strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={kpi.icon} />
              </svg>
            </div>
            <div>
              <p className="text-[28px] font-bold leading-none mb-1.5 text-txt-primary">{kpi.value}</p>
              <p className="text-[14px] text-txt-muted">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <div className="search-input-wrapper flex-1" style={{ minWidth: "260px", maxWidth: "480px" }}>
          <svg className="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, TAG, tipo ou fabricante..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="search-input"
            aria-label="Buscar equipamentos"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {["TODOS", "OPERANDO", "PARADO", "MANUTENCAO"].map(s => (
            <button key={s} onClick={() => setFiltroStatus(s)}
              className={`filter-chip ${filtroStatus === s ? "active" : ""}`}
            >
              {s === "TODOS" ? "Todos" : statusConfig[s as StatusEquipamento]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {/* Error message */}
      {erro && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-6" style={{ background: "var(--red-badge-bg)", border: "1px solid var(--red-badge-border)", color: "var(--red-badge)" }}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>{erro}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <svg className="w-8 h-8 animate-spin" style={{ color: "var(--orange)" }} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="#334155" strokeWidth={0.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
          </svg>
          <p className="text-[16px] font-medium mb-1 text-txt-secondary">Nenhum equipamento encontrado</p>
          <p className="text-[13px] text-txt-muted">
            {busca || filtroStatus !== "TODOS" ? "Tente ajustar os filtros de busca." : "Cadastre o primeiro equipamento para começar."}
          </p>
        </div>
      )}

      {/* Equipment cards grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" role="list">
          {filtered.map((eq, i) => {
            const st = statusConfig[eq.status];
            const maxDesgaste = eq.componentes.length > 0
              ? Math.max(...eq.componentes.map(c => calcDesgaste(c.horasOperacionais, c.vidaUtilNominal)))
              : 0;

            return (
              <div
                key={eq.id}
                className="glass-card p-space-lg cursor-pointer group"
                style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "both" }}
                onClick={() => router.push(`/equipamentos/${eq.id}`)}
              >
                {/* Card header: TAG + Status */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-md text-[13px] font-bold tracking-wider" style={{ background: "var(--cyan-badge-bg)", color: "var(--cyan-badge)", border: "1px solid var(--cyan-badge-border)" }}>
                    {eq.tag}
                  </span>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: st.bg, color: st.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.color }} />
                    {st.label}
                  </span>
                </div>

                {/* Equipment name + type */}
                <h3 className="text-[17px] font-semibold mb-1.5 leading-snug group-hover:text-orange-light transition-colors text-txt-primary">
                  {eq.nome}
                </h3>
                <p className="text-[13px] mb-6 text-txt-muted">{eq.tipo}</p>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest mb-1.5 text-txt-muted">Fabricante</p>
                    <p className="text-[14px] font-medium text-txt-secondary">{eq.fabricante}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-widest mb-1.5 text-txt-muted">Modelo</p>
                    <p className="text-[14px] font-medium text-txt-secondary">{eq.modelo}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] uppercase tracking-widest mb-1.5 text-txt-muted">Localização</p>
                    <p className="text-[14px] font-medium truncate text-txt-secondary">{eq.localizacao}</p>
                  </div>
                </div>

                {/* Components summary + wear bar */}
                <div className="pt-6" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[13px] text-txt-muted">
                      {eq.componentes.length} componente{eq.componentes.length !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[13px] font-semibold" style={{ color: desgasteColor(maxDesgaste) }}>
                      {maxDesgaste > 0 ? `${maxDesgaste.toFixed(0)}% desgaste máx.` : "—"}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{ background: "rgba(148, 163, 184, 0.1)" }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${maxDesgaste}%`, background: desgasteColor(maxDesgaste) }} />
                  </div>
                </div>

                {/* Action buttons (admin/gestor only) */}
                {canWrite && (
                  <div className="flex items-center gap-3 mt-5 pt-4" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    <button
                      onClick={e => { e.stopPropagation(); setEditEquip(eq); setModalOpen(true); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer"
                      style={{ color: "var(--text-secondary)", background: "rgba(148, 163, 184, 0.05)", border: "1px solid var(--border-subtle)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "var(--orange-glow)"; e.currentTarget.style.color = "var(--orange)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(148, 163, 184, 0.05)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteId(eq.id); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-md text-[13px] font-medium transition-all duration-200 cursor-pointer"
                      style={{ color: "var(--text-secondary)", background: "rgba(148, 163, 184, 0.05)", border: "1px solid var(--border-subtle)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"; e.currentTarget.style.color = "#EF4444"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(148, 163, 184, 0.05)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="glass-card p-space-xl max-w-md w-full mx-4" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--red-badge-bg)" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="var(--red-badge)" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z" />
                </svg>
              </div>
              <h3 className="text-[18px] font-bold text-txt-primary">Confirmar exclusão</h3>
            </div>
            <p className="text-[14px] mb-6 text-txt-secondary">
              Tem certeza que deseja remover este equipamento? Todos os componentes associados também serão removidos. Esta ação é irreversível.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)}
                className="px-5 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-200"
                style={{ color: "var(--text-secondary)", background: "rgba(148, 163, 184, 0.08)", border: "1px solid var(--border-subtle)" }}>
                Cancelar
              </button>
              <button onClick={handleDelete}
                className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all duration-200"
                style={{ background: "#EF4444" }}>
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit modal */}
      {modalOpen && (
        <EquipamentoFormModal
          equipamento={editEquip}
          onClose={() => { setModalOpen(false); setEditEquip(null); }}
          onSaved={() => { setModalOpen(false); setEditEquip(null); fetchEquipamentos(); }}
        />
      )}
    </div>
  );
}
