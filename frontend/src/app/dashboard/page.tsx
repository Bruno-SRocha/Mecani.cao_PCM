"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Usuario } from "@/types/usuario.types";

export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("usuario");
    if (stored) {
      try { setUsuario(JSON.parse(stored)); } catch { /* noop */ }
    }
  }, []);

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="w-full px-10 py-10 animate-fade-in-up" style={{ animationFillMode: "both" }}>

      {/* ── Header ──────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-[3px] rounded-full" style={{ background: "#E8842C" }} />
          <span className="text-[11px] font-semibold tracking-[0.25em] uppercase" style={{ color: "#E8842C" }}>
            Painel Principal
          </span>
        </div>
        <h1 className="text-[32px] font-bold tracking-tight mb-2" style={{ color: "#F1F5F9" }}>
          {saudacao}{usuario ? `, ${usuario.nome.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-[15px]" style={{ color: "#64748B" }}>
          Bem-vindo ao <strong style={{ color: "#94A3B8" }}>Mecâni.cão PCM</strong>. Acompanhe a saúde dos seus ativos industriais.
        </p>
      </div>

      {/* ── KPI Placeholder Cards ─────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {[
          { label: "Equipamentos", value: "—", sub: "Total cadastrado", color: "#22A0B4", iconPath: "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" },
          { label: "Em Operação", value: "—", sub: "Equipamentos ativos", color: "#4ADE80", iconPath: "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
          { label: "Em Manutenção", value: "—", sub: "Aguardando retorno", color: "#FBBF24", iconPath: "M21.75 6.75a4.5 4.5 0 0 1-4.884 4.484c-1.076-.091-2.264.071-2.95.904l-7.152 8.684a2.548 2.548 0 1 1-3.586-3.586l8.684-7.152c.833-.686.995-1.874.904-2.95a4.5 4.5 0 0 1 6.336-4.486l-3.276 3.276a3.004 3.004 0 0 0 2.25 2.25l3.276-3.276c.256.565.398 1.192.398 1.852Z" },
          { label: "Alertas", value: "—", sub: "Componentes críticos", color: "#F87171", iconPath: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" },
        ].map(kpi => (
          <div key={kpi.label} className="glass-card px-6 py-6" style={{ borderRadius: "14px" }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${kpi.color}18` }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke={kpi.color} strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={kpi.iconPath} />
                </svg>
              </div>
              <span className="text-[10px] font-semibold tracking-widest uppercase px-2 py-1 rounded" style={{ background: `${kpi.color}12`, color: kpi.color }}>
                Em breve
              </span>
            </div>
            <p className="text-[32px] font-bold leading-none mb-1.5" style={{ color: "#F1F5F9" }}>{kpi.value}</p>
            <p className="text-[13px]" style={{ color: "#64748B" }}>{kpi.label}</p>
            <p className="text-[11px] mt-1" style={{ color: "#475569" }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Acesso rápido + Aviso ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Atalhos de navegação */}
        <div className="lg:col-span-1 glass-card p-6" style={{ borderRadius: "14px" }}>
          <h2 className="text-[16px] font-bold mb-5" style={{ color: "#F1F5F9" }}>Acesso Rápido</h2>
          <div className="space-y-3">
            {[
              { label: "Ver Equipamentos", sub: "Lista todos os ativos da planta", href: "/equipamentos", color: "#22A0B4", iconPath: "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" },
            ].map(link => (
              <button key={link.href} onClick={() => router.push(link.href)}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer"
                style={{ background: "rgba(148,163,184,0.05)", border: "1px solid rgba(148,163,184,0.08)" }}
                onMouseEnter={e => { e.currentTarget.style.background = `${link.color}0D`; e.currentTarget.style.borderColor = `${link.color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(148,163,184,0.05)"; e.currentTarget.style.borderColor = "rgba(148,163,184,0.08)"; }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${link.color}18` }}>
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke={link.color} strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={link.iconPath} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold" style={{ color: "#F1F5F9" }}>{link.label}</p>
                  <p className="text-[12px]" style={{ color: "#64748B" }}>{link.sub}</p>
                </div>
                <svg className="w-4 h-4 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Banner de módulos futuros */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between" style={{ borderRadius: "14px" }}>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(232,132,44,0.12)" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#E8842C" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                </svg>
              </div>
              <h2 className="text-[16px] font-bold" style={{ color: "#F1F5F9" }}>Próximos Módulos</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Ordens de Serviço", desc: "Abertura e gestão de OS" },
                { label: "Plano de Manutenção", desc: "Manutenções preventivas" },
                { label: "Relatórios", desc: "Indicadores e KPIs da planta" },
                { label: "Histórico de Falhas", desc: "Registro de ocorrências" },
              ].map(mod => (
                <div key={mod.label} className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
                  style={{ background: "rgba(148,163,184,0.04)", border: "1px solid rgba(148,163,184,0.07)" }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: "#334155" }} />
                  <div>
                    <p className="text-[13px] font-semibold" style={{ color: "#94A3B8" }}>{mod.label}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#475569" }}>{mod.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[12px] mt-5 pt-4" style={{ color: "#334155", borderTop: "1px solid rgba(148,163,184,0.06)" }}>
            Sistema em desenvolvimento ativo — novas funcionalidades são adicionadas a cada sprint.
          </p>
        </div>
      </div>
    </div>
  );
}
