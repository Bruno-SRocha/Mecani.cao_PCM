# Skill: Frontend Design e Estética (Mecâni.cão PCM)

Esta skill orienta a criação de interfaces frontend distintas e de nível de produção que evitem a estética genérica de "conteúdo gerado por IA" (AI slop). O objetivo é implementar código real e funcional (focado na nossa stack Next.js 14+, React 19 e Tailwind CSS v4) com excepcional atenção a detalhes estéticos e escolhas criativas.

O usuário fornecerá os requisitos do frontend: um componente, página, aplicação ou interface a ser construída. Eles podem incluir contexto sobre o propósito, público-alvo (gestores, técnicos industriais) ou restrições técnicas.

## Design Thinking

Antes de programar, entenda o contexto e comprometa-se com uma direção estética OUSADA e bem definida:
- **Propósito**: Qual problema essa interface resolve? Quem a utiliza no chão de fábrica ou escritório?
- **Tom**: Escolha um extremo (seja intencional): minimalismo utilitário, brutalismo industrial, luxo/refinado (para gestores), limpo e focado, futurista corporativo. Use essas ideias como inspiração, mas projete algo que seja fiel à direção estética da plataforma "Mecâni.cão PCM".
- **Restrições**: Requisitos técnicos (Next.js, Tailwind CSS, performance, acessibilidade, responsividade para tablets/mobile no chão de fábrica).
- **Diferenciação**: O que torna esta interface INESQUECÍVEL? Qual é o detalhe que o usuário vai lembrar?

**CRÍTICO**: Escolha uma direção conceitual clara e execute-a com precisão. Tanto o maximalismo ousado quanto o minimalismo refinado funcionam — a chave é a intencionalidade, não a intensidade desordenada.

Em seguida, implemente o código funcional (React/Next.js e Tailwind CSS) que seja:
- De nível de produção e funcional.
- Visualmente marcante e memorável.
- Coeso com um ponto de vista estético claro.
- Meticulosamente refinado em cada detalhe.

## Diretrizes de Estética Frontend

Concentre-se em:
- **Tipografia**: Escolha fontes que sejam bonitas, únicas e interessantes (recorrendo ao `next/font`). Evite usar fontes genéricas sempre que possível (a não ser como fallback ou quando pedido); opte por escolhas distintas que elevem a estética da plataforma, com personalidade. Combine uma fonte de exibição (display) distinta com uma fonte de corpo refinada e altamente legível para relatórios e dados.
- **Cor e Tema**: Comprometa-se com uma estética coesa. Utilize variáveis de CSS e os utilitários do Tailwind para consistência. Cores dominantes com destaques nítidos superam paletas tímidas e distribuídas de forma uniforme.
- **Movimento e Animações**: Use animações para efeitos e micro-interações. Priorize soluções apenas com CSS (classes do Tailwind como `transition`, `animate`, `hover`) ou utilize bibliotecas como Framer Motion (se estiver disponível no projeto) em momentos cruciais. Foco em alto impacto: um carregamento de página bem orquestrado com revelações graduais (animation-delay) cria muito mais encanto do que micro-interações espalhadas sem propósito. Use estados ativados por scroll e hovers que surpreendam o usuário.
- **Composição Espacial**: Explore layouts inesperados. Assimetria, sobreposições sutis, fluxo diagonal ou elementos que quebrem um grid restrito de forma controlada. Use espaço negativo (white space) de forma generosa OU uma densidade utilitária muito bem pensada e alinhada.
- **Fundos e Detalhes Visuais**: Crie atmosfera e profundidade em vez de apenas padronizar cores sólidas. Adicione efeitos contextuais e texturas que combinem com a estética industrial e tecnológica. Aplique formas criativas como gradientes bem elaborados, texturas de ruído (noise), padrões geométricos, transparências em camadas (glassmorphism), sombras dramáticas, bordas decorativas ou cursores customizados.

**NUNCA** use estética gerada por IA genérica: esquemas de cores clichês (particularmente gradientes roxos/rosas em fundos brancos sem contexto), layouts e padrões de componentes altamente previsíveis, uso excessivo das mesmas fontes genéricas e designs em formato "cookie-cutter" (engessados) que não possuem caráter contextual para o SaaS.

Interprete de forma criativa e faça escolhas inesperadas que pareçam genuinamente projetadas para o contexto específico da funcionalidade. Nenhum design deve ser igual a outro sem justificativa. Varie abordagens visuais. NUNCA convirja para escolhas comuns em todas as execuções (como usar sempre a fonte Space Grotesk ou Inter por padrão se há outras opções melhores).

**IMPORTANTE**: Ajuste a complexidade da implementação à visão estética. Designs complexos precisam de código elaborado com animações e efeitos extensos. Designs minimalistas ou refinados precisam de moderação, precisão e atenção extrema ao espaçamento, tipografia e detalhes sutis. A elegância sempre vem de executar a visão escolhida com altíssima qualidade técnica.

**REGRA ESTRITA E IMUTÁVEL**: NUNCA modifique o design, a estrutura ou a estética da página de Login. O design da página de Login já está finalizado e deve ser rigorosamente preservado. Você não tem permissão para alterá-la, a menos que o usuário solicite e autorize explicitamente de forma expressa.

**Lembre-se**: Um excelente Assistente IA/Agente é capaz de um trabalho criativo extraordinário. Não se contenha, mostre o que realmente pode ser criado ao pensar fora da caixa e comprometer-se totalmente com uma visão estética distinta e profissional, elevando o nível de produto do SaaS "Mecâni.cão PCM".
