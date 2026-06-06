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
  { value: "PREVENTIVA", label: "Preventiva", color: "var(--cyan-badge)" },
  { value: "CORRETIVA_PROGRAMADA", label: "Corretiva Programada", color: "var(--yellow-badge)" },
  { value: "CORRETIVA_EMERGENCIAL", label: "Corretiva Emergencial", color: "var(--red-badge)" },
  { value: "PREDITIVA", label: "Preditiva", color: "var(--orange)" },
];

const PRIORIDADES: { value: PrioridadeOM; label: string; color: string }[] = [
  { value: "BAIXA", label: "Baixa", color: "var(--green-badge)" },
  { value: "MEDIA", label: "Média", color: "var(--yellow-badge)" },
  { value: "ALTA", label: "Alta", color: "var(--orange)" },
  { value: "CRITICA", label: "Crítica", color: "var(--red-badge)" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "var(--input-padding-y) var(--input-padding-x)",
  background: "var(--bg-primary)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "10px",
  color: "var(--text-primary)",
  fontSize: "14px",
  outline: "none",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--text-secondary)",
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "18px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.3)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-space-xl py-space-md shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "var(--orange-glow)" }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="var(--orange)" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
              </svg>
            </div>
            <div>
              <h2 className="text-[17px] font-bold" style={{ color: "var(--text-primary)" }}>
                {isEdicao ? "Editar Ordem de Manutenção" : "Nova Ordem de Manutenção"}
              </h2>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                {isEdicao ? `Editando ${omParaEditar?.codigo}` : "Preencha os dados para emitir a OM"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--border-subtle)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-space-xl py-space-lg space-y-6">

          {/* Equipamento */}
          <div>
            <label style={labelStyle}>Equipamento <span style={{ color: "var(--red-badge)" }}>*</span></label>
            {equipSelecionado && !isEdicao ? (
              <div
                className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer border"
                style={{ background: "var(--cyan-badge-bg)", borderColor: "var(--cyan-badge-border)" }}
              >
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: "var(--cyan-badge)" }}>{equipSelecionado.nome}</p>
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{equipSelecionado.tag} · {equipSelecionado.localizacao}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, equipamentoId: "" }))}
                  className="text-[11px] font-semibold cursor-pointer transition-colors"
                  style={{ color: "var(--text-secondary)" }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--orange)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; }}
                >Trocar</button>
              </div>
            ) : isEdicao ? (
              <div
                className="px-4 py-3 rounded-xl border"
                style={{ background: "var(--bg-primary)", borderColor: "var(--border-subtle)" }}
              >
                <p className="text-[14px] font-semibold" style={{ color: "var(--text-secondary)" }}>{omParaEditar?.equipamento.nome}</p>
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>{omParaEditar?.equipamento.tag}</p>
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
                <div className="max-h-40 overflow-y-auto space-y-1.5 border p-1" style={{ borderRadius: "10px", borderColor: "var(--border-subtle)", background: "var(--bg-primary)" }}>
                  {equipFiltrados.length === 0 && (
                    <p className="text-center text-[13px] py-3" style={{ color: "var(--text-muted)" }}>Nenhum equipamento encontrado</p>
                  )}
                  {equipFiltrados.map(eq => (
                    <button
                      key={eq.id}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, equipamentoId: eq.id }))}
                      className="w-full text-left px-4 py-2.5 rounded-lg transition-all duration-150 cursor-pointer border border-transparent"
                      style={{ background: "var(--bg-secondary)" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-accent)"; e.currentTarget.style.background = "var(--orange-glow)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.background = "var(--bg-secondary)"; }}
                    >
                      <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>{eq.nome}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{eq.tag} · {eq.localizacao}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label style={labelStyle}>Descrição do Problema <span style={{ color: "var(--red-badge)" }}>*</span></label>
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
            <label style={labelStyle}>Tipo de Manutenção <span style={{ color: "var(--red-badge)" }}>*</span></label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, tipo: t.value }))}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer border"
                  style={{
                    borderColor: form.tipo === t.value ? t.color : "var(--border-subtle)",
                    background: form.tipo === t.value ? "var(--orange-glow)" : "var(--bg-primary)",
                  }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                  <span className="text-[13px] font-semibold" style={{ color: form.tipo === t.value ? "var(--text-primary)" : "var(--text-secondary)" }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prioridade */}
          <div>
            <label style={labelStyle}>Prioridade <span style={{ color: "var(--red-badge)" }}>*</span></label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORIDADES.map(p => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, prioridade: p.value }))}
                  className="px-3 py-2.5 rounded-xl text-center transition-all duration-150 cursor-pointer border"
                  style={{
                    borderColor: form.prioridade === p.value ? p.color : "var(--border-subtle)",
                    background: form.prioridade === p.value ? "var(--orange-glow)" : "var(--bg-primary)",
                  }}
                >
                  <span className="text-[13px] font-bold" style={{ color: p.color }}>{p.label}</span>
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
              style={inputStyle}
            />
          </div>

          {/* Técnicos */}
          <div>
            <label style={labelStyle}>Técnicos Responsáveis <span style={{ color: "var(--red-badge)" }}>*</span></label>
            {tecnicos.length === 0 ? (
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Nenhum técnico cadastrado no sistema.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {tecnicos.map(t => {
                  const sel = form.tecnicoIds.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => toggleTecnico(t.id)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-150 cursor-pointer border"
                      style={{
                        borderColor: sel ? "var(--orange)" : "var(--border-subtle)",
                        background: sel ? "var(--orange-glow)" : "var(--bg-primary)",
                      }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
                        style={{ background: sel ? "rgba(232,132,44,0.15)" : "var(--border-subtle)", color: sel ? "var(--orange)" : "var(--text-secondary)" }}
                      >
                        {t.nome.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{t.nome}</p>
                        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>@{t.nomeUsuario}</p>
                      </div>
                      {sel && (
                        <svg className="w-4 h-4 shrink-0 ml-auto" fill="none" viewBox="0 0 24 24" stroke="var(--orange)" strokeWidth={2.5}>
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
                className="px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors cursor-pointer border"
                style={{ background: "var(--orange-glow)", color: "var(--orange)", borderColor: "var(--orange)" }}
              >Adicionar</button>
            </div>
            {form.materiaisNecessarios.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.materiaisNecessarios.map(m => (
                  <span
                    key={m}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border"
                    style={{ background: "var(--cyan-badge-bg)", color: "var(--cyan-badge)", borderColor: "var(--cyan-badge-border)" }}
                  >
                    {m}
                    <button type="button" onClick={() => removerMaterial(m)} className="cursor-pointer" style={{ color: "var(--text-muted)" }}>✕</button>
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
            <div className="px-4 py-3 rounded-xl border" style={{ background: "var(--red-badge-bg)", borderColor: "var(--red-badge-border)" }}>
              <p className="text-[13px]" style={{ color: "var(--red-badge)" }}>{erro}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-[14px] font-medium transition-colors cursor-pointer border"
              style={{ color: "var(--text-secondary)", background: "rgba(148,163,184,0.06)", borderColor: "var(--border-subtle)" }}
            >Cancelar</button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-200 cursor-pointer"
              style={{
                background: loading ? "rgba(232,132,44,0.4)" : "var(--orange)",
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
