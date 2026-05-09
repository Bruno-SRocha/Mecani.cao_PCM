/**
 * Componente: LoginForm
 *
 * Formulário de autenticação do sistema Mecâni.cão PCM.
 * Design premium de painel de login corporativo SaaS.
 *
 * Layout vertical com:
 * - Barra laranja + "ACESSO AO SISTEMA"
 * - Título "Bem-vindo de volta"
 * - Subtítulo descritivo
 * - Campo de usuário (sem ícone interno, fundo escuro com borda visível)
 * - Campo de senha com toggle de visibilidade (olho)
 * - Checkbox "Lembrar-me" + link "Esqueceu sua senha?"
 * - Botão laranja largo com ícone de seta + "Entrar"
 * - Rodapé "Mecâni.cão PCM • v1.0 • Sistema Seguro"
 *
 * Estilo: inputs sem ícones laterais, fundo azul-escuro translúcido
 * com borda sutil visível, cantos arredondados, espaçamento generoso.
 */

"use client";

import { useState, type FormEvent } from "react";
import { loginApi } from "@/lib/api/auth";

export default function LoginForm() {
  /* ---------------------------------------------------------------
     Estado do formulário
     --------------------------------------------------------------- */
  const [nomeUsuario, setNomeUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrarMe, setLembrarMe] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  /**
   * Handler de submissão do formulário de login.
   *
   * Envia as credenciais para a API /auth/login e, em caso de sucesso,
   * armazena o token JWT e redireciona para o dashboard.
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    /* Validação básica — campos obrigatórios */
    if (!nomeUsuario.trim() || !senha.trim()) {
      setErro("Preencha todos os campos.");
      return;
    }

    setCarregando(true);

    try {
      const data = await loginApi({ nomeUsuario: nomeUsuario.trim(), senha });

      /* Armazena o token JWT e os dados do usuário logado */
      localStorage.setItem("token", data.token);
      localStorage.setItem("usuario", JSON.stringify(data.usuario));

      /* Redireciona para o dashboard (área privada) */
      window.location.href = "/dashboard";
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao conectar com o servidor."
      );
    } finally {
      setCarregando(false);
    }
  }

  /* ---------------------------------------------------------------
     Estilos reutilizáveis para os inputs
     Fundo escuro translúcido com borda sutil visível (como na ref)
     --------------------------------------------------------------- */
  const inputStyle: React.CSSProperties = {
    background: "rgba(12, 20, 38, 0.65)",
    border: "1px solid rgba(100, 116, 139, 0.2)",
    color: "#F1F5F9",
  };

  const inputFocusHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(232, 132, 44, 0.5)";
    e.target.style.boxShadow = "0 0 0 2px rgba(232, 132, 44, 0.08)";
  };

  const inputBlurHandler = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "rgba(100, 116, 139, 0.2)";
    e.target.style.boxShadow = "none";
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[420px] animate-fade-in-up"
      style={{ animationDelay: "0.15s", animationFillMode: "both" }}
    >
      {/* =================================================================
          Cabeçalho — "ACESSO AO SISTEMA" com barra laranja
          ================================================================= */}
      <div className="mb-8">
        {/* Barra laranja + rótulo (como na imagem de referência) */}
        <div className="flex items-center gap-3 mb-5">
          {/* Barra horizontal laranja */}
          <div
            className="w-6 h-[3px] rounded-full"
            style={{ background: "#E8842C" }}
          />
          <span
            className="text-[11px] font-semibold tracking-[0.25em] uppercase"
            style={{ color: "#E8842C" }}
          >
            Acesso ao Sistema
          </span>
        </div>

        {/* Título principal */}
        <h1
          className="text-[32px] font-bold leading-tight tracking-tight mb-3"
          style={{ color: "#F1F5F9" }}
        >
          Bem-vindo de volta
        </h1>

        {/* Subtítulo */}
        <p
          className="text-[15px] leading-relaxed"
          style={{ color: "#64748B" }}
        >
          Informe suas credenciais para acessar o painel
        </p>
      </div>

      {/* =================================================================
          Mensagem de erro (visível quando há falha no login)
          ================================================================= */}
      {erro && (
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-6 animate-fade-in"
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#FCA5A5",
          }}
          role="alert"
          aria-live="assertive"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          <span>{erro}</span>
        </div>
      )}

      {/* =================================================================
          Campos do formulário
          ================================================================= */}
      <div className="space-y-5 mb-5">

        {/* ---------------------------------------------------------------
            Campo: Usuário
            Sem ícone interno — apenas label + input limpo
            --------------------------------------------------------------- */}
        <div>
          <label
            htmlFor="login-username"
            className="block text-[11px] font-semibold tracking-[0.2em] uppercase mb-2.5"
            style={{ color: "#94A3B8" }}
          >
            Usuário
          </label>
          <input
            id="login-username"
            type="text"
            value={nomeUsuario}
            onChange={(e) => setNomeUsuario(e.target.value)}
            placeholder="Digite seu usuário"
            autoComplete="username"
            disabled={carregando}
            className="w-full px-5 py-4 rounded-lg text-[15px] outline-none transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[#4A5568]"
            style={inputStyle}
            onFocus={inputFocusHandler}
            onBlur={inputBlurHandler}
          />
        </div>

        {/* ---------------------------------------------------------------
            Campo: Senha (com toggle de visibilidade no lado direito)
            --------------------------------------------------------------- */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-[11px] font-semibold tracking-[0.2em] uppercase mb-2.5"
            style={{ color: "#94A3B8" }}
          >
            Senha
          </label>
          <div className="relative">
            <input
              id="login-password"
              type={mostrarSenha ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              disabled={carregando}
              className="w-full px-5 py-4 pr-14 rounded-lg text-[15px] outline-none transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[#4A5568]"
              style={inputStyle}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
            />
            {/* Botão de toggle: mostrar/ocultar senha (ícone olho) */}
            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              className="absolute inset-y-0 right-0 flex items-center pr-5 transition-colors duration-200 cursor-pointer"
              style={{ color: "#4A5568" }}
              onMouseEnter={(e) => { (e.currentTarget).style.color = "#94A3B8"; }}
              onMouseLeave={(e) => { (e.currentTarget).style.color = "#4A5568"; }}
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {mostrarSenha ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================
          Linha auxiliar: "Lembrar-me" + "Esqueceu sua senha?"
          ================================================================= */}
      <div className="flex items-center justify-between mb-7">
        {/* Checkbox "Lembrar-me" */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={lembrarMe}
            onChange={(e) => setLembrarMe(e.target.checked)}
            className="sr-only peer"
          />
          {/* Checkbox visual customizado */}
          <div
            className="w-[18px] h-[18px] rounded flex items-center justify-center transition-all duration-200 shrink-0"
            style={{
              background: lembrarMe ? "#E8842C" : "rgba(12, 20, 38, 0.65)",
              border: lembrarMe ? "1px solid #E8842C" : "1px solid rgba(100, 116, 139, 0.25)",
            }}
          >
            {lembrarMe && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            )}
          </div>
          <span
            className="text-[13px]"
            style={{ color: "#94A3B8" }}
          >
            Lembrar-me
          </span>
        </label>

        {/* Link "Esqueceu sua senha?" */}
        <a
          href="#"
          className="text-[13px] transition-colors duration-200 hover:underline"
          style={{ color: "#94A3B8" }}
          onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.color = "#E8842C"; }}
          onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.color = "#94A3B8"; }}
        >
          Esqueceu sua senha?
        </a>
      </div>

      {/* =================================================================
          Botão principal — ícone seta + "Entrar"
          Laranja vibrante, full-width, com sombra luminosa.
          ================================================================= */}
      <button
        id="login-submit-btn"
        type="submit"
        disabled={carregando}
        className="w-full py-4 rounded-lg text-[15px] font-bold text-white cursor-pointer
          flex items-center justify-center gap-2.5
          transition-all duration-300 ease-out
          disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: carregando
            ? "#C96E1E"
            : "#E8842C",
          boxShadow: carregando
            ? "none"
            : "0 4px 20px rgba(232, 132, 44, 0.25)",
        }}
        onMouseEnter={(e) => {
          if (!carregando) {
            (e.currentTarget).style.background = "#D4781F";
            (e.currentTarget).style.boxShadow = "0 6px 28px rgba(232, 132, 44, 0.4)";
            (e.currentTarget).style.transform = "translateY(-1px)";
          }
        }}
        onMouseLeave={(e) => {
          if (!carregando) {
            (e.currentTarget).style.background = "#E8842C";
            (e.currentTarget).style.boxShadow = "0 4px 20px rgba(232, 132, 44, 0.25)";
            (e.currentTarget).style.transform = "translateY(0)";
          }
        }}
      >
        {carregando ? (
          <>
            {/* Spinner de carregamento */}
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Autenticando...</span>
          </>
        ) : (
          <>
            {/* Ícone seta de login (→]) como na referência */}
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            <span>Entrar</span>
          </>
        )}
      </button>

      {/* =================================================================
          Rodapé — Versão do sistema
          Linha divisória discreta + texto pequeno centralizado.
          ================================================================= */}
      <div className="mt-10">
        {/* Linha divisória */}
        <div
          className="w-full h-px mb-5"
          style={{ background: "rgba(148, 163, 184, 0.08)" }}
        />
        <p
          className="text-center text-[12px] tracking-wide"
          style={{ color: "#334155" }}
        >
          Mecâni.cão PCM &bull; v1.0 &bull; Sistema Seguro
        </p>
      </div>
    </form>
  );
}
