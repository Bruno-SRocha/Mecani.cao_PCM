/**
 * Componente: Sidebar — Navegação Principal da Área Privada
 *
 * Menu lateral fixo com navegação para os módulos do sistema.
 * Exibe o logo da marca, links de navegação com ícones,
 * informações do usuário logado e botão de logout.
 *
 * Funcionalidades:
 * - Indicador laranja no link ativo
 * - Micro-animações de hover
 * - Aba "Aprovações" visível apenas para GESTOR/ADMIN
 * - Badge de notificação vermelho com contagem de pendências
 *
 * Design: fundo escuro (navy-950) com glassmorphism sutil.
 */

"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import type { Usuario } from "@/types/usuario.types";
import { countPendentesApi } from "@/lib/api/reportes-substituicao";
import { listAllModificacoesApi } from "@/lib/api/solicitacoes-modificacao";
import { countNaoLidosApi } from "@/lib/api/alertas";
import { useTheme } from "@/components/ThemeProvider";
import { getSyncedDate, syncServerTime, isSynced } from "@/lib/time";

/**
 * Item de navegação da sidebar.
 */
interface NavItem {
  label: string;
  href: string;
  iconPath: string;
  /** Se true, o item só aparece para GESTOR e ADMIN */
  adminOnly?: boolean;
}

/**
 * Links de navegação do menu lateral.
 */
