/**
 * Página: Gestão de Usuários — CRUD Completo (Apenas ADMIN)
 *
 * Permite que administradores gerenciem o acesso de novos colaboradores
 * à plataforma de forma centralizada, segura e organizada.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listUsersApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
} from "@/lib/api/auth";
import type { Usuario, NivelUsuario } from "@/types/usuario.types";

export default function UsuariosPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<Usuario | null>(null);

  /* Estado dos dados */
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filtro, setFiltro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  /* Modais e formulários */
  const [modalCriarAberto, setModalCriarAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [modalExcluirAberto, setModalExcluirAberto] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<Usuario | null>(null);

  /* Form de Criação */
  const [novoNome, setNovoNome] = useState("");
  const [novoUsername, setNovoUsername] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoNivel, setNovoNivel] = useState<NivelUsuario>("TECNICO");

  /* Form de Edição */
  const [editNome, setEditNome] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editNivel, setEditNivel] = useState<NivelUsuario>("TECNICO");

  /* Modal de Credenciais Geradas */
  const [credenciaisGeradas, setCredenciaisGeradas] = useState<{
    aberto: boolean;
    nome: string;
    username: string;
    email: string;
    senhaGerada: string;
  } | null>(null);

  /* Copiar para o clipboard */
  const [copiado, setCopiado] = useState(false);

  /* Validação de acesso */
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("usuario");

    if (!storedToken || !storedUser) {
      router.push("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as Usuario;
      if (parsedUser.nivel !== "ADMIN") {
        /* Apenas ADMIN pode acessar esta página */
        router.push("/dashboard");
        return;
      }
      setToken(storedToken);
      setAdminUser(parsedUser);
      carregarUsuarios(storedToken);
    } catch {
      router.push("/");
    }
  }, [router]);

  /* Busca usuários da API */
  async function carregarUsuarios(authToken: string) {
    setCarregando(true);
    setErro("");
    try {
      const data = await listUsersApi(authToken);
      setUsuarios(data);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar lista de usuários.");
    } finally {
      setCarregando(false);
    }
  }

  /* Criação de Usuário */
  async function handleCriarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!token) return;

    if (!novoNome.trim() || !novoUsername.trim() || !novoEmail.trim()) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    setCarregando(true);
    try {
      const response = await createUserApi(token, {
        nome: novoNome.trim(),
        nomeUsuario: novoUsername.trim(),
        email: novoEmail.trim(),
        nivel: novoNivel,
      });

      /* Exibe o modal de credenciais com a senha gerada */
      setCredenciaisGeradas({
        aberto: true,
        nome: response.nome,
        username: response.nomeUsuario,
        email: response.email,
        senhaGerada: response.senhaGerada,
      });

      /* Limpa form */
      setNovoNome("");
      setNovoUsername("");
      setNovoEmail("");
      setNovoNivel("TECNICO");
      setModalCriarAberto(false);

      /* Recarrega tabela */
      carregarUsuarios(token);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao criar usuário.");
    } finally {
      setCarregando(false);
    }
  }

  /* Abrir Modal de Edição */
  function abrirModalEditar(user: Usuario) {
    setUsuarioSelecionado(user);
    setEditNome(user.nome);
    setEditEmail(user.email);
    setEditNivel(user.nivel);
    setModalEditarAberto(true);
  }

  /* Atualização de Usuário */
  async function handleEditarUsuario(e: React.FormEvent) {
    e.preventDefault();
    setErro("");

    if (!token || !usuarioSelecionado) return;

    if (!editNome.trim() || !editEmail.trim()) {
      setErro("Preencha todos os campos obrigatórios.");
      return;
    }

    setCarregando(true);
    try {
      await updateUserApi(token, usuarioSelecionado.id, {
        nome: editNome.trim(),
        email: editEmail.trim(),
        nivel: editNivel,
      });

      setMensagemSucesso("Usuário atualizado com sucesso!");
      setModalEditarAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios(token);

      setTimeout(() => setMensagemSucesso(""), 4000);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao atualizar usuário.");
    } finally {
      setCarregando(false);
    }
  }

  /* Abrir Confirmação de Exclusão */
  function abrirModalExcluir(user: Usuario) {
    if (user.nivel === "ADMIN") {
      alert("Usuários administradores não podem ser excluídos por segurança.");
      return;
    }
    setUsuarioSelecionado(user);
    setModalExcluirAberto(true);
  }

  /* Exclusão de Usuário */
  async function handleExcluirUsuario() {
    setErro("");
    if (!token || !usuarioSelecionado) return;

    setCarregando(true);
    try {
      await deleteUserApi(token, usuarioSelecionado.id);
      setMensagemSucesso("Usuário excluído com sucesso!");
      setModalExcluirAberto(false);
      setUsuarioSelecionado(null);
      carregarUsuarios(token);

      setTimeout(() => setMensagemSucesso(""), 4000);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao excluir usuário.");
    } finally {
      setCarregando(false);
    }
  }

  /* Copiar credenciais para clipboard */
  function handleCopiarCredenciais() {
    if (!credenciaisGeradas) return;

    const texto = `Mecâni.cão PCM - Credenciais de Acesso
------------------------------------
Colaborador: ${credenciaisGeradas.nome}
Usuário: ${credenciaisGeradas.username}
E-mail: ${credenciaisGeradas.email}
Senha Temporária: ${credenciaisGeradas.senhaGerada}
Acesso: http://localhost:3000/
------------------------------------`;

    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  /* Filtro de busca */
  const usuariosFiltrados = usuarios.filter((user) => {
    const termo = filtro.toLowerCase();
    return (
      user.nome.toLowerCase().includes(termo) ||
      user.nomeUsuario.toLowerCase().includes(termo) ||
      user.email.toLowerCase().includes(termo) ||
      user.nivel.toLowerCase().includes(termo)
    );
  });

  function getNivelBadgeStyle(nivel: NivelUsuario) {
    switch (nivel) {
      case "ADMIN":
        return {
          background: "rgba(239, 68, 68, 0.12)",
          color: "#EF4444",
          border: "1px solid rgba(239, 68, 68, 0.2)",
        };
      case "GESTOR":
        return {
          background: "rgba(232, 132, 44, 0.12)",
          color: "#E8842C",
          border: "1px solid rgba(232, 132, 44, 0.2)",
        };
      case "TECNICO":
        return {
          background: "rgba(20, 184, 166, 0.12)",
          color: "#14B8A6",
          border: "1px solid rgba(20, 184, 166, 0.2)",
        };
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* =================================================================
          Cabeçalho da Página
          ================================================================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase"
              style={{
                background: "rgba(20, 184, 166, 0.15)",
                color: "#14B8A6",
                border: "1px solid rgba(20, 184, 166, 0.25)",
              }}
            >
              Controle de Acessos
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-txt-primary">
            Gestão de Usuários
          </h1>
          <p className="text-sm text-txt-secondary mt-1">
            Cadastre novos colaboradores, defina níveis de acesso e audite registros.
          </p>
        </div>

        {/* Botão Novo Usuário */}
        <button
          onClick={() => setModalCriarAberto(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl text-[14px] font-bold text-white cursor-pointer transition-all duration-200"
          style={{ background: "#14B8A6" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#0D9488";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#14B8A6";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
          </svg>
          Registrar Novo Usuário
        </button>
      </div>

      {/* =================================================================
          Feedbacks (Erro / Sucesso)
          ================================================================= */}
      {erro && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#FCA5A5",
          }}
          role="alert"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>{erro}</span>
        </div>
      )}

      {mensagemSucesso && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            color: "#A7F3D0",
          }}
          role="alert"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span>{mensagemSucesso}</span>
        </div>
      )}

      {/* =================================================================
          Filtro de busca
          ================================================================= */}
      <div
        className="p-4 rounded-2xl border flex items-center gap-3"
        style={{
          background: "var(--bg-glass)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <svg className="w-5 h-5 text-txt-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
        </svg>
        <input
          type="text"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar por nome completo, e-mail, username ou nível de acesso..."
          className="flex-1 bg-transparent border-none outline-none text-sm text-txt-primary placeholder:text-txt-secondary"
        />
        {filtro && (
          <button
            onClick={() => setFiltro("")}
            className="text-[11px] font-bold text-txt-secondary hover:text-txt-primary cursor-pointer"
          >
            Limpar Filtro
          </button>
        )}
      </div>

      {/* =================================================================
          Tabela de Usuários (CRUD)
          ================================================================= */}
      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          background: "var(--bg-glass)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {carregando && usuarios.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <svg className="w-10 h-10 animate-spin text-teal-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm text-txt-secondary font-medium">Buscando usuários cadastrados...</span>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-16 text-center">
            <svg className="w-12 h-12 text-txt-secondary mx-auto mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
            <p className="text-base font-semibold text-txt-primary">Nenhum usuário encontrado</p>
            <p className="text-sm text-txt-secondary mt-1">Refine a sua pesquisa ou adicione um novo colaborador.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-txt-primary">
              <thead>
                <tr className="border-b font-semibold" style={{ borderColor: "var(--border-subtle)", background: "rgba(148, 163, 184, 0.02)" }}>
                  <th className="px-6 py-4.5 text-txt-secondary">Colaborador</th>
                  <th className="px-6 py-4.5 text-txt-secondary">E-mail Corporativo</th>
                  <th className="px-6 py-4.5 text-txt-secondary">Nível de Acesso</th>
                  <th className="px-6 py-4.5 text-txt-secondary">Auditoria (Criado por)</th>
                  <th className="px-6 py-4.5 text-txt-secondary">Data de Cadastro</th>
                  <th className="px-6 py-4.5 text-txt-secondary text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {usuariosFiltrados.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-[rgba(148,163,184,0.02)] transition-colors duration-150"
                  >
                    {/* Nome + Username */}
                    <td className="px-6 py-4.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            background: user.nivel === "ADMIN" ? "rgba(239, 68, 68, 0.12)" : "rgba(20, 184, 166, 0.12)",
                            color: user.nivel === "ADMIN" ? "#EF4444" : "#14B8A6",
                          }}
                        >
                          {user.nome.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold">{user.nome}</p>
                          <p className="text-xs text-txt-secondary mt-0.5">@{user.nomeUsuario}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4.5 text-txt-secondary font-mono text-xs">
                      {user.email || "—"}
                    </td>

                    {/* Nível de acesso */}
                    <td className="px-6 py-4.5">
                      <span
                        className="px-2 py-1 rounded text-xs font-bold tracking-wider"
                        style={getNivelBadgeStyle(user.nivel)}
                      >
                        {user.nivel}
                      </span>
                    </td>

                    {/* Criado Por */}
                    <td className="px-6 py-4.5 text-txt-secondary text-xs">
                      {user.criadoPor ? (
                        <span className="font-semibold text-txt-primary">{user.criadoPor}</span>
                      ) : (
                        <span className="italic text-gray-500">Sistema</span>
                      )}
                    </td>

                    {/* Criado Em */}
                    <td className="px-6 py-4.5 text-txt-secondary text-xs font-mono">
                      {user.criadoEm
                        ? new Date(user.criadoEm).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Editar */}
                        <button
                          onClick={() => abrirModalEditar(user)}
                          className="p-2 rounded-lg hover:bg-[rgba(148,163,184,0.08)] text-txt-secondary hover:text-txt-primary transition-all duration-150 cursor-pointer"
                          title="Editar Usuário"
                        >
                          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                          </svg>
                        </button>

                        {/* Excluir */}
                        {user.nivel !== "ADMIN" ? (
                          <button
                            onClick={() => abrirModalExcluir(user)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-txt-secondary hover:text-red-400 transition-all duration-150 cursor-pointer"
                            title="Excluir Usuário"
                          >
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        ) : (
                          <div className="w-8.5 h-8.5" /> /* Espaçador para manter alinhamento */
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================================
          MODAL: Criar Novo Usuário
          ================================================================= */}
      {modalCriarAberto && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[rgba(12,20,38,0.95)] border border-[rgba(100,116,139,0.2)] rounded-2xl p-7 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
                Registrar Colaborador
              </h2>
              <button
                onClick={() => setModalCriarAberto(false)}
                className="text-txt-secondary hover:text-white cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCriarUsuario} className="space-y-5">
              {/* Nome Completo */}
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase mb-1.5 text-[#94A3B8]">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-4 py-3 rounded-lg bg-[rgba(12,20,38,0.6)] border border-[rgba(100,116,139,0.2)] text-white placeholder:text-txt-secondary outline-none focus:border-teal/50 transition-colors"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase mb-1.5 text-[#94A3B8]">
                  Nome de Usuário (Username) *
                </label>
                <input
                  type="text"
                  required
                  value={novoUsername}
                  onChange={(e) => setNovoUsername(e.target.value)}
                  placeholder="Ex: joao.silva"
                  className="w-full px-4 py-3 rounded-lg bg-[rgba(12,20,38,0.6)] border border-[rgba(100,116,139,0.2)] text-white placeholder:text-txt-secondary outline-none focus:border-teal/50 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase mb-1.5 text-[#94A3B8]">
                  E-mail Corporativo *
                </label>
                <input
                  type="email"
                  required
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  placeholder="Ex: joao.silva@mecanicao.com.br"
                  className="w-full px-4 py-3 rounded-lg bg-[rgba(12,20,38,0.6)] border border-[rgba(100,116,139,0.2)] text-white placeholder:text-txt-secondary outline-none focus:border-teal/50 transition-colors"
                />
              </div>

              {/* Nível de acesso */}
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase mb-1.5 text-[#94A3B8]">
                  Nível de Acesso *
                </label>
                <select
                  value={novoNivel}
                  onChange={(e) => setNovoNivel(e.target.value as NivelUsuario)}
                  className="w-full px-4 py-3 rounded-lg bg-[rgba(12,20,38,0.65)] border border-[rgba(100,116,139,0.2)] text-white outline-none focus:border-teal/50 transition-colors cursor-pointer"
                >
                  <option value="TECNICO" className="bg-[#0c1426]">TECNICO (Técnico de Campo)</option>
                  <option value="GESTOR" className="bg-[#0c1426]">GESTOR (Gestor de Manutenção)</option>
                  <option value="ADMIN" className="bg-[#0c1426]">ADMIN (Administrador do Sistema)</option>
                </select>
              </div>

              {/* Info senha complexa */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-lg border bg-teal/5 border-teal/20 text-[#2DD4BF] text-[12px] leading-normal">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
                </svg>
                <span>
                  O sistema gerará automaticamente uma **senha aleatória complexa** (mínimo de 12 caracteres, incluindo símbolos e números) e enviará um e-mail ao colaborador.
                </span>
              </div>

              {/* Ações do form */}
              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setModalCriarAberto(false)}
                  className="px-5 py-2.5 rounded-lg border border-[rgba(100,116,139,0.2)] text-txt-secondary hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={carregando}
                  className="px-6 py-2.5 rounded-lg font-bold text-white bg-teal hover:bg-teal-600 transition-colors cursor-pointer disabled:opacity-50"
                  style={{ background: "#14B8A6" }}
                >
                  {carregando ? "Registrando..." : "Confirmar Cadastro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================
          MODAL: Edição de Usuário
          ================================================================= */}
      {modalEditarAberto && usuarioSelecionado && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[rgba(12,20,38,0.95)] border border-[rgba(100,116,139,0.2)] rounded-2xl p-7 shadow-2xl animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-6 h-6 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                </svg>
                Editar Colaborador
              </h2>
              <button
                onClick={() => setModalEditarAberto(false)}
                className="text-txt-secondary hover:text-white cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditarUsuario} className="space-y-5">
              {/* Username (Disabled) */}
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase mb-1.5 text-[#64748B]">
                  Nome de Usuário (Username)
                </label>
                <input
                  type="text"
                  disabled
                  value={usuarioSelecionado.nomeUsuario}
                  className="w-full px-4 py-3 rounded-lg bg-[rgba(12,20,38,0.25)] border border-[rgba(100,116,139,0.1)] text-[#64748B] outline-none cursor-not-allowed"
                />
              </div>

              {/* Nome Completo */}
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase mb-1.5 text-[#94A3B8]">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-4 py-3 rounded-lg bg-[rgba(12,20,38,0.6)] border border-[rgba(100,116,139,0.2)] text-white placeholder:text-txt-secondary outline-none focus:border-teal/50 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase mb-1.5 text-[#94A3B8]">
                  E-mail Corporativo *
                </label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="Ex: joao.silva@mecanicao.com.br"
                  className="w-full px-4 py-3 rounded-lg bg-[rgba(12,20,38,0.6)] border border-[rgba(100,116,139,0.2)] text-white placeholder:text-txt-secondary outline-none focus:border-teal/50 transition-colors"
                />
              </div>

              {/* Nível de acesso */}
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase mb-1.5 text-[#94A3B8]">
                  Nível de Acesso *
                </label>
                <select
                  value={editNivel}
                  onChange={(e) => setEditNivel(e.target.value as NivelUsuario)}
                  className="w-full px-4 py-3 rounded-lg bg-[rgba(12,20,38,0.65)] border border-[rgba(100,116,139,0.2)] text-white outline-none focus:border-teal/50 transition-colors cursor-pointer"
                >
                  <option value="TECNICO" className="bg-[#0c1426]">TECNICO (Técnico de Campo)</option>
                  <option value="GESTOR" className="bg-[#0c1426]">GESTOR (Gestor de Manutenção)</option>
                  <option value="ADMIN" className="bg-[#0c1426]">ADMIN (Administrador do Sistema)</option>
                </select>
              </div>

              {/* Ações do form */}
              <div className="flex gap-3 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setModalEditarAberto(false)}
                  className="px-5 py-2.5 rounded-lg border border-[rgba(100,116,139,0.2)] text-txt-secondary hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={carregando}
                  className="px-6 py-2.5 rounded-lg font-bold text-white bg-teal hover:bg-teal-600 transition-colors cursor-pointer disabled:opacity-50"
                  style={{ background: "#14B8A6" }}
                >
                  {carregando ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================
          MODAL: Confirmação de Exclusão
          ================================================================= */}
      {modalExcluirAberto && usuarioSelecionado && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[rgba(12,20,38,0.95)] border border-[rgba(239,68,68,0.25)] rounded-2xl p-7 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 text-red-500 mb-4">
              <svg className="w-8 h-8 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <h2 className="text-xl font-bold text-white">Excluir Colaborador?</h2>
            </div>

            <p className="text-sm text-txt-secondary leading-relaxed mb-6">
              Você está prestes a excluir permanentemente a conta de{" "}
              <strong className="text-white">{usuarioSelecionado.nome}</strong> (@{usuarioSelecionado.nomeUsuario}).
              Esta ação removerá todos os privilégios de acesso e não poderá ser desfeita.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setModalExcluirAberto(false)}
                className="px-5 py-2.5 rounded-lg border border-[rgba(100,116,139,0.2)] text-txt-secondary hover:text-white transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExcluirUsuario}
                disabled={carregando}
                className="px-6 py-2.5 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {carregando ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================
          MODAL: Exibição de Credenciais Criadas
          ================================================================= */}
      {credenciaisGeradas?.aberto && (
        <div className="fixed inset-0 flex items-center justify-center z-[110] p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0c1426] border border-teal/30 rounded-2xl p-7 shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 text-teal-400 mb-3">
              <svg className="w-8 h-8 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
              <h2 className="text-xl font-bold text-white">Usuário Registrado com Sucesso!</h2>
            </div>

            <p className="text-sm text-txt-secondary leading-relaxed mb-6">
              A conta do colaborador foi criada. A senha foi gerada no padrão de segurança e complexidade da empresa. Copie as credenciais abaixo para repassar ao colaborador.
            </p>

            {/* Caixa com credenciais */}
            <div className="bg-[#050b18] border border-[rgba(100,116,139,0.15)] rounded-xl p-5 font-mono text-xs space-y-3 relative mb-6">
              <button
                onClick={handleCopiarCredenciais}
                className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[rgba(100,116,139,0.2)] bg-[rgba(12,20,38,0.5)] hover:bg-[rgba(12,20,38,0.8)] text-txt-secondary hover:text-white transition-colors cursor-pointer"
              >
                {copiado ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span className="text-teal font-bold">Copiado!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.524 3h-3.048a2.25 2.25 0 0 0-2.143 1.888L6.22 8.794h11.56l-2.114-4.906ZM6.22 8.794a2.25 2.25 0 0 0-2.22 2.509l1.51 9.77a2.25 2.25 0 0 0 2.22 1.889h8.54a2.25 2.25 0 0 0 2.22-1.89l1.51-9.77a2.25 2.25 0 0 0-2.22-2.51H6.22Z" />
                    </svg>
                    <span>Copiar</span>
                  </>
                )}
              </button>

              <div className="space-y-1">
                <span className="text-[10px] text-txt-secondary tracking-wider uppercase">Colaborador</span>
                <p className="text-white text-sm font-semibold">{credenciaisGeradas.nome}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-txt-secondary tracking-wider uppercase">Nome de Usuário</span>
                <p className="text-white text-sm font-semibold">{credenciaisGeradas.username}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-txt-secondary tracking-wider uppercase">E-mail Corporativo</span>
                <p className="text-white text-sm font-semibold">{credenciaisGeradas.email}</p>
              </div>

              <div className="space-y-1 pt-2 border-t border-[rgba(100,116,139,0.1)]">
                <span className="text-[10px] text-teal-400 tracking-wider uppercase font-bold">Senha Temporária Gerada</span>
                <p className="text-[#2DD4BF] text-base font-bold font-mono tracking-widest bg-[rgba(45,212,191,0.05)] p-2.5 rounded border border-teal/15 select-all mt-1">
                  {credenciaisGeradas.senhaGerada}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCredenciaisGeradas(null)}
                className="px-6 py-2.5 rounded-lg font-bold text-white bg-teal hover:bg-teal-600 transition-colors cursor-pointer"
                style={{ background: "#14B8A6" }}
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
