/**
 * Página de Login — Tela Pública (rota raiz "/")
 *
 * Ponto de entrada do sistema Mecâni.cão PCM.
 * Layout full-screen dividido em duas áreas:
 *
 * LADO ESQUERDO (≈60%):
 *   - Fundo cinza-claro com textura de grid técnico (estilo blueprint)
 *   - Logo + selo PCM no canto superior esquerdo
 *   - Mascote centralizado com animação flutuante
 *   - Frase institucional na parte inferior
 *   - Visual minimalista e clean com bastante espaço negativo
 *
 * LADO DIREITO (≈40%):
 *   - Fundo azul-marinho muito escuro (#050B18)
 *   - Formulário de login centralizado verticalmente
 *   - Inputs com fundo azul-escuro translúcido
 *   - Botão laranja vibrante (CTA principal)
 *   - Rodapé discreto com versão do sistema
 *
 * Responsivo: em telas < 1024px, o lado esquerdo é ocultado
 * e o formulário ocupa 100% da largura.
 */

import Image from "next/image";
import LoginForm from "@/components/domain/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen h-screen overflow-hidden">

      {/* =================================================================
          LADO ESQUERDO — Área ilustrativa clara (≈60%)

          Fundo cinza-claro com textura de grid técnico (blueprint).
          Logo no canto superior esquerdo, mascote centralizado e
          frase institucional na parte inferior.
          ================================================================= */}
      <section
        className="hidden lg:flex lg:w-[60%] relative flex-col items-center justify-center"
        style={{
          background: "#F0F2F5",
          /* Textura de grid técnico (blueprint) — linhas finas sobre fundo claro */
          backgroundImage: `
            linear-gradient(rgba(26, 122, 138, 0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26, 122, 138, 0.06) 1px, transparent 1px),
            linear-gradient(rgba(26, 122, 138, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26, 122, 138, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px, 100px 100px, 20px 20px, 20px 20px",
        }}
      >

        {/* ---------------------------------------------------------------
            Logo + selo PCM — canto superior esquerdo
            --------------------------------------------------------------- */}
        <div className="absolute top-8 left-10 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="MECÂNI.CÃO — Logo"
            width={180}
            height={45}
            priority
          />
          {/* Selo PCM ao lado do logo */}
          <span
            className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase"
            style={{
              background: "rgba(232, 132, 44, 0.12)",
              color: "#E8842C",
              border: "1px solid rgba(232, 132, 44, 0.25)",
            }}
          >
            PCM
          </span>
        </div>

        {/* ---------------------------------------------------------------
            Mascote — centralizado com animação flutuante suave
            O mascote "Mecâni.cão" transmite confiança e profissionalismo
            no contexto industrial. A animação dá vida ao personagem.
            --------------------------------------------------------------- */}
        <div className="animate-float relative z-10">
          <Image
            src="/mascote.png"
            alt="Mascote Mecâni.cão — Cachorro técnico de manutenção industrial"
            width={380}
            height={470}
            className="drop-shadow-2xl"
            priority
          />
        </div>

        {/* ---------------------------------------------------------------
            Frase institucional — parte inferior
            --------------------------------------------------------------- */}
        <p
          className="absolute bottom-10 text-center px-8 max-w-lg text-base font-medium tracking-wide"
          style={{ color: "#4A5568" }}
        >
          &ldquo;Inteligência que fareja o problema antes que ele apareça.&rdquo;
        </p>

        {/* Marcas decorativas sutis nos cantos (estilo técnico/blueprint) */}
        {/* Cruz no canto superior direito */}
        <div className="absolute top-6 right-6 opacity-[0.15]">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="10" y1="0" x2="10" y2="20" stroke="#1A7A8A" strokeWidth="1" />
            <line x1="0" y1="10" x2="20" y2="10" stroke="#1A7A8A" strokeWidth="1" />
          </svg>
        </div>
        {/* Cruz no canto inferior esquerdo */}
        <div className="absolute bottom-6 left-6 opacity-[0.15]">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <line x1="10" y1="0" x2="10" y2="20" stroke="#1A7A8A" strokeWidth="1" />
            <line x1="0" y1="10" x2="20" y2="10" stroke="#1A7A8A" strokeWidth="1" />
          </svg>
        </div>
      </section>

      {/* =================================================================
          LADO DIREITO — Painel de login escuro (≈40%)

          Fundo azul-marinho muito escuro (#050B18).
          Formulário centralizado verticalmente com layout minimalista.
          Em telas menores (< lg), ocupa 100% da largura.
          ================================================================= */}
      <section
        className="flex flex-1 lg:w-[40%] flex-col items-center justify-center relative px-8 py-12"
        style={{ background: "#050B18" }}
      >
        {/* Brilho sutil no topo do painel (iluminação decorativa) */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, rgba(232, 132, 44, 0.04) 0%, transparent 70%)",
          }}
        />

        {/* Logo em mobile (visível apenas em telas < lg) */}
        <div className="lg:hidden mb-10">
          <Image
            src="/logo.png"
            alt="MECÂNI.CÃO — Logo"
            width={200}
            height={50}
            priority
          />
        </div>

        {/* Formulário de Login (componente client) */}
        <LoginForm />
      </section>
    </main>
  );
}