const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    iconPath:
      "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z",
  },
  {
    label: "Equipamentos",
    href: "/equipamentos",
    iconPath:
      "M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085",
  },
  {
    label: "Ordens de Manutenção",
    href: "/ordens-manutencao",
    iconPath:
      "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4",
  },
  {
    label: "Calendário",
    href: "/calendario",
    iconPath:
      "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5",
  },
  {
    label: "Relatórios & BI",
    href: "/relatorios",
    iconPath:
      "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 0 1 3 18.375v-5.25ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125v-9.75ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
  },
  {
    label: "Notificações",
    href: "/notificacoes",
    iconPath:
      "M14.857 17.082a9.049 9.049 0 0 1-5.185-2.883 9.049 9.049 0 0 1-2.883-5.185m0 0A8.96 8.96 0 0 1 8 8V7C8 4.24 10.24 2 13 2s5 2.24 5 5v1c0 .38.07.74.205 1.082m-11.348 0a8.96 8.96 0 0 0-1.9 5.46M12 21a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0 3 0m-3 0H9m1.05-3.116A11.95 11.95 0 0 1 12 18c1.328 0 2.583-.217 3.75-.616m-5.7 3.125A1.5 1.5 0 0 1 9 21",
  },
  {
    label: "Aprovações",
    href: "/aprovacoes",
    iconPath:
      "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
    adminOnly: true,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { theme, toggleTheme } = useTheme();
  const [timeString, setTimeString] = useState<string>("—");

  /* Relógio sincronizado no fuso de Brasília */
  useEffect(() => {
    if (!isSynced()) {
      syncServerTime();
    }

    const updateClock = () => {
      const now = getSyncedDate();
      const time = now.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
      const date = now.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        timeZone: "America/Sao_Paulo",
      });
      setTimeString(`${time} ${date}`);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  /* Carrega os dados do usuário logado do localStorage */
  useEffect(() => {
    const stored = localStorage.getItem("usuario");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUsuario(u);
        if (u.primeiroAcesso && pathname !== "/alterar-senha") {
          router.push("/alterar-senha");
        }
      } catch {
        /* Ignora JSON inválido */
      }
    }
  }, [pathname, router]);

  /**
   * Busca e atualiza o contador de reportes pendentes.
   * Polled a cada 30s para manter o badge atualizado.
   */
  useEffect(() => {
    const nivel = usuario?.nivel;
    if (nivel !== "ADMIN" && nivel !== "GESTOR") {
      setPendingCount(0);
      return;
    }

    async function fetchCount() {
      try {
        const [repCount, mods] = await Promise.all([
          countPendentesApi(),
          listAllModificacoesApi(),
        ]);
        const modCount = mods.filter((m) => m.status === "PENDENTE").length;
        setPendingCount(repCount + modCount);
      } catch {
        /* Silencioso — badge simplesmente não aparece */
      }
    }

    fetchCount();
    intervalRef.current = setInterval(fetchCount, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [usuario?.nivel]);

  /**
   * Busca e atualiza o contador de alertas não lidos.
   * Polled a cada 15s para manter o badge de notificações atualizado.
   */
  useEffect(() => {
    if (!usuario) {
      setUnreadCount(0);
      return;
    }

    async function fetchUnreadCount() {
      try {
        const count = await countNaoLidosApi();
        setUnreadCount(count);
      } catch {
        /* Silencioso */
      }
    }

    fetchUnreadCount();
    
    // Escuta evento customizado para atualização instantânea
    window.addEventListener("alertStatusChanged", fetchUnreadCount);
    
    const alertInterval = setInterval(fetchUnreadCount, 15_000);

    return () => {
      window.removeEventListener("alertStatusChanged", fetchUnreadCount);
      clearInterval(alertInterval);
    };
  }, [usuario]);

  /**
   * Handler de logout — limpa os dados de sessão e redireciona para o login.
   */
  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    router.push("/");
  }

  /**
   * Retorna o label amigável para o nível de acesso do usuário.
   */
  function getNivelLabel(nivel: string): string {
    const labels: Record<string, string> = {
      ADMIN: "Administrador",
      GESTOR: "Gestor",
      TECNICO: "Técnico",
    };
    return labels[nivel] ?? nivel;
  }

  const isManagerOrAdmin =
    usuario?.nivel === "ADMIN" || usuario?.nivel === "GESTOR";

  /**
   * Formata o badge de notificação:
   * - 1 a 99: mostra o número
   * - >99: mostra "99+"
   */
  function badgeLabel(count: number): string {
    if (count > 99) return "99+";
    return String(count);
  }

  return (
    <aside
      className="sticky top-0 h-screen w-[280px] shrink-0 flex flex-col z-50 transition-all duration-200"
      style={{
        background: "var(--bg-glass)",
        backdropFilter: "blur(16px) saturate(180%)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* =================================================================
          Logo da marca — topo da sidebar + Seletor de Tema (CA01)
          ================================================================= */}
      <div className="flex items-center justify-between px-5 py-5 border-b"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div className="flex items-center gap-2.5">
          <Image
            src="/icon.png"
            alt="Ícone"
            width={32}
            height={32}
            priority
          />
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="MECÂNI.CÃO PCM"
              width={118}
              height={29}
              priority
            />
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase"
              style={{
                background: "rgba(232, 132, 44, 0.12)",
                color: "#E8842C",
                border: "1px solid rgba(232, 132, 44, 0.25)",
              }}
            >
              PCM
            </span>
          </div>
        </div>

        {/* Botão Seletor de Tema (CA01) */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-[rgba(148,163,184,0.08)] text-txt-secondary hover:text-txt-primary transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
          aria-label="Alternar tema"
          title={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {theme === "dark" ? (
            /* Sun Icon (Modo Claro) */
            <svg className="w-5 h-5 text-[#E8842C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m0 13.5V21M4.93 4.93l1.59 1.59m10.96 10.96l1.59 1.59M3 12h2.25m13.5 0H21M4.93 19.07l1.59-1.59m10.96-10.96l1.59-1.59M12 7.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9Z" />
            </svg>
          ) : (
            /* Moon Icon (Modo Escuro) */
            <svg className="w-5 h-5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
          )}
        </button>
      </div>

      {/* =================================================================
          Links de navegação
          ================================================================= */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-1.5 overflow-y-auto">
        {navItems.map((item) => {
          /* Esconde itens adminOnly de técnicos */
          if (item.adminOnly && !isManagerOrAdmin) return null;

          const isActive = pathname.startsWith(item.href);
          const isAprovacoesBadge =
            item.href === "/aprovacoes" &&
            isManagerOrAdmin &&
            pendingCount > 0;
          const isAlertasBadge =
            item.href === "/notificacoes" &&
            unreadCount > 0;

          const showBadge = isAprovacoesBadge || isAlertasBadge;
          const badgeVal = isAprovacoesBadge ? pendingCount : unreadCount;

          return (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-[15px] font-medium transition-all duration-200 relative group min-h-[48px]"
              style={{
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                background: isActive
                  ? "rgba(232, 132, 44, 0.10)"
                  : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background =
                    "rgba(148, 163, 184, 0.07)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }
              }}
            >
              {/* Indicador laranja do link ativo */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full"
                  style={{ background: "#E8842C" }}
                />
              )}

              {/* Ícone do módulo */}
              <svg
                className="w-[22px] h-[22px] shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                style={{ color: isActive ? "#E8842C" : undefined }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={item.iconPath}
                />
              </svg>

              <span className="flex-1 leading-tight">{item.label}</span>

              {/* Badge de notificação */}
              {showBadge && (
                <span
                  className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold shrink-0"
                  style={{
                    background: "#EF4444",
                    color: "#FFFFFF",
                    lineHeight: 1,
                    boxShadow: "0 0 8px rgba(239, 68, 68, 0.5)",
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  }}
                >
                  {badgeLabel(badgeVal)}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* =================================================================
          Área do usuário — parte inferior da sidebar
          ================================================================= */}
      <div
        className="px-3 py-4 border-t"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        {/* Link Usuários (Apenas ADMIN, separado e com cor de fundo distinta) */}
        {usuario?.nivel === "ADMIN" && (
          <a
            href="/usuarios"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[15px] font-bold transition-all duration-200 relative group min-h-[48px] mb-3"
            style={{
              color: pathname === "/usuarios" ? "#FFFFFF" : "#14B8A6",
              background: pathname === "/usuarios"
                ? "rgba(20, 184, 166, 0.25)"
                : "rgba(20, 184, 166, 0.08)",
              border: "1px solid rgba(20, 184, 166, 0.25)",
            }}
            onMouseEnter={(e) => {
              if (pathname !== "/usuarios") {
                e.currentTarget.style.background = "rgba(20, 184, 166, 0.15)";
              }
            }}
            onMouseLeave={(e) => {
              if (pathname !== "/usuarios") {
                e.currentTarget.style.background = "rgba(20, 184, 166, 0.08)";
              }
            }}
          >
            {/* Indicador lateral teal do link ativo */}
            {pathname === "/usuarios" && (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 rounded-r-full"
                style={{ background: "#14B8A6" }}
              />
            )}

            <svg
              className="w-[22px] h-[22px] shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 20c-2.034 0-3.937-.53-5.589-1.46M15 15.703a9.004 9.004 0 0 0-3.375-1.742m-1.625-2.07a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM18.75 8a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>

            <span className="flex-1 leading-tight">Usuários</span>
          </a>
        )}

        {/* Relógio/Data de Brasília (UTC-3) */}
        <div className="flex flex-col gap-0.5 mb-3 px-4 py-2.5 rounded-xl border border-dashed"
          style={{
            background: "rgba(232, 132, 44, 0.03)",
            borderColor: "rgba(232, 132, 44, 0.15)",
          }}
        >
          <span className="text-[10px] font-semibold tracking-wider uppercase" style={{ color: "#E8842C" }}>
            Fuso Horário Padrão
          </span>
          <div className="flex items-center gap-2 mt-1">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="#E8842C" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span className="text-[14px] font-bold font-mono tracking-wide" style={{ color: "var(--text-primary)" }}>
              {timeString}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(232, 132, 44, 0.12)", color: "#E8842C" }}>
              BRT
            </span>
          </div>
        </div>

        {/* Info do usuário logado */}
        {usuario && (
          <div className="flex items-center gap-3 mb-3 px-3 py-3 rounded-xl"
            style={{ background: "rgba(148, 163, 184, 0.04)" }}
          >
            {/* Avatar com inicial do nome */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-[15px] font-bold shrink-0"
              style={{
                background: "rgba(232, 132, 44, 0.15)",
                color: "#E8842C",
              }}
            >
              {usuario.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p
                className="text-[14px] font-semibold truncate"
                style={{ color: "var(--text-primary)" }}
              >
                {usuario.nome}
              </p>
              <p
                className="text-[12px] tracking-wide mt-0.5"
                style={{ color: "var(--text-secondary)" }}
              >
                {getNivelLabel(usuario.nivel)}
              </p>
            </div>
          </div>
        )}

        {/* Botão de logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[14px] font-medium transition-all duration-200 cursor-pointer min-h-[44px]"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
            e.currentTarget.style.color = "#FCA5A5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <svg
            className="w-5 h-5 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
            />
          </svg>
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
