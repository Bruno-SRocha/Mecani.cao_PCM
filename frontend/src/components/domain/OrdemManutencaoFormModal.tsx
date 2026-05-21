/**
 * Componente: Formulário Modal de Ordem de Manutenção
 *
 * Modal para criação e edição de OMs. Implementa todos os critérios de aceitação:
 * - AC2: Seleção de equipamento via dropdown com busca
 * - AC3: Tipo de manutenção obrigatório
 * - AC4: Designação de um ou mais técnicos
 * - AC5: Campo de prioridade
 * - Materiais, data prevista e observações
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import type { OrdemManutencao, TipoManutencao, PrioridadeOM, CreateOMRequest } from "@/types/om.types";
import type { Equipamento } from "@/types/equipamento.types";
import type { Usuario } from "@/types/usuario.types";
import { listEquipamentosApi } from "@/lib/api/equipamentos";
import { listTecnicosApi } from "@/lib/api/ordens-manutencao";
import { createOrdemManutencaoApi, updateOrdemManutencaoApi } from "@/lib/api/ordens-manutencao";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (om: OrdemManutencao) => void;
  omParaEditar?: OrdemManutencao | null;
}

const TIPOS: { value: TipoManutencao; label: string; color: string }[] = [
  { value: "PREVENTIVA", label: "Preventiva", color: "#22A0B4" },
  { value: "CORRETIVA_PROGRAMADA", label: "Corretiva Programada", color: "#FBBF24" },
  { value: "CORRETIVA_EMERGENCIAL", label: "Corretiva Emergencial", color: "#F87171" },
  { value: "PREDITIVA", label: "Preditiva", color: "#A78BFA" },
];

const PRIORIDADES: { value: PrioridadeOM; label: string; color: string }[] = [
  { value: "BAIXA", label: "Baixa", color: "#4ADE80" },
  { value: "MEDIA", label: "Média", color: "#FBBF24" },
  { value: "ALTA", label: "Alta", color: "#F97316" },
  { value: "CRITICA", label: "Crítica", color: "#F87171" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(15,23,42,0.6)",
  border: "1px solid rgba(148,163,184,0.12)",
  borderRadius: "10px",
  color: "#F1F5F9",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "#94A3B8",
  marginBottom: "6px",
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

export default function OrdemManutencaoFormModal({ isOpen, onClose, onSuccess, omParaEditar }: Props) {
  const isEdicao = !!omParaEditar;

  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [tecnicos, setTecnicos] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [buscaEquip, setBuscaEquip] = useState("");
  const [novoMaterial, setNovoMaterial] = useState("");

  const [form, setForm] = useState({
    equipamentoId: "",
    descricao: "",
    tipo: "" as TipoManutencao | "",
    prioridade: "MEDIA" as PrioridadeOM,
    dataInicioPrevisto: "",
    tecnicoIds: [] as string[],
    materiaisNecessarios: [] as string[],
    observacoes: "",
  });

  const carregar = useCallback(async () => {
    try {
      const [equips, tecns] = await Promise.all([
        listEquipamentosApi(),
        listTecnicosApi(),
      ]);
      setEquipamentos(equips);
      setTecnicos(tecns);
    } catch {
      /* silencia — mostra erro só ao submeter */
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    carregar();
    if (omParaEditar) {
      setForm({
        equipamentoId: omParaEditar.equipamento.id,
        descricao: omParaEditar.descricao,
        tipo: omParaEditar.tipo,
        prioridade: omParaEditar.prioridade,
        dataInicioPrevisto: omParaEditar.dataInicioPrevisto
          ? new Date(omParaEditar.dataInicioPrevisto).toISOString().slice(0, 16)
          : "",
        tecnicoIds: omParaEditar.tecnicos.map((t) => t.id),
        materiaisNecessarios: omParaEditar.materiaisNecessarios ?? [],
        observacoes: omParaEditar.observacoes ?? "",
      });
    } else {
      setForm({
        equipamentoId: "",
        descricao: "",
        tipo: "",
        prioridade: "MEDIA",
        dataInicioPrevisto: "",
        tecnicoIds: [],
        materiaisNecessarios: [],
        observacoes: "",
      });
    }
    setErro(null);
  }, [isOpen, omParaEditar, carregar]);

  function toggleTecnico(id: string) {
    setForm((prev) => ({
      ...prev,
      tecnicoIds: prev.tecnicoIds.includes(id)
        ? prev.tecnicoIds.filter((t) => t !== id)
        : [...prev.tecnicoIds, id],
    }));
  }

  function adicionarMaterial() {
    const m = novoMaterial.trim();
    if (!m || form.materiaisNecessarios.includes(m)) return;
    setForm((prev) => ({ ...prev, materiaisNecessarios: [...prev.materiaisNecessarios, m] }));
    setNovoMaterial("");
  }

  function removerMaterial(m: string) {
    setForm((prev) => ({
      ...prev,
      materiaisNecessarios: prev.materiaisNecessarios.filter((x) => x !== m),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!form.equipamentoId) { setErro("Selecione um equipamento."); return; }
    if (!form.descricao.trim()) { setErro("Descrição do problema é obrigatória."); return; }
    if (!form.tipo) { setErro("Selecione o tipo de manutenção."); return; }
    if (form.tecnicoIds.length === 0) { setErro("Selecione pelo menos um técnico responsável."); return; }

    setLoading(true);
    try {
      let om: OrdemManutencao;
      if (isEdicao && omParaEditar) {
        om = await updateOrdemManutencaoApi(omParaEditar.id, {
          descricao: form.descricao,
          tipo: form.tipo as TipoManutencao,
          prioridade: form.prioridade,
          dataInicioPrevisto: form.dataInicioPrevisto || undefined,
          tecnicoIds: form.tecnicoIds,
          materiaisNecessarios: form.materiaisNecessarios,
          observacoes: form.observacoes || undefined,
        });
      } else {
        const dto: CreateOMRequest = {
          equipamentoId: form.equipamentoId,
          descricao: form.descricao,
          tipo: form.tipo as TipoManutencao,
          prioridade: form.prioridade,
          dataInicioPrevisto: form.dataInicioPrevisto || undefined,
          tecnicoIds: form.tecnicoIds,
          materiaisNecessarios: form.materiaisNecessarios,
          observacoes: form.observacoes || undefined,
        };
        om = await createOrdemManutencaoApi(dto);
      }
      onSuccess(om);
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar OM.");
    } finally {
      setLoading(false);
    }
  }

  const equipFiltrados = equipamentos.filter(
    (e) =>
      e.nome.toLowerCase().includes(buscaEquip.toLowerCase()) ||
      e.tag.toLowerCase().includes(buscaEquip.toLowerCase())
  );

  const equipSelecionado = equipamentos.find((e) => e.id === form.equipamentoId);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(7,14,27,0.85)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        style={{
          background: "linear-gradient(135deg, #0F1C32 0%, #0A1428 100%)",
          border: "1px solid rgba(148,163,184,0.1)",
          borderRadius: "18px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 py-5 shrink-0"
          style={{ borderBottom: "1px solid rgba(148,163,184,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(232,132,44,0.12)" }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#E8842C" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
              </svg>
            </div>
            <div>
              <h2 className="text-[17px] font-bold" style={{ color: "#F1F5F9" }}>
                {isEdicao ? "Editar Ordem de Manutenção" : "Nova Ordem de Manutenção"}
              </h2>
              <p className="text-[12px]" style={{ color: "#64748B" }}>
                {isEdicao ? `Editando ${omParaEditar?.codigo}` : "Preencha os dados para emitir a OM"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{ color: "#64748B" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(148,163,184,0.08)"; e.currentTarget.style.color = "#94A3B8"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748B"; }}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-6">

          {/* Equipamento */}
          <div>
            <label style={labelStyle}>Equipamento <span style={{ color: "#F87171" }}>*</span></label>
            {equipSelecionado && !isEdicao ? (
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer"
                style={{ background: "rgba(34,160,180,0.08)", border: "1px solid rgba(34,160,180,0.25)" }}
              >
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: "#22A0B4" }}>{equipSelecionado.nome}</p>
                  <p className="text-[12px]" style={{ color: "#64748B" }}>{equipSelecionado.tag} · {equipSelecionado.localizacao}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, equipamentoId: "" }))}
                  className="text-[11px] font-medium cursor-pointer"
                  style={{ color: "#64748B" }}
                >Trocar</button>
              </div>
            ) : isEdicao ? (
              <div
                className="px-4 py-3 rounded-xl"
                style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(148,163,184,0.12)" }}
              >
                <p className="text-[14px] font-semibold" style={{ color: "#94A3B8" }}>{omParaEditar?.equipamento.nome}</p>
                <p className="text-[12px]" style={{ color: "#64748B" }}>{omParaEditar?.equipamento.tag}</p>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  placeholder="Buscar por nome ou TAG..."
                  value={buscaEquip}
                  onChange={e => setBuscaEquip(e.target.value)}
                  style={{ ...inputStyle, marginBottom: "8px" }}
                />
                <div className="max-h-40 overflow-y-auto space-y-1.5" style={{ borderRadius: "10px" }}>
                  {equipFiltrados.length === 0 && (
                    <p className="text-center text-[13px] py-3" style={{ color: "#475569" }}>Nenhum equipamento encontrado</p>
                  )}
                  {equipFiltrados.map(eq => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, equipamentoId: eq.id }))}
                      className="w-full text-left px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer"
                      style={{ background: "rgba(15,23,42,0.5)", border: "1px solid rgba(148,163,184,0.07)" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,160,180,0.3)"; e.currentTarget.style.background = "rgba(34,160,180,0.06)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(148,163,184,0.07)"; e.currentTarget.style.background = "rgba(15,23,42,0.5)"; }}
                    >
                      <p className="text-[13px] font-semibold" style={{ color: "#F1F5F9" }}>{eq.nome}</p>
                      <p className="text-[11px]" style={{ color: "#64748B" }}>{eq.tag} · {eq.localizacao}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label style={labelStyle}>Descrição do Problema <span style={{ color: "#F87171" }}>*</span></label>
            <textarea
              rows={3}
              placeholder="Descreva o problema detectado ou a intervenção necessária..."
              value={form.descricao}
              onChange={e => setForm(prev => ({ ...prev, descricao: e.target.value }))}
              style={{ ...inputStyle, resize: "vertical", minHeight: "90px" }}
            />
          </div>

          {/* Tipo de Manutenção */}
          <div>
            <label style={labelStyle}>Tipo de Manutenção <span style={{ color: "#F87171" }}>*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, tipo: t.value }))}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer"
                  style={{
                    border: form.tipo === t.value ? `1px solid ${t.color}50` : "1px solid rgba(148,163,184,0.1)",
                    background: form.tipo === t.value ? `${t.color}10` : "rgba(15,23,42,0.4)",
                  }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: form.tipo === t.value ? t.color : "#334155" }} />
                  <span className="text-[13px] font-medium" style={{ color: form.tipo === t.value ? t.color : "#64748B" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label style={labelStyle}>Prioridade <span style={{ color: "#F87171" }}>*</span></label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORIDADES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, prioridade: p.value }))}
                  className="px-3 py-2.5 rounded-xl text-center transition-all duration-150 cursor-pointer"
                  style={{
                    border: form.prioridade === p.value ? `1px solid ${p.color}50` : "1px solid rgba(148,163,184,0.1)",
                    background: form.prioridade === p.value ? `${p.color}12` : "rgba(15,23,42,0.4)",
                  }}
                >
                  <span className="text-[13px] font-semibold" style={{ color: form.prioridade === p.value ? p.color : "#475569" }}>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Data prevista */}
          <div>
            <label style={labelStyle}>Data/Hora Prevista de Início</label>
            <input
              type="datetime-local"
              value={form.dataInicioPrevisto}
              onChange={e => setForm(prev => ({ ...prev, dataInicioPrevisto: e.target.value }))}
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
          </div>

          {/* Técnicos */}
          <div>
            <label style={labelStyle}>Técnicos Responsáveis <span style={{ color: "#F87171" }}>*</span></label>
            {tecnicos.length === 0 ? (
              <p className="text-[13px]" style={{ color: "#475569" }}>Nenhum técnico cadastrado no sistema.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {tecnicos.map(t => {
                  const sel = form.tecnicoIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTecnico(t.id)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer"
                      style={{
                        border: sel ? "1px solid rgba(232,132,44,0.4)" : "1px solid rgba(148,163,184,0.1)",
                        background: sel ? "rgba(232,132,44,0.08)" : "rgba(15,23,42,0.4)",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                        style={{ background: sel ? "rgba(232,132,44,0.2)" : "rgba(100,116,139,0.15)", color: sel ? "#E8842C" : "#64748B" }}
                      >
                        {t.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: sel ? "#F1F5F9" : "#94A3B8" }}>{t.nome}</p>
                        <p className="text-[11px]" style={{ color: "#475569" }}>@{t.nomeUsuario}</p>
                      </div>
                      {sel && (
                        <svg className="w-4 h-4 shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="#E8842C" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Materiais */}
          <div>
            <label style={labelStyle}>Materiais Necessários</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Ex: Rolamento SKF 6205, Óleo lubrificante..."
                value={novoMaterial}
                onChange={e => setNovoMaterial(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); adicionarMaterial(); } }}
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                type="button"
                onClick={adicionarMaterial}
                className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer"
                style={{ background: "rgba(232,132,44,0.12)", color: "#E8842C", border: "1px solid rgba(232,132,44,0.2)" }}
              >Adicionar</button>
            </div>
            {form.materiaisNecessarios.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.materiaisNecessarios.map(m => (
                  <span
                    key={m}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium"
                    style={{ background: "rgba(34,160,180,0.08)", color: "#22A0B4", border: "1px solid rgba(34,160,180,0.2)" }}
                  >
                    {m}
                    <button type="button" onClick={() => removerMaterial(m)} className="cursor-pointer" style={{ color: "#64748B" }}>✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label style={labelStyle}>Observações Adicionais</label>
            <textarea
              rows={2}
              placeholder="Instruções específicas, cuidados ou contexto adicional para o técnico..."
              value={form.observacoes}
              onChange={e => setForm(prev => ({ ...prev, observacoes: e.target.value }))}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          {/* Erro */}
          {erro && (
            <div className="px-4 py-3 rounded-xl" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <p className="text-[13px]" style={{ color: "#F87171" }}>{erro}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: "1px solid rgba(148,163,184,0.07)" }}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-[14px] font-medium transition-colors cursor-pointer"
              style={{ color: "#64748B", background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.1)" }}
            >Cancelar</button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-200 cursor-pointer"
              style={{
                background: loading ? "rgba(232,132,44,0.4)" : "linear-gradient(135deg, #E8842C, #D97706)",
                color: "#fff",
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? "Salvando..." : isEdicao ? "Salvar Alterações" : "Emitir Ordem de Manutenção"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
