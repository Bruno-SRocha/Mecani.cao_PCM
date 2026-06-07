/**
 * Página: Redefinir Senha
 *
 * Efetua a redefinição de senha a partir do token recebido por e-mail.
 */

"use client";

import { Suspense, useState, type FormEvent, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { resetPasswordApi } from "@/lib/api/auth";

function RedefinirSenhaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    if (!token) {
      setErro("Token de redefinição não encontrado na URL.");
    }
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");

    if (!token) {
      setErro("Token inválido ou ausente.");
      return;
    }

    if (!novaSenha || !confirmarNovaSenha) {
      setErro("Preencha todos os campos.");
      return;
    }

    if (novaSenha !== confirmarNovaSenha) {
      setErro("A nova senha e a confirmação de senha não coincidem.");
      return;
    }

    /* Validação de complexidade */
    if (novaSenha.length < 12) {
      setErro("A nova senha deve ter no mínimo 12 caracteres.");
      return;
    }

    const regexNumero = /[0-9]/;
    const regexSimbolo = /[!@#$%^&*()_+~`|}{[\]:;?><,./-]/;
    if (!regexNumero.test(novaSenha) || !regexSimbolo.test(novaSenha)) {
      setErro("A nova senha deve conter pelo menos um número e um caractere especial (símbolo).");
      return;
    }

    setCarregando(true);

    try {
      await resetPasswordApi(token, novaSenha);
      setSucesso(true);
      setTimeout(() => {
        router.push("/");
      }, 3000);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao redefinir a senha.");
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
            Segurança
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#F1F5F9] text-center mb-2">
          Nova Senha
        </h1>
        <p className="text-sm text-[#64748B] text-center max-w-[340px]">
          Defina sua nova credencial de acesso de forma autônoma e segura.
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

      {/* Mensagem de Sucesso */}
      {sucesso && (
        <div
          className="flex items-center gap-3 px-4 py-4 rounded-lg text-sm mb-6 animate-fade-in"
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            color: "#A7F3D0",
          }}
          role="alert"
        >
          <svg className="w-5 h-5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span className="leading-relaxed font-medium">Sua senha foi redefinida com sucesso! Redirecionando para a tela de login...</span>
        </div>
      )}

      {!sucesso && token && (
        /* Formulário */
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Campo: Nova Senha */}
          <div>
            <label htmlFor="novaSenha" className="block text-[11px] font-semibold tracking-[0.2em] uppercase mb-1.5 text-[#94A3B8]">
              Nova Senha
            </label>
            <input
              id="novaSenha"
              type="password"
              value={novaSenha}
              onChange={(e) => setNovaSenha(e.target.value)}
              placeholder="Crie uma senha forte"
              disabled={carregando}
              className="w-full input-padding rounded-lg text-[15px] outline-none transition-all duration-200 placeholder:text-[#4A5568]"
              style={inputStyle}
              onFocus={inputFocusHandler}
              onBlur={inputBlurHandler}
            />
            <p className="text-[11px] text-[#64748B] mt-1.5 leading-normal">
              A nova senha deve possuir pelo menos <strong>12 caracteres</strong>, contendo <strong>números</strong> e <strong>símbolos</strong>.
            </p>
          </div>

          {/* Campo: Confirmar Nova Senha */}
          <div>
            <label htmlFor="confirmarNovaSenha" className="block text-[11px] font-semibold tracking-[0.2em] uppercase mb-1.5 text-[#94A3B8]">
              Confirmar Nova Senha
            </label>
            <input
              id="confirmarNovaSenha"
              type="password"
              value={confirmarNovaSenha}
              onChange={(e) => setConfirmarNovaSenha(e.target.value)}
              placeholder="Confirme a nova senha"
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
            className="w-full py-3.5 mt-2 rounded-lg text-[15px] font-bold text-white cursor-pointer flex items-center justify-center gap-2.5 transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span>Confirmar e Salvar</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Link voltar */}
      <div className="text-center mt-6">
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
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <main className="flex min-h-screen h-screen items-center justify-center relative px-6" style={{ background: "#050B18" }}>
      {/* Detalhe luminoso no fundo */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, rgba(232, 132, 44, 0.05) 0%, transparent 70%)",
        }}
      />
      <Suspense fallback={
        <div className="w-full max-w-[450px] relative z-10 bg-[rgba(12,20,38,0.45)] border border-[rgba(100,116,139,0.15)] rounded-2xl p-8 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center">
          <svg className="w-8 h-8 animate-spin text-[#E8842C]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      }>
        <RedefinirSenhaForm />
      </Suspense>
    </main>
  );
}
