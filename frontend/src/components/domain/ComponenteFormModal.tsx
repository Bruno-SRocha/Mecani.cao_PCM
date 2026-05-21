"use client";

import { useState, type FormEvent } from "react";
import {
  createComponenteApi,
  updateComponenteApi,
  type ComponenteComDesgaste,
  type CreateComponenteRequest,
} from "@/lib/api/componentes";

/** Tipos de componente disponíveis no sistema */
const TIPOS_COMPONENTE = [
  { value: "rolamento", label: "Rolamento" },
  { value: "selo_mecanico", label: "Selo Mecânico" },
  { value: "mancal", label: "Mancal" },
  { value: "correia", label: "Correia" },
  { value: "acoplamento", label: "Acoplamento" },
  { value: "motor", label: "Motor" },
  { value: "redutor", label: "Redutor" },
  { value: "filtro", label: "Filtro" },
  { value: "valvula", label: "Válvula" },
  { value: "bomba", label: "Bomba" },
  { value: "outro", label: "Outro" },
];

interface Props {
  equipamentoId: string;
  componente: ComponenteComDesgaste | null; // null = criação, preenchido = edição
  onClose: () => void;
  onSaved: () => void;
}

export default function ComponenteFormModal({
  equipamentoId,
  componente,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!componente;

  /* ── Estado do formulário ─────────────────────────────────── */
  const [nome, setNome] = useState(componente?.nome ?? "");
  const [tipo, setTipo] = useState(componente?.tipo ?? "rolamento");
  const [vidaUtil, setVidaUtil] = useState<string>(
    componente?.vidaUtilNominal?.toString() ?? ""
  );
  const [horasOp, setHorasOp] = useState<string>(
    componente?.horasOperacionais?.toString() ?? "0"
  );
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  /* ── Cálculo ao vivo do desgaste ──────────────────────────── */
  const vidaUtilNum = parseFloat(vidaUtil) || 0;
  const horasOpNum = parseFloat(horasOp) || 0;
  const desgasteLive =
    vidaUtilNum > 0 ? Math.min((horasOpNum / vidaUtilNum) * 100, 100) : 0;

  function desgasteColor(pct: number) {
    if (pct >= 85) return "#F87171";
    if (pct >= 60) return "#FBBF24";
    return "#4ADE80";
  }

  function desgasteLabel(pct: number) {
    if (pct >= 85) return "Crítico";
    if (pct >= 60) return "Atenção";
    return "Saudável";
  }

  /* ── Submit ───────────────────────────────────────────────── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("O nome do componente é obrigatório.");
      return;
    }

    if (!vidaUtil || vidaUtilNum <= 0) {
      setErro("Vida Útil (horas) é obrigatória e deve ser maior que zero.");
      return;
    }

    if (horasOpNum < 0) {
      setErro("Horas operacionais não podem ser negativas.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit && componente) {
        await updateComponenteApi(equipamentoId, componente.id, {
          nome: nome.trim(),
          tipo,
          vidaUtilNominal: vidaUtilNum,
          horasOperacionais: horasOpNum,
        });
      } else {
        const payload: CreateComponenteRequest = {
          nome: nome.trim(),
          tipo,
          vidaUtilNominal: vidaUtilNum,
          horasOperacionais: horasOpNum,
        };
        await createComponenteApi(equipamentoId, payload);
      }
      onSaved();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar componente.");
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

  const desgasteCor = desgasteColor(desgasteLive);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="glass-card p-8 max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-fade-in-up"
        style={{ background: "#111D35", animationDuration: "0.25s" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-7">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-5 h-[3px] rounded-full"
                style={{ background: "#1A7A8A" }}
              />
              <span
                className="text-[10px] font-semibold tracking-[0.25em] uppercase"
                style={{ color: "#22A0B4" }}
              >
                {isEdit ? "Editar" : "Novo"} Componente
              </span>
            </div>
            <h2 className="text-[22px] font-bold" style={{ color: "#F1F5F9" }}>
              {isEdit ? "Atualizar Componente" : "Cadastrar Componente"}
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
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ── Nome ── */}
          <div>
            <label className={labelCls} style={labelStyle}>
              Nome do Componente *
            </label>
            <input
              id="comp-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Rolamento SKF 6205, Selo Mecânico T1"
              className={inputCls}
              style={inputStyle}
              disabled={saving}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(26, 122, 138, 0.5)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(100, 116, 139, 0.2)";
              }}
            />
          </div>

          {/* ── Tipo ── */}
          <div>
            <label className={labelCls} style={labelStyle}>
              Tipo de Componente *
            </label>
            <select
              id="comp-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className={inputCls}
              style={inputStyle}
              disabled={saving}
            >
              {TIPOS_COMPONENTE.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── Vida Útil + Horas Operacionais ── */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls} style={labelStyle}>
                Vida Útil Nominal (h) *
              </label>
              <input
                id="comp-vida-util"
                type="number"
                min="1"
                step="1"
                value={vidaUtil}
                onChange={(e) => setVidaUtil(e.target.value)}
                placeholder="Ex: 20000"
                className={inputCls}
                style={inputStyle}
                disabled={saving}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(26, 122, 138, 0.5)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(100, 116, 139, 0.2)";
                }}
              />
              <p
                className="text-[11px] mt-1.5"
                style={{ color: "#475569" }}
              >
                Horas definidas pelo fabricante
              </p>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>
                Horas Operacionais
              </label>
              <input
                id="comp-horas-op"
                type="number"
                min="0"
                step="0.1"
                value={horasOp}
                onChange={(e) => setHorasOp(e.target.value)}
                placeholder="Ex: 4500"
                className={inputCls}
                style={inputStyle}
                disabled={saving}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(26, 122, 138, 0.5)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(100, 116, 139, 0.2)";
                }}
              />
              <p
                className="text-[11px] mt-1.5"
                style={{ color: "#475569" }}
              >
                Horas desde a última troca
              </p>
            </div>
          </div>

          {/* ── Preview de Desgaste (ao vivo) ── */}
          {vidaUtilNum > 0 && (
            <div
              className="rounded-xl px-5 py-4"
              style={{
                background: `${desgasteCor}08`,
                border: `1px solid ${desgasteCor}25`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke={desgasteCor}
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"
                    />
                  </svg>
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: "#94A3B8" }}
                  >
                    Desgaste estimado
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[20px] font-bold"
                    style={{ color: desgasteCor }}
                  >
                    {desgasteLive.toFixed(1)}%
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      background: `${desgasteCor}18`,
                      color: desgasteCor,
                    }}
                  >
                    {desgasteLabel(desgasteLive)}
                  </span>
                </div>
              </div>

              {/* Barra de progresso */}
              <div
                className="w-full h-2.5 rounded-full overflow-hidden"
                style={{ background: "rgba(148, 163, 184, 0.1)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${desgasteLive}%`,
                    background: desgasteCor,
                    boxShadow: `0 0 8px ${desgasteCor}60`,
                  }}
                />
              </div>

              <p className="text-[11px] mt-2.5" style={{ color: "#475569" }}>
                {horasOpNum.toLocaleString("pt-BR")} h operadas de{" "}
                {vidaUtilNum.toLocaleString("pt-BR")} h nominais
              </p>

              {/* Alerta se crítico */}
              {desgasteLive >= 85 && (
                <div
                  className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-[12px]"
                  style={{
                    background: "rgba(248, 113, 113, 0.08)",
                    border: "1px solid rgba(248, 113, 113, 0.2)",
                    color: "#F87171",
                  }}
                >
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126Z"
                    />
                  </svg>
                  Alerta PCM: componente em nível crítico de desgaste. Programar substituição.
                </div>
              )}
            </div>
          )}

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
              id="comp-submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer transition-all duration-200 flex items-center gap-2"
              style={{
                background: "#1A7A8A",
                boxShadow: "0 4px 12px rgba(26, 122, 138, 0.25)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#15636F";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#1A7A8A";
              }}
            >
              {saving ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Salvando...
                </>
              ) : isEdit ? (
                "Atualizar Componente"
              ) : (
                "Cadastrar Componente"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
