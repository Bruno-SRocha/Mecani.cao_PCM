"use client";

import { useEffect, useState } from "react";
import {
  listModificacoesByEquipamentoApi,
  createModificacaoApi,
  iniciarImplementacaoModificacaoApi,
  finalizarModificacaoApi,
  SolicitacaoModificacao,
  TipoModificacao,
  StatusModificacao,
} from "@/lib/api/solicitacoes-modificacao";
import type { ComponenteComDesgaste } from "@/lib/api/componentes";
import type { NivelUsuario } from "@/types/usuario.types";

interface ModificacoesTabProps {
  equipamentoId: string;
  userNivel: NivelUsuario;
  userId: string;
  componentes: ComponenteComDesgaste[];
  onBOMUpdated: () => void;
}

const statusConfig: Record<StatusModificacao, { label: string; cor: string; bg: string }> = {
  PENDENTE: { label: "Pendente", cor: "#38BDF8", bg: "rgba(56, 189, 248, 0.1)" },
  EM_IMPLEMENTACAO: { label: "Em Implementação", cor: "#FBBF24", bg: "rgba(251, 191, 36, 0.1)" },
  CONCLUIDO: { label: "Concluído", cor: "#34D399", bg: "rgba(52, 211, 153, 0.1)" },
};

const tipoConfig: Record<TipoModificacao, { label: string; cor: string }> = {
  ADICAO: { label: "Adição", cor: "#10B981" },
  SUBSTITUICAO_TECNOLOGIA: { label: "Substituição", cor: "#F59E0B" },
  REMOCAO: { label: "Remoção", cor: "#EF4444" },
};

