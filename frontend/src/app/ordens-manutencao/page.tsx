/**
 * Página: Ordens de Manutenção
 *
 * Lista e gerencia as Ordens de Manutenção do sistema.
 * - GESTOR/ADMIN: vê todas as OMs e pode criar/editar/deletar
 * - TECNICO: vê apenas suas OMs atribuídas, pode atualizar status
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { OrdemManutencao, StatusOM } from "@/types/om.types";
import type { Usuario } from "@/types/usuario.types";
import {
  TIPO_MANUTENCAO_LABELS,
  PRIORIDADE_LABELS,
  STATUS_OM_LABELS,
  STATUS_OM_COLORS,
  PRIORIDADE_COLORS,
} from "@/types/om.types";
import {
  listOrdensManutencaoApi,
  deleteOrdemManutencaoApi,
  updateOrdemManutencaoApi,
} from "@/lib/api/ordens-manutencao";
import OrdemManutencaoFormModal from "@/components/domain/OrdemManutencaoFormModal";

const STATUS_OPTIONS: { value: StatusOM; label: string }[] = [
  { value: "ABERTA", label: "Aberta" },
  { value: "AGUARDANDO_INICIO", label: "Aguardando Início" },
  { value: "EM_EXECUCAO", label: "Em Execução" },
  { value: "PAUSADA", label: "Pausada" },
  { value: "CONCLUIDA", label: "Concluída" },
  { value: "CANCELADA", label: "Cancelada" },
];

export default function OrdensManutencaoPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [ordens, setOrdens] = useState<OrdemManutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<StatusOM | "">("");
  const [busca, setBusca] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [omParaEditar, setOmParaEditar] = useState<OrdemManutencao | null>(null);
  const [omParaDeletar, setOmParaDeletar] = useState<OrdemManutencao | null>(null);
  const [deletando, setDeletando] = useState(false);
  const [statusEditando, setStatusEditando] = useState<{ id: string; status: StatusOM } | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("usuario");
    if (!stored) { router.push("/"); return; }
    try { setUsuario(JSON.parse(stored)); } catch { router.push("/"); }
  }, [router]);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    try {
      const oms = await listOrdensManutencaoApi(filtroStatus ? { status: filtroStatus } : undefined);
      setOrdens(oms);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao carregar ordens de manutenção.");
    } finally {
      setLoading(false);
    }
  }, [filtroStatus]);

  useEffect(() => { carregar(); }, [carregar]);

  const isGestorOuAdmin = usuario?.nivel === "GESTOR" || usuario?.nivel === "ADMIN";
  const isTecnico = usuario?.nivel === "TECNICO";

  const ordensFiltradas = ordens.filter(om => {
    const q = busca.toLowerCase();
    return (
      om.codigo.toLowerCase().includes(q) ||
      om.equipamento.nome.toLowerCase().includes(q) ||
      om.equipamento.tag.toLowerCase().includes(q) ||
      om.descricao.toLowerCase().includes(q) ||
      om.tecnicos.some(t => t.nome.toLowerCase().includes(q))
    );
  });

  async function handleDeletar() {
    if (!omParaDeletar) return;
    setDeletando(true);
    try {
      await deleteOrdemManutencaoApi(omParaDeletar.id);
      setOrdens(prev => prev.filter(o => o.id !== omParaDeletar.id));
      setOmParaDeletar(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao deletar OM.");
    } finally {
      setDeletando(false);
    }
  }

  async function handleStatusChange(om: OrdemManutencao, novoStatus: StatusOM) {
    setStatusEditando({ id: om.id, status: novoStatus });
    try {
      const atualizada = await updateOrdemManutencaoApi(om.id, { status: novoStatus });
      setOrdens(prev => prev.map(o => (o.id === atualizada.id ? atualizada : o)));
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao atualizar status.");
    } finally {
      setStatusEditando(null);
    }
  }

  const stats = {
    total: ordens.length,
    abertas: ordens.filter(o => o.status === "ABERTA" || o.status === "AGUARDANDO_INICIO").length,
    emExecucao: ordens.filter(o => o.status === "EM_EXECUCAO").length,
    criticas: ordens.filter(o => o.prioridade === "CRITICA").length,
  };

  return (
    <div className="w-full px-10 py-10 animate-fade-in-up" style={{ animationFillMode: "both" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-[3px] rounded-full" style={{ background: "#E8842C" }} />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase" style={{ color: "#E8842C" }}>
              Módulo PCM
            </span>
          </div>
          <h1 className="text-[28px] font-bold tracking-tight mb-1" style={{ color: "#F1F5F9" }}>
            Ordens de Manutenção
          </h1>
          <p className="text-[14px]" style={{ color: "#64748B" }}>
            {isTecnico ? "Suas ordens atribuídas, ordenadas por prioridade." : "Gerencie e acompanhe todas as OMs da planta."}
          </p>
        </div>
        {isGestorOuAdmin && (
          <button
            onClick={() => { setOmParaEditar(null); setShowModal(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-200 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #E8842C, #D97706)", color: "#fff" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(232,132,44,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nova OM
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total de OMs", value: stats.total, color: "#22A0B4" },
          { label: "Abertas", value: stats.abertas, color: "#FBBF24" },
          { label: "Em Execução", value: stats.emExecucao, color: "#4ADE80" },
          { label: "Críticas", value: stats.criticas, color: "#F87171" },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card px-5 py-5" style={{ borderRadius: "14px" }}>
            <p className="text-[28px] font-bold mb-0.5" style={{ color: kpi.color }}>{kpi.value}</p>
            <p className="text-[13px]" style={{ color: "#64748B" }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#64748B" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por código, equipamento, técnico..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[14px] outline-none"
            style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(148,163,184,0.1)", color: "#F1F5F9" }}
          />
        </div>
        <select
          value={filtroStatus}
          onChange={e => setFiltroStatus(e.target.value as StatusOM | "")}
          className="px-4 py-2.5 rounded-xl text-[14px] outline-none cursor-pointer"
          style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(148,163,184,0.1)", color: filtroStatus ? "#F1F5F9" : "#64748B" }}
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={carregar} className="px-4 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-colors"
          style={{ background: "rgba(148,163,184,0.06)", color: "#64748B", border: "1px solid rgba(148,163,184,0.1)" }}>
          Atualizar
        </button>
      </div>

      {/* Erro */}
      {erro && (
        <div className="mb-5 px-4 py-3 rounded-xl" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
          <p className="text-[13px]" style={{ color: "#F87171" }}>{erro}</p>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "#E8842C", borderTopColor: "transparent" }} />
        </div>
      ) : ordensFiltradas.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20" style={{ borderRadius: "16px" }}>
          <svg className="w-14 h-14 mb-4" fill="none" viewBox="0 0 24 24" stroke="#334155" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
          </svg>
          <p className="text-[16px] font-semibold mb-1" style={{ color: "#475569" }}>
            {busca || filtroStatus ? "Nenhuma OM encontrada com esses filtros" : "Nenhuma Ordem de Manutenção"}
          </p>
          <p className="text-[13px]" style={{ color: "#334155" }}>
            {isGestorOuAdmin && !busca && !filtroStatus ? 'Clique em "Nova OM" para emitir a primeira ordem.' : "Tente ajustar os filtros de busca."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ordensFiltradas.map(om => {
            const prioridadeCor = PRIORIDADE_COLORS[om.prioridade];
            const statusCor = STATUS_OM_COLORS[om.status];
            const editandoEste = statusEditando?.id === om.id;

            return (
              <div
                key={om.id}
                className="glass-card px-6 py-5 transition-all duration-200"
                style={{ borderRadius: "14px", borderLeft: `3px solid ${prioridadeCor}` }}
              >
                <div className="flex items-start gap-4">
                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[13px] font-bold font-mono" style={{ color: "#E8842C" }}>{om.codigo}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase"
                        style={{ background: `${prioridadeCor}15`, color: prioridadeCor }}>
                        {PRIORIDADE_LABELS[om.prioridade]}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase"
                        style={{ background: `${statusCor}15`, color: statusCor }}>
                        {STATUS_OM_LABELS[om.status]}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-medium"
                        style={{ background: "rgba(148,163,184,0.08)", color: "#64748B" }}>
                        {TIPO_MANUTENCAO_LABELS[om.tipo]}
                      </span>
                    </div>

                    <h3 className="text-[15px] font-semibold mb-1 line-clamp-2" style={{ color: "#F1F5F9" }}>
                      {om.equipamento.nome}
                      <span className="text-[13px] font-normal ml-2" style={{ color: "#64748B" }}>({om.equipamento.tag})</span>
                    </h3>
                    <p className="text-[13px] mb-3 line-clamp-2" style={{ color: "#64748B" }}>{om.descricao}</p>

                    <div className="flex flex-wrap items-center gap-4 text-[12px]" style={{ color: "#475569" }}>
                      <span>
                        <span style={{ color: "#334155" }}>Solicitante:</span>{" "}
                        <span style={{ color: "#94A3B8" }}>{om.solicitante.nome}</span>
                      </span>
                      <span>
                        <span style={{ color: "#334155" }}>Técnicos:</span>{" "}
                        <span style={{ color: "#94A3B8" }}>{om.tecnicos.map(t => t.nome.split(" ")[0]).join(", ") || "—"}</span>
                      </span>
                      {om.dataInicioPrevisto && (
                        <span>
                          <span style={{ color: "#334155" }}>Início previsto:</span>{" "}
                          <span style={{ color: "#94A3B8" }}>
                            {new Date(om.dataInicioPrevisto).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </span>
                      )}
                      <span style={{ color: "#334155" }}>
                        {new Date(om.criadoEm).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    {om.materiaisNecessarios?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {om.materiaisNecessarios.slice(0, 4).map(m => (
                          <span key={m} className="px-2 py-0.5 rounded text-[11px]"
                            style={{ background: "rgba(34,160,180,0.07)", color: "#22A0B4", border: "1px solid rgba(34,160,180,0.15)" }}>
                            {m}
                          </span>
                        ))}
                        {om.materiaisNecessarios.length > 4 && (
                          <span className="px-2 py-0.5 rounded text-[11px]" style={{ color: "#475569" }}>
                            +{om.materiaisNecessarios.length - 4} mais
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {/* Dropdown de status */}
                    <select
                      value={om.status}
                      onChange={e => handleStatusChange(om, e.target.value as StatusOM)}
                      disabled={editandoEste}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-medium outline-none cursor-pointer transition-opacity"
                      style={{
                        background: `${statusCor}10`,
                        border: `1px solid ${statusCor}30`,
                        color: statusCor,
                        opacity: editandoEste ? 0.5 : 1,
                      }}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>

                    {isGestorOuAdmin && (
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => { setOmParaEditar(om); setShowModal(true); }}
                          className="flex-1 px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors"
                          style={{ background: "rgba(34,160,180,0.07)", color: "#22A0B4", border: "1px solid rgba(34,160,180,0.2)" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(34,160,180,0.14)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(34,160,180,0.07)"; }}
                        >Editar</button>
                        <button
                          onClick={() => setOmParaDeletar(om)}
                          className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer transition-colors"
                          style={{ background: "rgba(248,113,113,0.07)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)" }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.14)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "rgba(248,113,113,0.07)"; }}
                        >Deletar</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de criação/edição */}
      <OrdemManutencaoFormModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setOmParaEditar(null); }}
        onSuccess={om => {
          if (omParaEditar) {
            setOrdens(prev => prev.map(o => o.id === om.id ? om : o));
          } else {
            setOrdens(prev => [om, ...prev]);
          }
        }}
        omParaEditar={omParaEditar}
      />

      {/* Modal de confirmação de exclusão */}
      {omParaDeletar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(7,14,27,0.85)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-md p-6 rounded-2xl"
            style={{ background: "#0F1C32", border: "1px solid rgba(148,163,184,0.1)" }}>
            <h3 className="text-[17px] font-bold mb-2" style={{ color: "#F1F5F9" }}>Confirmar Exclusão</h3>
            <p className="text-[14px] mb-1" style={{ color: "#64748B" }}>
              Deseja remover a ordem <strong style={{ color: "#E8842C" }}>{omParaDeletar.codigo}</strong>?
            </p>
            <p className="text-[13px] mb-6" style={{ color: "#475569" }}>Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setOmParaDeletar(null)} className="flex-1 py-2.5 rounded-xl text-[14px] font-medium cursor-pointer"
                style={{ background: "rgba(148,163,184,0.06)", color: "#64748B", border: "1px solid rgba(148,163,184,0.1)" }}>
                Cancelar
              </button>
              <button onClick={handleDeletar} disabled={deletando} className="flex-1 py-2.5 rounded-xl text-[14px] font-bold cursor-pointer"
                style={{ background: "rgba(248,113,113,0.15)", color: "#F87171", border: "1px solid rgba(248,113,113,0.2)" }}>
                {deletando ? "Removendo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
