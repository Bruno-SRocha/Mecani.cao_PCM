"use client";

import { useEffect, useState } from "react";
import { 
  Diagnostico, 
  DiagnosticoHistorico, 
  listarDiagnosticos, 
  criarDiagnostico, 
  editarDiagnostico, 
  obterAuditoriaDiagnostico 
} from "@/lib/api/diagnosticos";
import type { NivelUsuario } from "@/types/usuario.types";

interface DiagnosticoTabProps {
  equipamentoId: string;
  userNivel: NivelUsuario;
  userId: string;
}

const severidadeConfig = {
  BAIXA: { label: "Baixa", cor: "#4ADE80", bg: "rgba(74, 222, 128, 0.1)" },
  MEDIA: { label: "Média", cor: "#FBBF24", bg: "rgba(251, 191, 36, 0.1)" },
  ALTA: { label: "Alta", cor: "#F97316", bg: "rgba(249, 115, 22, 0.1)" },
  CRITICA: { label: "Crítica", cor: "#EF4444", bg: "rgba(239, 68, 68, 0.1)" },
};

export default function DiagnosticoTab({ equipamentoId, userNivel, userId }: DiagnosticoTabProps) {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditoria, setAuditoria] = useState<DiagnosticoHistorico[]>([]);
  
  const [editItem, setEditItem] = useState<Diagnostico | null>(null);
  
  // Form State
  const [data, setData] = useState("");
  const [severidade, setSeveridade] = useState("BAIXA");
  const [texto, setTexto] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = async () => {
    try {
      setLoading(true);
      const res = await listarDiagnosticos(equipamentoId);
      setDiagnosticos(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, [equipamentoId]);

  const handleOpenModal = (item?: Diagnostico) => {
    setErro("");
    if (item) {
      setEditItem(item);
      setData(item.data.split("T")[0]);
      setSeveridade(item.severidade);
      setTexto(item.texto);
    } else {
      setEditItem(null);
      setData(new Date().toISOString().split("T")[0]);
      setSeveridade("BAIXA");
      setTexto("");
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    setFormLoading(true);
    try {
      if (editItem) {
        await editarDiagnostico(editItem.id, { data, severidade, texto });
      } else {
        await criarDiagnostico(equipamentoId, { data, severidade, texto });
      }
      setModalOpen(false);
      carregar();
    } catch (e: any) {
      setErro(e.response?.data?.erro || "Erro ao salvar diagnóstico.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenAudit = async (id: string) => {
    try {
      const res = await obterAuditoriaDiagnostico(id);
      setAuditoria(res);
      setAuditModalOpen(true);
    } catch (e: any) {
      alert(e.response?.data?.erro || "Erro ao carregar auditoria.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center" style={{ color: "#94A3B8" }}>Carregando diagnósticos...</div>;
  }

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[20px] font-bold" style={{ color: "#F1F5F9" }}>Histórico de Diagnósticos</h2>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-all duration-200"
          style={{ background: "#1A7A8A" }}
        >
          + Novo Diagnóstico
        </button>
      </div>

      {diagnosticos.length === 0 ? (
        <div className="glass-card p-10 text-center rounded-xl">
          <p style={{ color: "#94A3B8" }}>Nenhum diagnóstico registrado para este equipamento.</p>
        </div>
      ) : (
        <div className="relative border-l-2 ml-4" style={{ borderColor: "rgba(148, 163, 184, 0.2)" }}>
          {diagnosticos.map((diag) => {
            const config = severidadeConfig[diag.severidade as keyof typeof severidadeConfig] || severidadeConfig.BAIXA;
            const podeEditar = userNivel === "ADMIN" || userNivel === "GESTOR" || (userNivel === "TECNICO" && diag.autor.id === userId);
            
            return (
              <div key={diag.id} className="mb-8 pl-8 relative">
                <div className="absolute w-4 h-4 rounded-full -left-[9px] top-1" style={{ background: config.cor, border: "3px solid #0B1121" }} />
                <div className="glass-card p-5 rounded-xl border border-transparent hover:border-[rgba(255,255,255,0.05)] transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[14px] font-bold" style={{ color: "#F1F5F9" }}>
                          {new Date(diag.data).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider" style={{ background: config.bg, color: config.cor }}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-[12px]" style={{ color: "#64748B" }}>Registrado por {diag.autor.nome}</p>
                    </div>
                    <div className="flex gap-2">
                      {podeEditar && (
                        <button onClick={() => handleOpenModal(diag)} className="text-[12px] underline cursor-pointer" style={{ color: "#22A0B4" }}>
                          Editar
                        </button>
                      )}
                      {userNivel === "ADMIN" && (
                        <button onClick={() => handleOpenAudit(diag.id)} className="text-[12px] underline cursor-pointer" style={{ color: "#E8842C" }}>
                          Auditoria
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[14px] whitespace-pre-wrap" style={{ color: "#cbd5e1" }}>{diag.texto}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar/Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="glass-card p-8 max-w-lg w-full mx-4 rounded-xl" style={{ background: "#111D35" }}>
            <h3 className="text-[20px] font-bold mb-6" style={{ color: "#F1F5F9" }}>
              {editItem ? "Editar Diagnóstico" : "Novo Diagnóstico"}
            </h3>
            
            {erro && <div className="mb-4 p-3 rounded bg-red-900/30 text-red-400 text-sm">{erro}</div>}
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] mb-1" style={{ color: "#94A3B8" }}>Data</label>
                  <input type="date" value={data} onChange={(e) => setData(e.target.value)} required className="w-full bg-[#0B1121] border border-[#1E293B] rounded px-3 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-[12px] mb-1" style={{ color: "#94A3B8" }}>Severidade</label>
                  <select value={severidade} onChange={(e) => setSeveridade(e.target.value)} className="w-full bg-[#0B1121] border border-[#1E293B] rounded px-3 py-2 text-white">
                    <option value="BAIXA">Baixa</option>
                    <option value="MEDIA">Média</option>
                    <option value="ALTA">Alta</option>
                    <option value="CRITICA">Crítica</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] mb-1" style={{ color: "#94A3B8" }}>Observações / Anomalia</label>
                <textarea rows={4} value={texto} onChange={(e) => setTexto(e.target.value)} required className="w-full bg-[#0B1121] border border-[#1E293B] rounded px-3 py-2 text-white resize-none" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded text-[13px] bg-transparent text-gray-400 hover:text-white">Cancelar</button>
                <button type="submit" disabled={formLoading} className="px-5 py-2 rounded text-[13px] font-bold bg-[#1A7A8A] text-white hover:bg-[#15636F]">
                  {formLoading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Auditoria (Admin) */}
      {auditModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="glass-card p-8 max-w-xl w-full mx-4 rounded-xl" style={{ background: "#111D35" }}>
            <h3 className="text-[20px] font-bold mb-6" style={{ color: "#E8842C" }}>Auditoria de Alterações</h3>
            <div className="max-h-[60vh] overflow-y-auto space-y-4">
              {auditoria.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhuma alteração registrada.</p>
              ) : (
                auditoria.map((hist) => (
                  <div key={hist.id} className="p-4 bg-[#0B1121] rounded-lg border border-[#1E293B]">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-gray-400">{new Date(hist.dataEdicao).toLocaleString("pt-BR")}</span>
                      <span className="text-xs text-[#22A0B4]">Editado por: {hist.editor.nome}</span>
                    </div>
                    <p className="text-xs mb-1 text-gray-500">Severidade Anterior: <span className="text-gray-300">{hist.severidadeAnterior}</span></p>
                    <p className="text-xs text-gray-500">Texto Anterior:</p>
                    <p className="text-sm text-gray-300 bg-black/20 p-2 rounded mt-1">{hist.textoAnterior}</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 text-right">
              <button onClick={() => setAuditModalOpen(false)} className="px-4 py-2 rounded text-sm bg-gray-700 text-white hover:bg-gray-600">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
