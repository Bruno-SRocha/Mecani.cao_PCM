"use client";

import { useState, type FormEvent } from "react";
import {
  createReporteApi,
  type CreateReporteRequest,
} from "@/lib/api/reportes-substituicao";
import type { ComponenteComDesgaste } from "@/lib/api/componentes";

interface Props {
  equipamentoId: string;
  componente: ComponenteComDesgaste;
  onClose: () => void;
  onSaved: () => void;
}

export default function ReporteSubstituicaoModal({
  equipamentoId,
  componente,
  onClose,
  onSaved,
}: Props) {
  /* ── Estado do formulário ─────────────────────────────────── */
  const [pecaInstalada, setPecaInstalada] = useState("");
  const [vidaUtil, setVidaUtil] = useState("");
  const [dataSubstituicao, setDataSubstituicao] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [observacoes, setObservacoes] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const vidaUtilNum = parseFloat(vidaUtil) || 0;

  /* ── Submit ───────────────────────────────────────────────── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");

    if (!pecaInstalada.trim()) {
      setErro("Informe o nome da peça instalada.");
      return;
    }
    if (!vidaUtil || vidaUtilNum <= 0) {
      setErro("Informe a vida útil da nova peça (deve ser maior que zero).");
      return;
    }
    if (!dataSubstituicao) {
      setErro("Informe a data da substituição.");
      return;
    }

    setSaving(true);
    try {
      const payload: CreateReporteRequest = {
        pecaInstalada: pecaInstalada.trim(),
        vidaUtilNovaPeca: vidaUtilNum,
        dataSubstituicao,
        observacoes: observacoes.trim() || undefined,
      };
      await createReporteApi(equipamentoId, componente.id, payload);
      setSucesso(true);
      setTimeout(() => {
        onSaved();
      }, 1800);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar reporte.");
    } finally {
      setSaving(false);
    }
  }

  /* ── Estilos reutilizáveis ────────────────────────────────── */
  const inputCls =
    "w-full px-4 py-3 rounded-lg text-[14px] outline-none transition-all duration-200";
  const inputStyle: React.CSSProperties = {
    background: "rgba(12, 20, 38, 0.65)",
    border: "1px solid rgba(100, 116, 139, 0.2)",
    color: "#F1F5F9",
  };
  const labelCls =
    "block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2.5";
  const labelStyle: React.CSSProperties = { color: "#94A3B8" };

  /* ── Cor de destaque: laranja substituição ─────────────────── */
  const accentColor = "#E8842C";
  const accentDim = "rgba(232, 132, 44, 0.12)";
  const accentBorder = "rgba(232, 132, 44, 0.25)";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="glass-card p-8 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-fade-in-up"
        style={{ background: "#0F1A2E", animationDuration: "0.25s" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-5 h-[3px] rounded-full"
                style={{ background: accentColor }}
              />
              <span
                className="text-[10px] font-semibold tracking-[0.25em] uppercase"
                style={{ color: accentColor }}
              >
                Reporte de Substituição
              </span>
            </div>
            <h2 className="text-[22px] font-bold" style={{ color: "#F1F5F9" }}>
              Substituir Componente
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all duration-200 cursor-pointer"
            style={{ color: "#64748B" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* ── Info do componente atual ── */}
        <div
          className="rounded-xl px-4 py-4 mb-6 flex items-center gap-3"
          style={{
            background: "rgba(26, 122, 138, 0.07)",
            border: "1px solid rgba(26, 122, 138, 0.2)",
          }}
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#22A0B4"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            />
          </svg>
          <div>
            <p className="text-[11px] uppercase tracking-wider mb-0.5" style={{ color: "#475569" }}>
              Componente a substituir
            </p>
            <p className="text-[14px] font-semibold" style={{ color: "#F1F5F9" }}>
              {componente.nome}
            </p>
            <p className="text-[12px]" style={{ color: "#64748B" }}>
              {componente.tipo.replace(/_/g, " ")} ·{" "}
              {componente.horasOperacionais.toLocaleString("pt-BR")} h operadas ·{" "}
              {componente.desgastePct.toFixed(1)}% desgaste
            </p>
          </div>
        </div>

        {/* ── Aviso de aprovação pendente ── */}
        <div
          className="rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5"
          style={{
            background: accentDim,
            border: `1px solid ${accentBorder}`,
          }}
        >
          <svg
            className="w-4 h-4 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke={accentColor}
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
          <p className="text-[12px] leading-relaxed" style={{ color: "#E8842C" }}>
            Este reporte ficará com status <strong>Aguardando Aprovação</strong> até
            que um gestor ou administrador aprove a substituição. O componente será
            atualizado somente após a aprovação.
          </p>
        </div>

        {/* ── Erro ── */}
        {erro && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-5"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#FCA5A5",
            }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span>{erro}</span>
          </div>
        )}

        {/* ── Sucesso ── */}
        {sucesso && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-5"
            style={{
              background: "rgba(74, 222, 128, 0.08)",
              border: "1px solid rgba(74, 222, 128, 0.2)",
              color: "#4ADE80",
            }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>Reporte criado! Aguardando aprovação do gestor.</span>
          </div>
        )}

        {!sucesso && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Peça Instalada ── */}
            <div>
              <label className={labelCls} style={labelStyle}>
                Peça Instalada (Nova) *
              </label>
              <input
                id="reporte-peca"
                type="text"
                value={pecaInstalada}
                onChange={(e) => setPecaInstalada(e.target.value)}
                placeholder="Ex: Rolamento SKF 6205 Novo, Selo Mecânico T1-A"
                className={inputCls}
                style={inputStyle}
                disabled={saving}
                onFocus={(e) => { e.target.style.borderColor = accentBorder; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(100, 116, 139, 0.2)"; }}
              />
            </div>

            {/* ── Vida Útil + Data ── */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className={labelCls} style={labelStyle}>
                  Vida Útil da Nova Peça (h) *
                </label>
                <input
                  id="reporte-vida-util"
                  type="number"
                  min="1"
                  step="1"
                  value={vidaUtil}
                  onChange={(e) => setVidaUtil(e.target.value)}
                  placeholder="Ex: 20000"
                  className={inputCls}
                  style={inputStyle}
                  disabled={saving}
                  onFocus={(e) => { e.target.style.borderColor = accentBorder; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(100, 116, 139, 0.2)"; }}
                />
                <p className="text-[11px] mt-1.5" style={{ color: "#475569" }}>
                  Horas do fabricante da nova peça
                </p>
              </div>
              <div>
                <label className={labelCls} style={labelStyle}>
                  Data da Substituição *
                </label>
                <input
                  id="reporte-data"
                  type="date"
                  value={dataSubstituicao}
                  onChange={(e) => setDataSubstituicao(e.target.value)}
                  className={inputCls}
                  style={{
                    ...inputStyle,
                    colorScheme: "dark",
                  }}
                  disabled={saving}
                  onFocus={(e) => { e.target.style.borderColor = accentBorder; }}
                  onBlur={(e) => { e.target.style.borderColor = "rgba(100, 116, 139, 0.2)"; }}
                />
              </div>
            </div>

            {/* ── Observações ── */}
            <div>
              <label className={labelCls} style={labelStyle}>
                Observações
              </label>
              <textarea
                id="reporte-obs"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Descreva detalhes da substituição, condições encontradas, motivo da troca antecipada..."
                rows={4}
                className={`${inputCls} resize-none`}
                style={inputStyle}
                disabled={saving}
                onFocus={(e) => { e.target.style.borderColor = accentBorder; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(100, 116, 139, 0.2)"; }}
              />
            </div>

            {/* ── Ações ── */}
            <div
              className="flex justify-end gap-4 pt-5"
              style={{ borderTop: "1px solid rgba(148, 163, 184, 0.08)" }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg text-[13px] font-medium cursor-pointer transition-all duration-200"
                style={{
                  color: "#94A3B8",
                  background: "rgba(148, 163, 184, 0.08)",
                  border: "1px solid rgba(148, 163, 184, 0.15)",
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                id="reporte-submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all duration-200 flex items-center gap-2"
                style={{
                  background: accentColor,
                  boxShadow: `0 4px 12px rgba(232, 132, 44, 0.3)`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#C96E1A"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = accentColor; }}
              >
                {saving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                    Enviar Reporte
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
