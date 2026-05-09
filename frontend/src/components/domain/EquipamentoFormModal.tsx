"use client";

import { useState, type FormEvent } from "react";
import { createEquipamentoApi, updateEquipamentoApi } from "@/lib/api/equipamentos";
import type { Equipamento, StatusEquipamento } from "@/types/equipamento.types";

interface Props {
  equipamento: Equipamento | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EquipamentoFormModal({ equipamento, onClose, onSaved }: Props) {
  const isEdit = !!equipamento;

  const [nome, setNome] = useState(equipamento?.nome ?? "");
  const [tag, setTag] = useState(equipamento?.tag ?? "");
  const [tipo, setTipo] = useState(equipamento?.tipo ?? "");
  const [fabricante, setFabricante] = useState(equipamento?.fabricante ?? "");
  const [modelo, setModelo] = useState(equipamento?.modelo ?? "");
  const [localizacao, setLocalizacao] = useState(equipamento?.localizacao ?? "");
  const [numeroSerie, setNumeroSerie] = useState(equipamento?.numeroSerie ?? "");
  const [status, setStatus] = useState<StatusEquipamento>(equipamento?.status ?? "OPERANDO");
  const [dataInstalacao, setDataInstalacao] = useState(equipamento?.dataInstalacao?.split("T")[0] ?? "");
  const [descricao, setDescricao] = useState(equipamento?.descricao ?? "");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");

    if (!nome || !tag || !tipo || !fabricante || !modelo || !localizacao) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    setSaving(true);
    try {
      const data = { nome, tag, tipo, fabricante, modelo, localizacao, numeroSerie: numeroSerie || undefined, status, dataInstalacao: dataInstalacao || undefined, descricao: descricao || undefined };
      if (isEdit) {
        await updateEquipamentoApi(equipamento.id, data);
      } else {
        await createEquipamentoApi(data);
      }
      onSaved();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const inputCls = "w-full px-4 py-3 rounded-lg text-[14px] outline-none transition-all duration-200";
  const inputStyle: React.CSSProperties = { background: "rgba(12, 20, 38, 0.65)", border: "1px solid rgba(100, 116, 139, 0.2)", color: "#F1F5F9" };
  const labelCls = "block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2.5";
  const labelStyle: React.CSSProperties = { color: "#94A3B8" };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div className="glass-card p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-fade-in-up" style={{ background: "#111D35", animationDuration: "0.3s" }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-5 h-[3px] rounded-full" style={{ background: "#E8842C" }} />
              <span className="text-[10px] font-semibold tracking-[0.25em] uppercase" style={{ color: "#E8842C" }}>
                {isEdit ? "Editar" : "Novo"} Equipamento
              </span>
            </div>
            <h2 className="text-[24px] font-bold" style={{ color: "#F1F5F9" }}>
              {isEdit ? "Atualizar Dados" : "Cadastrar Equipamento"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-all duration-200 cursor-pointer" style={{ color: "#64748B" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {erro && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-5" style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#FCA5A5" }}>
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className={labelCls} style={labelStyle}>Nome *</label>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Bomba Centrífuga KSB" className={inputCls} style={inputStyle} disabled={saving} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>TAG *</label>
              <input type="text" value={tag} onChange={e => setTag(e.target.value)} placeholder="Ex: BC-001" className={inputCls} style={inputStyle} disabled={saving} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Tipo *</label>
              <input type="text" value={tipo} onChange={e => setTipo(e.target.value)} placeholder="Ex: Bomba Centrífuga" className={inputCls} style={inputStyle} disabled={saving} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Fabricante *</label>
              <input type="text" value={fabricante} onChange={e => setFabricante(e.target.value)} placeholder="Ex: KSB" className={inputCls} style={inputStyle} disabled={saving} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Modelo *</label>
              <input type="text" value={modelo} onChange={e => setModelo(e.target.value)} placeholder="Ex: Megabloc 65-200" className={inputCls} style={inputStyle} disabled={saving} />
            </div>
            <div className="col-span-2">
              <label className={labelCls} style={labelStyle}>Localização *</label>
              <input type="text" value={localizacao} onChange={e => setLocalizacao(e.target.value)} placeholder="Ex: Área de Utilidades — Sala de Bombas" className={inputCls} style={inputStyle} disabled={saving} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Nº Série</label>
              <input type="text" value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} placeholder="Opcional" className={inputCls} style={inputStyle} disabled={saving} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as StatusEquipamento)} className={inputCls} style={inputStyle} disabled={saving}>
                <option value="OPERANDO">Operando</option>
                <option value="PARADO">Parado</option>
                <option value="MANUTENCAO">Manutenção</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Data de Instalação</label>
              <input type="date" value={dataInstalacao} onChange={e => setDataInstalacao(e.target.value)} className={inputCls} style={inputStyle} disabled={saving} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Descrição</label>
              <textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Informações técnicas adicionais..." rows={2} className={`${inputCls} resize-none`} style={inputStyle} disabled={saving} />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-6" style={{ borderTop: "1px solid rgba(148, 163, 184, 0.08)" }}>
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer" style={{ color: "#94A3B8", background: "rgba(148, 163, 184, 0.08)" }} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all duration-200 flex items-center gap-2"
              style={{ background: "#E8842C", boxShadow: "0 4px 12px rgba(232, 132, 44, 0.2)" }}>
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Salvando...
                </>
              ) : (isEdit ? "Atualizar" : "Cadastrar")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
