/**
 * Página: Recuperar Senha
 *
 * Solicita a recuperação de senha a partir do e-mail corporativo do usuário.
 */

"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { requestPasswordResetApi } from "@/lib/api/auth";

export default function RecuperarSenhaPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucessoMsg, setSucessoMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    setSucessoMsg("");

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErro("Informe o e-mail corporativo.");
      return;
    }

    // Validação de formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErro("Formato de e-mail inválido.");
      return;
    }

    // Validação de domínio corporativo
    if (!trimmedEmail.endsWith("@mecanicao.com.br")) {
      setErro("O e-mail deve pertencer ao domínio corporativo (@mecanicao.com.br).");
      return;
    }

    setCarregando(true);

    try {
      const response = await requestPasswordResetApi(trimmedEmail);
      setSucessoMsg(response.message || "Se o e-mail existir em nossa base, você receberá as instruções em breve.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao processar solicitação.");
    } finally {
      setCarregando(false);
    }
  }

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
    <main className="flex min-h-screen h-screen items-center justify-center relative px-6" style={{ background: "#050B18" }}>
      {/* Detalhe luminoso no fundo */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(232, 132, 44, 0.05) 0%, transparent 70%)",
        }}
      />

      <div className="w-full max-w-[450px] relative z-10 bg-[rgba(12,20,38,0.45)] border border-[rgba(100,116,139,0.15)] rounded-2xl p-8 backdrop-blur-xl shadow-2xl animate-fade-in-up">
        {/* Cabeçalho */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="MECÂNI.CÃO — Logo"
            width={180}
            height={45}
            className="mb-6"
            priority
          />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-[3px] rounded-full" style={{ background: "#E8842C" }} />
            <span className="text-[11px] font-semibold tracking-[0.25em] uppercase" style={{ color: "#E8842C" }}>
              Recuperação
            </span>
          </div>
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#F1F5F9] text-center mb-2">
            Recuperar Senha
          </h1>
          <p className="text-sm text-[#64748B] text-center max-w-[340px]">
            Informe seu e-mail corporativo cadastrado para receber as instruções de redefinição de acesso.
          </p>
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm mb-6 animate-fade-in"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "#FCA5A5",
            }}
            role="alert"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            <span className="leading-snug">{erro}</span>
          </div>
        )}

        {/* Fluxo de Sucesso */}
        {sucessoMsg ? (
          <div className="space-y-6 text-center animate-fade-in">
            <div
              className="flex items-center gap-3 px-4 py-4 rounded-lg text-sm mb-6 text-left"
              style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                color: "#A7F3D0",
              }}
              role="alert"
            >
              <svg className="w-6 h-6 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span className="leading-relaxed font-medium">{sucessoMsg}</span>
            </div>

            <button
              onClick={() => router.push("/")}
              className="w-full py-3.5 rounded-lg text-[15px] font-bold text-white cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-300 ease-out"
              style={{
                background: "#E8842C",
                boxShadow: "0 4px 20px rgba(232, 132, 44, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#D4781F";
                e.currentTarget.style.boxShadow = "0 6px 28px rgba(232, 132, 44, 0.35)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#E8842C";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(232, 132, 44, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Voltar ao Login
            </button>
          </div>
        ) : (
          /* Formulário */
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-[11px] font-semibold tracking-[0.2em] uppercase mb-1.5 text-[#94A3B8]">
                E-mail Corporativo
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@mecanicao.com.br"
                disabled={carregando}
                className="w-full input-padding rounded-lg text-[15px] outline-none transition-all duration-200 placeholder:text-[#4A5568]"
                style={inputStyle}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
              />
            </div>

            {/* Botão de envio */}
            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3.5 rounded-lg text-[15px] font-bold text-white cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "#E8842C",
                boxShadow: "0 4px 20px rgba(232, 132, 44, 0.2)",
              }}
              onMouseEnter={(e) => {
                if (!carregando) {
                  e.currentTarget.style.background = "#D4781F";
                  e.currentTarget.style.boxShadow = "0 6px 28px rgba(232, 132, 44, 0.35)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!carregando) {
                  e.currentTarget.style.background = "#E8842C";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(232, 132, 44, 0.2)";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {carregando ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processando...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                  </svg>
                  <span>Solicitar Recuperação</span>
                </>
              )}
            </button>

            {/* Link voltar */}
            <div className="text-center mt-4">
              <a
                href="/"
                className="text-[13px] transition-colors duration-200 hover:underline"
                style={{ color: "#94A3B8" }}
                onMouseEnter={(e) => { (e.target as HTMLAnchorElement).style.color = "#E8842C"; }}
                onMouseLeave={(e) => { (e.target as HTMLAnchorElement).style.color = "#94A3B8"; }}
              >
                Voltar ao Login
              </a>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