export default function ModificacoesTab({
  equipamentoId,
  userNivel,
  userId,
  componentes,
  onBOMUpdated,
}: ModificacoesTabProps) {
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoModificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [parecerOpenId, setParecerOpenId] = useState<string | null>(null);
  const [parecerTexto, setParecerTexto] = useState("");
  const [erro, setErro] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Form State
  const [tipoModificacao, setTipoModificacao] = useState<TipoModificacao>("SUBSTITUICAO_TECNOLOGIA");
  const [justificativa, setJustificativa] = useState("");
  const [componenteSaidaId, setComponenteSaidaId] = useState("");
  const [novoComponenteNome, setNovoComponenteNome] = useState("");
  const [novoComponenteTipo, setNovoComponenteTipo] = useState("selo_mecanico");
  const [novoComponenteVidaUtilNominal, setNovoComponenteVidaUtilNominal] = useState<number>(20000);

  const isAdminOrGestor = userNivel === "ADMIN" || userNivel === "GESTOR";

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await listModificacoesByEquipamentoApi(equipamentoId);
      setSolicitacoes(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [equipamentoId]);

  const handleOpenModal = () => {
    setErro("");
    setJustificativa("");
    setComponenteSaidaId(componentes[0]?.id || "");
    setNovoComponenteNome("");
    setNovoComponenteTipo("selo_mecanico");
    setNovoComponenteVidaUtilNominal(20000);
    setTipoModificacao("SUBSTITUICAO_TECNOLOGIA");
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setFormLoading(true);

    try {
      if (!justificativa.trim()) {
        throw new Error("A justificativa técnica da modificação é obrigatória.");
      }

      await createModificacaoApi(equipamentoId, {
        tipoModificacao,
        justificativa,
        componenteSaidaId:
          tipoModificacao !== "ADICAO" ? componenteSaidaId : undefined,
        novoComponenteNome:
          tipoModificacao !== "REMOCAO" ? novoComponenteNome : undefined,
        novoComponenteTipo:
          tipoModificacao !== "REMOCAO" ? novoComponenteTipo : undefined,
        novoComponenteVidaUtilNominal:
          tipoModificacao !== "REMOCAO" ? Number(novoComponenteVidaUtilNominal) : undefined,
      });

      setModalOpen(false);
      carregar();
    } catch (err: any) {
      setErro(err.message || "Erro ao solicitar modificação.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleIniciar = async (id: string) => {
    try {
      await iniciarImplementacaoModificacaoApi(id);
      carregar();
    } catch (err: any) {
      alert(err.message || "Erro ao iniciar modificação.");
    }
  };

  const handleFinalizar = async (id: string) => {
    setParecerOpenId(id);
    setParecerTexto("");
    setErro("");
  };

  const submitFinalizar = async () => {
    if (!parecerOpenId) return;
    setFormLoading(true);
    try {
      await finalizarModificacaoApi(parecerOpenId, {
        parecerEngenharia: parecerTexto,
      });
      setParecerOpenId(null);
      carregar();
      onBOMUpdated(); // Refresh BOM (AC3)
    } catch (err: any) {
      setErro(err.message || "Erro ao finalizar modificação.");
    } finally {
      setFormLoading(false);
    }
  };

  const selectedSaidaComp = componentes.find((c) => c.id === componenteSaidaId);

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-[22px] font-bold mb-1" style={{ color: "#F1F5F9" }}>
            Evolução e Modificações de Projeto
          </h2>
          <p className="text-[13px]" style={{ color: "#64748B" }}>
            Solicite e acompanhe as alterações da ficha técnica e componentes deste ativo.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold text-white transition-all duration-200 cursor-pointer"
          style={{ background: "#1A7A8A" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Solicitar Modificação
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center" style={{ color: "#94A3B8" }}>
          Carregando histórico de modificações...
        </div>
      ) : solicitacoes.length === 0 ? (
        <div className="glass-card p-12 text-center rounded-2xl flex flex-col items-center">
          <svg className="w-12 h-12 mb-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p style={{ color: "#94A3B8" }}>Nenhuma modificação de projeto solicitada para este ativo.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {solicitacoes.map((sol) => {
            const st = statusConfig[sol.status];
            const tp = tipoConfig[sol.tipoModificacao];

            return (
              <div
                key={sol.id}
                className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col gap-5 hover:border-slate-700 transition-all animate-fade-in-up"
              >
                {/* Header da Solicitação */}
                <div className="flex justify-between items-start border-b border-slate-800/60 pb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider"
                        style={{ background: `${tp.cor}15`, color: tp.cor }}
                      >
                        {tp.label}
                      </span>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                        style={{ background: st.bg, color: st.cor }}
                      >
                        {st.label}
                      </span>
                    </div>
                    <p className="text-[11px]" style={{ color: "#475569" }}>
                      Solicitada em: {new Date(sol.criadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {sol.status === "PENDENTE" && (
                      <button
                        onClick={() => handleIniciar(sol.id)}
                        className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold text-white transition-all cursor-pointer bg-sky-600 hover:bg-sky-500"
                      >
                        Iniciar Implementação
                      </button>
                    )}
                    {sol.status === "EM_IMPLEMENTACAO" && isAdminOrGestor && (
                      <button
                        onClick={() => handleFinalizar(sol.id)}
                        className="px-3.5 py-1.5 rounded-lg text-[12px] font-bold text-white transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-500"
                      >
                        Concluir Modificação
                      </button>
                    )}
                  </div>
                </div>

                {/* Workflow de Comparação "Antes" vs "Depois" (AC1 & UI/UX spec) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* ANTES */}
                  <div className="bg-[#0B1121]/50 p-4 rounded-xl border border-slate-900 flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      Antes (BOM Original)
                    </p>
                    {sol.tipoModificacao === "ADICAO" ? (
                      <div className="flex-1 flex items-center justify-center py-6 text-slate-500 text-[13px] italic">
                        [ Sem componente - Nova Adição ]
                      </div>
                    ) : (
                      <div>
                        <h4 className="text-[15px] font-bold text-slate-300">
                          {sol.componenteSaida ? sol.componenteSaida.nome : `Peça ID: ${sol.componenteSaidaId}`}
                        </h4>
                        <div className="text-[12px] text-slate-400 mt-2 space-y-1">
                          <p>
                            Tipo: <span className="text-slate-300 uppercase">{sol.componenteSaida?.tipo.replace(/_/g, " ")}</span>
                          </p>
                          <p>
                            Vida Nominal: <span className="text-slate-300">{sol.componenteSaida?.vidaUtilNominal.toLocaleString()} h</span>
                          </p>
                          <p>
                            Horas Operadas: <span className="text-slate-300">{sol.componenteSaida?.horasOperacionais.toLocaleString()} h</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DEPOIS */}
                  <div className="bg-[#0B1121]/50 p-4 rounded-xl border border-slate-900 flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#22A0B4]">
                      Depois (BOM Proposta)
                    </p>
                    {sol.tipoModificacao === "REMOCAO" ? (
                      <div className="flex-1 flex items-center justify-center py-6 text-red-400/80 text-[13px] font-semibold">
                        ⚠️ Componente Removido da Ficha Técnica
                      </div>
                    ) : (
                      <div>
                        {sol.status === "CONCLUIDO" && sol.componenteEntrada ? (
                          <h4 className="text-[15px] font-bold text-white flex items-center gap-1.5">
                            {sol.componenteEntrada.nome}
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-teal-500/10 text-teal-400 border border-teal-500/20">
                              BOM Ativa
                            </span>
                          </h4>
                        ) : (
                          <h4 className="text-[15px] font-bold text-emerald-400">
                            {sol.novoComponenteNome} (Proposto)
                          </h4>
                        )}
                        <div className="text-[12px] text-slate-400 mt-2 space-y-1">
                          <p>
                            Tipo:{" "}
                            <span className="text-slate-300 uppercase">
                              {sol.status === "CONCLUIDO" && sol.componenteEntrada
                                ? sol.componenteEntrada.tipo.replace(/_/g, " ")
                                : sol.novoComponenteTipo?.replace(/_/g, " ")}
                            </span>
                          </p>
                          <p>
                            Vida Nominal:{" "}
                            <span className="text-slate-300">
                              {sol.status === "CONCLUIDO" && sol.componenteEntrada
                                ? sol.componenteEntrada.vidaUtilNominal.toLocaleString()
                                : sol.novoComponenteVidaUtilNominal?.toLocaleString()}{" "}
                              h
                            </span>
                          </p>
                          <p>
                            Horas Iniciais: <span className="text-slate-300">0 h (Nova)</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Justificativa Técnica (AC2) */}
                <div className="bg-[#0B1121]/30 p-4 rounded-xl border border-slate-900/60">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                    Justificativa da Modificação (Técnico)
                  </p>
                  <p className="text-[13px] text-slate-300 leading-relaxed italic">
                    "{sol.justificativa}"
                  </p>
                </div>

                {/* Parecer da Engenharia */}
                {(sol.parecerEngenharia || sol.status === "CONCLUIDO") && (
                  <div className="bg-teal-950/10 p-4 rounded-xl border border-teal-900/30">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#22A0B4] mb-2 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 5.636 3.745 3.745 0 0 1-7.1 0 3.745 3.745 0 0 1-1.087-5.636A9 9 0 1 1 21 12Z" />
                      </svg>
                      Parecer Técnico da Engenharia / Finalização
                    </p>
                    <p className="text-[13px] text-slate-300 leading-relaxed">
                      {sol.parecerEngenharia || "Alteração homologada e aplicada à árvore de ativos com sucesso."}
                    </p>
                    {sol.dataImplementacao && (
                      <p className="text-[11px] text-teal-500 mt-2 font-medium">
                        Homologado em: {new Date(sol.dataImplementacao).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Solicitar Modificação */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="glass-card p-8 max-w-4xl w-full mx-4 rounded-2xl flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto" style={{ background: "#111D35" }}>
            
            {/* Esquerda: Form */}
            <div className="flex-1 space-y-5">
              <div>
                <h3 className="text-[20px] font-bold mb-1 text-white">Solicitar Modificação de Projeto</h3>
                <p className="text-[12px] text-slate-400">Preencha os detalhes técnicos para abrir o processo de homologação.</p>
              </div>

              {erro && <div className="p-3 rounded bg-red-900/30 text-red-400 text-sm">{erro}</div>}

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Tipo de Modificação */}
                <div>
                  <label className="block text-[12px] mb-1.5 font-semibold text-slate-400">Tipo de Modificação</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: "SUBSTITUICAO_TECNOLOGIA", label: "Substituição" },
                      { val: "ADICAO", label: "Adição" },
                      { val: "REMOCAO", label: "Remoção" },
                    ].map((btn) => (
                      <button
                        key={btn.val}
                        type="button"
                        onClick={() => setTipoModificacao(btn.val as TipoModificacao)}
                        className={`py-2 rounded-lg text-[12px] font-bold transition-all ${
                          tipoModificacao === btn.val
                            ? "bg-[#1A7A8A] text-white"
                            : "bg-[#0B1121] text-slate-400 hover:text-slate-300 border border-slate-800"
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Componente de Saída (se Substituição ou Remoção) */}
                {tipoModificacao !== "ADICAO" && (
                  <div>
                    <label className="block text-[12px] mb-1.5 font-semibold text-slate-400">Componente a ser Removido / Substituído</label>
                    <select
                      value={componenteSaidaId}
                      onChange={(e) => setComponenteSaidaId(e.target.value)}
                      className="w-full bg-[#0B1121] border border-slate-800 rounded-lg px-3 py-2 text-white text-[13px] focus:outline-none focus:border-[#1A7A8A]"
                    >
                      {componentes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nome} ({c.tipo.replace(/_/g, " ")}) - {c.horasOperacionais.toLocaleString()}h operadas
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Detalhes do Novo Componente (se Adição ou Substituição) */}
                {tipoModificacao !== "REMOCAO" && (
                  <div className="space-y-3 p-4 bg-[#0B1121]/45 rounded-xl border border-slate-900">
                    <p className="text-[11px] font-bold text-[#22A0B4] uppercase tracking-wider">Novo Componente a ser Instalado</p>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] mb-1 text-slate-500">Nome do Componente</label>
                        <input
                          type="text"
                          value={novoComponenteNome}
                          onChange={(e) => setNovoComponenteNome(e.target.value)}
                          placeholder="Ex: Selo John Crane T1"
                          required
                          className="w-full bg-[#0B1121] border border-slate-800 rounded-lg px-3 py-2 text-white text-[13px]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] mb-1 text-slate-500">Tipo de Componente</label>
                        <select
                          value={novoComponenteTipo}
                          onChange={(e) => setNovoComponenteTipo(e.target.value)}
                          className="w-full bg-[#0B1121] border border-slate-800 rounded-lg px-3 py-2 text-white text-[13px]"
                        >
                          <option value="selo_mecanico">Selo Mecânico</option>
                          <option value="rolamento">Rolamento</option>
                          <option value="mancal">Mancal</option>
                          <option value="correia">Correia</option>
                          <option value="acoplamento">Acoplamento</option>
                          <option value="outro">Outro</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] mb-1 text-slate-500">Vida Útil Nominal (Horas)</label>
                      <input
                        type="number"
                        value={novoComponenteVidaUtilNominal}
                        onChange={(e) => setNovoComponenteVidaUtilNominal(Number(e.target.value))}
                        required
                        min={100}
                        className="w-full bg-[#0B1121] border border-slate-800 rounded-lg px-3 py-2 text-white text-[13px]"
                      />
                    </div>
                  </div>
                )}

                {/* Justificativa (Obrigatória - AC2) */}
                <div>
                  <label className="block text-[12px] mb-1.5 font-semibold text-slate-400">Justificativa da Modificação (Obrigatório)</label>
                  <textarea
                    rows={3}
                    value={justificativa}
                    onChange={(e) => setJustificativa(e.target.value)}
                    required
                    placeholder="Ex: Substituição de gaxetas convencionais por selo mecânico John Crane para mitigar vazamentos constantes e aumentar vida útil operacional do ativo."
                    className="w-full bg-[#0B1121] border border-slate-800 rounded-lg px-3 py-2 text-white text-[13px] resize-none focus:outline-none focus:border-[#1A7A8A]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-[13px] bg-transparent text-gray-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-5 py-2 rounded-lg text-[13px] font-bold bg-[#1A7A8A] text-white hover:bg-[#15636F]"
                  >
                    {formLoading ? "Salvando..." : "Enviar Solicitação"}
                  </button>
                </div>
              </form>
            </div>

            {/* Direita: Live UI/UX Comparison Preview (WOW Effect) */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-6 flex flex-col gap-4">
              <h4 className="text-[14px] font-bold text-slate-300">Live Preview (Antes vs Depois)</h4>
              <p className="text-[12px] text-slate-500">Visualização de como a BOM do ativo será modificada após a homologação.</p>
              
              <div className="flex flex-col gap-3">
                {/* ANTES CARD */}
                <div className="bg-[#0B1121] p-4 rounded-xl border border-slate-800">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-2">Estado Original</p>
                  {tipoModificacao === "ADICAO" ? (
                    <p className="text-[12px] text-slate-500 italic">[ Nenhum ]</p>
                  ) : (
                    <div>
                      <p className="text-[13px] font-bold text-slate-300">{selectedSaidaComp ? selectedSaidaComp.nome : "Selecione a peça"}</p>
                      <p className="text-[11px] text-slate-500 mt-1 uppercase">
                        Tipo: {selectedSaidaComp?.tipo.replace(/_/g, " ") || "—"}
                      </p>
                    </div>
                  )}
                </div>

                {/* DEPOIS CARD */}
                <div className="bg-[#0B1121] p-4 rounded-xl border border-[#22A0B4]/40" style={{ boxShadow: "0 0 12px rgba(34, 160, 180, 0.05)" }}>
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#22A0B4] mb-2">Estado Proposto</p>
                  {tipoModificacao === "REMOCAO" ? (
                    <p className="text-[12px] text-red-400 font-medium">❌ Componente será excluído da BOM</p>
                  ) : (
                    <div>
                      <p className="text-[13px] font-bold text-emerald-400">{novoComponenteNome || "Preencha o nome"}</p>
                      <p className="text-[11px] text-slate-500 mt-1 uppercase">
                        Tipo: {novoComponenteTipo.replace(/_/g, " ")}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Vida Nominal: {novoComponenteVidaUtilNominal ? `${novoComponenteVidaUtilNominal.toLocaleString()} h` : "—"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Concluir Modificação (Inserir Parecer da Engenharia) */}
      {parecerOpenId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="glass-card p-6 max-w-md w-full mx-4 rounded-xl" style={{ background: "#111D35" }}>
            <h3 className="text-[18px] font-bold mb-2 text-white">Homologação da Engenharia</h3>
            <p className="text-[12px] text-slate-400 mb-4">
              Escreva o parecer técnico que ficará documentado no histórico de modificações do ativo.
            </p>

            {erro && <div className="mb-4 p-2 rounded bg-red-900/30 text-red-400 text-xs">{erro}</div>}

            <textarea
              rows={4}
              value={parecerTexto}
              onChange={(e) => setParecerTexto(e.target.value)}
              placeholder="Ex: Homologado. Novo selo mecânico instalado com sucesso, garantindo melhor vedação sob alta pressão e aumentando consideravelmente a confiabilidade operacional."
              className="w-full bg-[#0B1121] border border-slate-800 rounded-lg px-3 py-2 text-white text-[13px] resize-none focus:outline-none focus:border-[#1a7a8a] mb-5"
            />

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setParecerOpenId(null)}
                className="px-4 py-2 rounded-lg text-[13px] text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={submitFinalizar}
                disabled={formLoading}
                className="px-5 py-2 rounded-lg text-[13px] font-bold bg-[#1A7A8A] text-white hover:bg-[#15636F]"
              >
                {formLoading ? "Homologando..." : "Concluir e Atualizar BOM"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
