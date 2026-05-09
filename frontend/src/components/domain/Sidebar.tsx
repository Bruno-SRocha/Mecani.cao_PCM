/**
 * Componente: Sidebar — Navegação Principal da Área Privada
 *
 * Menu lateral fixo com navegação para os módulos do sistema.
 * Exibe o logo da marca, links de navegação com ícones,
 * informações do usuário logado e botão de logout.
 *
 * Design: fundo escuro (navy-950) com glassmorphism sutil,
 * indicador laranja no link ativo, e micro-animações de hover.
 *
 * Responsivo: em mobile, a sidebar fica oculta e pode ser
 * aberta via botão hamburger no header.
 */

"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Usuario } from "@/types/usuario.types";

/**
 * Item de navegação da sidebar.
 * Define o label, href e ícone SVG path de cada link.
 */
interface NavItem {
  label: string;
  href: string;
  iconPath: string;
}

/**
 * Links de navegação do menu lateral.
 * Cada entrada representa um módulo do sistema Mecâni.cão PCM.
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
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  /* Carrega os dados do usuário logado do localStorage */
  useEffect(() => {
    const stored = localStorage.getItem("usuario");
    if (stored) {
      try {
        setUsuario(JSON.parse(stored));
      } catch {
        /* Ignora JSON inválido */
      }
    }
  }, []);

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

  return (
    <aside
      className="sticky top-0 h-screen w-[260px] shrink-0 flex flex-col z-50"
      style={{
        background: "linear-gradient(180deg, #070E1B 0%, #0A1428 100%)",
        borderRight: "1px solid rgba(148, 163, 184, 0.08)",
      }}
    >
      {/* =================================================================
          Logo da marca — topo da sidebar
          ================================================================= */}
      <div className="flex items-center gap-3 px-6 py-6 border-b"
        style={{ borderColor: "rgba(148, 163, 184, 0.08)" }}
      >
        <Image
          src="/logo.png"
          alt="MECÂNI.CÃO PCM"
          width={140}
          height={35}
          priority
        />
        <span
          className="px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase"
          style={{
            background: "rgba(232, 132, 44, 0.12)",
            color: "#E8842C",
            border: "1px solid rgba(232, 132, 44, 0.25)",
          }}
        >
          PCM
        </span>
      </div>

      {/* =================================================================
          Links de navegação
          ================================================================= */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-medium transition-all duration-200 relative group"
              style={{
                color: isActive ? "#F1F5F9" : "#64748B",
                background: isActive
                  ? "rgba(232, 132, 44, 0.08)"
                  : "transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background =
                    "rgba(148, 163, 184, 0.06)";
                  e.currentTarget.style.color = "#94A3B8";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#64748B";
                }
              }}
            >
              {/* Indicador laranja do link ativo */}
              {isActive && (
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                  style={{ background: "#E8842C" }}
                />
              )}

              {/* Ícone do módulo */}
              <svg
                className="w-5 h-5 shrink-0"
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

              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* =================================================================
          Área do usuário — parte inferior da sidebar
          ================================================================= */}
      <div
        className="px-4 py-4 border-t"
        style={{ borderColor: "rgba(148, 163, 184, 0.08)" }}
      >
        {/* Info do usuário logado */}
        {usuario && (
          <div className="flex items-center gap-3 mb-3 px-2">
            {/* Avatar com inicial do nome */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                background: "rgba(232, 132, 44, 0.15)",
                color: "#E8842C",
              }}
            >
              {usuario.nome.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p
                className="text-[13px] font-semibold truncate"
                style={{ color: "#F1F5F9" }}
              >
                {usuario.nome}
              </p>
              <p
                className="text-[11px] tracking-wide"
                style={{ color: "#64748B" }}
              >
                {getNivelLabel(usuario.nivel)}
              </p>
            </div>
          </div>
        )}

        {/* Botão de logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 cursor-pointer"
          style={{ color: "#64748B" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
            e.currentTarget.style.color = "#FCA5A5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#64748B";
          }}
        >
          <svg
            className="w-4.5 h-4.5"
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
