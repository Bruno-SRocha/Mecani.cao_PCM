/**
 * Seed: Ordens de Manutenção (Mock Data)
 *
 * Popula o banco com OMs realistas para demonstração do módulo.
 * Cobre todos os status, tipos e prioridades possíveis para
 * exercitar visualmente os badges e filtros da interface.
 *
 * Pré-requisitos:
 *   - Usuários "gestor" e "tecnico" devem existir (seed de usuários/reportes)
 *   - Equipamentos devem existir (seed de equipamentos)
 */

import { AppDataSource } from "./database";
import { Equipamento } from "../entities/equipamento.entity";
import { User, NivelUsuario } from "../entities/user.entity";
import {
  OrdemManutencao,
  TipoManutencao,
  PrioridadeOM,
  StatusOM,
} from "../entities/ordemmanutencao.entity";

export async function seedOrdensManutencao(): Promise<void> {
  const equipamentoRepo = AppDataSource.getRepository(Equipamento);
  const userRepo       = AppDataSource.getRepository(User);
  const omRepo         = AppDataSource.getRepository(OrdemManutencao);

  /* ------------------------------------------------------------------
     Verifica pré-requisitos
     ------------------------------------------------------------------ */

  const equipamentos = await equipamentoRepo.find();
  if (equipamentos.length === 0) {
    console.error("❌ Nenhum equipamento encontrado. Seed de OMs abortado.");
    return;
  }

  // Localiza o gestor
  let gestor = await userRepo.findOne({ where: { nomeUsuario: "gestor" } });
  if (!gestor) {
    gestor = await userRepo.findOne({ where: { nivel: NivelUsuario.GESTOR } });
  }
  if (!gestor) {
    gestor = await userRepo.findOne({ where: { nivel: NivelUsuario.ADMIN } });
  }
  if (!gestor) {
    console.error("❌ Nenhum usuário Gestor/Admin encontrado. Seed de OMs abortado.");
    return;
  }

  // Localiza técnicos disponíveis
  const tecnicos = await userRepo.find({ where: { nivel: NivelUsuario.TECNICO } });
  if (tecnicos.length === 0) {
    console.error("❌ Nenhum técnico encontrado. Seed de OMs abortado.");
    return;
  }

  /* ------------------------------------------------------------------
     Verifica idempotência — não duplica se já existirem OMs
     ------------------------------------------------------------------ */
  const omCount = await omRepo.count();
  if (omCount > 0) {
    console.log(`ℹ️  ${omCount} OM(s) já existem no banco. Seed de OMs ignorado.`);
    return;
  }

  /* ------------------------------------------------------------------
     Helper para pegar equipamento por TAG (com fallback)
     ------------------------------------------------------------------ */
  const eq = (tag: string) =>
    equipamentos.find(e => e.tag === tag) ?? equipamentos[0];

  const tec = (idx: number) => tecnicos[idx % tecnicos.length];

  /* ------------------------------------------------------------------
     Dados mock das Ordens de Manutenção
     Cobre: todos os tipos, todas as prioridades, todos os status
     ------------------------------------------------------------------ */
  const omsMock: Partial<OrdemManutencao>[] = [
    // 1 — CRITICA · Corretiva Emergencial · EM_EXECUCAO
    {
      codigo: "OM-2026-001",
      descricao:
        "Vazamento severo de óleo no selo mecânico principal da bomba. Risco de contaminação do produto e dano irreparável ao equipamento. Intervenção imediata necessária.",
      tipo: TipoManutencao.CORRETIVA_EMERGENCIAL,
      prioridade: PrioridadeOM.CRITICA,
      status: StatusOM.EM_EXECUCAO,
      dataInicioPrevisto: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h atrás
      tempoEstimado: 6,
      materiaisNecessarios: [
        "Selo Mecânico John Crane T1",
        "Junta de Vedação PTFE",
        "Óleo de Selagem ISO VG 32",
        "Kit reparo de emergência",
      ],
      observacoes: "Equipamento isolado. Não religar até conclusão da troca. Coordenar com produção o desvio de fluxo.",
      equipamento: eq("BC-001"),
      solicitante: gestor,
      tecnicos: [tec(0), tec(1)].filter((t, i, arr) => arr.indexOf(t) === i),
    },

    // 2 — ALTA · Preventiva · ABERTA
    {
      codigo: "OM-2026-002",
      descricao:
        "Revisão preventiva semestral programada do motor elétrico WEG. Inclui medição de vibração, termografia, limpeza de carcaça e inspeção dos rolamentos conforme plano de manutenção.",
      tipo: TipoManutencao.PREVENTIVA,
      prioridade: PrioridadeOM.ALTA,
      status: StatusOM.ABERTA,
      dataInicioPrevisto: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // em 2 dias
      tempoEstimado: 4,
      materiaisNecessarios: [
        "Graxa Shell Gadus S2 V220",
        "Rolamento FAG 6208",
        "Pano industrial",
        "Termômetro de contato",
      ],
      observacoes: "Parar o motor somente após aprovação da produção. Janela de manutenção: sábado 06h–10h.",
      equipamento: eq("ME-003"),
      solicitante: gestor,
      tecnicos: [tec(0)],
    },

    // 3 — ALTA · Corretiva Programada · AGUARDANDO_INICIO
    {
      codigo: "OM-2026-003",
      descricao:
        "Troca da correia de transmissão Gates 3VX do compressor Atlas Copco. Correia apresentando desgaste excessivo nas bordas e risco iminente de ruptura. Substituição agendada para a próxima parada de manutenção.",
      tipo: TipoManutencao.CORRETIVA_PROGRAMADA,
      prioridade: PrioridadeOM.ALTA,
      status: StatusOM.AGUARDANDO_INICIO,
      dataInicioPrevisto: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // amanhã
      tempoEstimado: 3,
      materiaisNecessarios: [
        "Correia Gates 3VX 900",
        "Correia Gates 3VX 900 (reserva)",
        "Tensômetro de correia",
        "Chave de fenda torque 15Nm",
      ],
      observacoes: "Compressor CP-012 já está em parada programada. Aproveitar a janela para também trocar o filtro de óleo.",
      equipamento: eq("CP-012"),
      solicitante: gestor,
      tecnicos: [tec(1)],
    },

    // 4 — MEDIA · Preditiva · ABERTA
    {
      codigo: "OM-2026-004",
      descricao:
        "Análise preditiva de vibração no ventilador axial Howden — sensor de vibração eixo Y registrou amplitude de 7.2 mm/s (limite recomendado: 4.5 mm/s). Realizar análise espectral para identificar origem do desbalanceamento.",
      tipo: TipoManutencao.PREDITIVA,
      prioridade: PrioridadeOM.MEDIA,
      status: StatusOM.ABERTA,
      dataInicioPrevisto: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // em 3 dias
      tempoEstimado: 2,
      materialsNecessarios: [
        "Analisador de vibração SKF CMAS 100",
        "Massa de balanceamento (kit)",
        "EPI completo para trabalho em altura",
      ],
      observacoes: "Equipamento pode continuar operando durante a análise preditiva. Apenas para manutenção corretiva se necessário.",
      equipamento: eq("VA-007"),
      solicitante: gestor,
      tecnicos: [tec(0)],
    },

    // 5 — MEDIA · Preventiva · PAUSADA
    {
      codigo: "OM-2026-005",
      descricao:
        "Inspeção e lubrificação dos rolamentos do redutor Flender SIG. Intervalo de lubrificação vencido há 200h. Coletar amostra de óleo para análise físico-química e verificar folgas dos dentes das engrenagens.",
      tipo: TipoManutencao.PREVENTIVA,
      prioridade: PrioridadeOM.MEDIA,
      status: StatusOM.PAUSADA,
      dataInicioPrevisto: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // ontem
      tempoEstimado: 8,
      materiaisNecessarios: [
        "Óleo Mobil SHC Gear 320",
        "Kit coleta de amostra de óleo",
        "Graxa Shell Gadus S3 T100",
        "Bomba manual de lubrificação",
      ],
      observacoes: "Pausada aguardando chegada do óleo lubrificante no almoxarifado. Prazo de entrega: 24h.",
      equipamento: eq("RD-005"),
      solicitante: gestor,
      tecnicos: [tec(1)],
    },

    // 6 — BAIXA · Preventiva · CONCLUIDA
    {
      codigo: "OM-2026-006",
      descricao:
        "Limpeza geral e inspeção visual da bomba centrífuga KSB após parada de produção. Verificar integridade da carcaça, impulsores e bocais de sucção e recalque. Pintura anticorrosiva nas áreas com ferrugem superficial.",
      tipo: TipoManutencao.PREVENTIVA,
      prioridade: PrioridadeOM.BAIXA,
      status: StatusOM.CONCLUIDA,
      dataInicioPrevisto: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás
      tempoEstimado: 5,
      materiaisNecessarios: [
        "Primer anticorrosivo Rust-Oleum",
        "Tinta de acabamento industrial cinza",
        "Pano industrial",
        "Escova de aço",
      ],
      observacoes: "Serviço concluído em 3h. Nenhuma anomalia encontrada nos internos. Próxima inspeção em 6 meses.",
      equipamento: eq("BC-001"),
      solicitante: gestor,
      tecnicos: [tec(0)],
    },

    // 7 — CRITICA · Corretiva Emergencial · ABERTA
    {
      codigo: "OM-2026-007",
      descricao:
        "Redutor Flender SIG apresentou travamento súbito durante operação do moinho de bolas. Ruído metálico intenso antes da parada indicando possível fratura de engrenagem ou bloqueio por corpo estranho. Inspeção interna urgente.",
      tipo: TipoManutencao.CORRETIVA_EMERGENCIAL,
      prioridade: PrioridadeOM.CRITICA,
      status: StatusOM.ABERTA,
      dataInicioPrevisto: new Date(), // agora
      tempoEstimado: 24,
      materiaisNecessarios: [
        "Engrenagem Helicoidal Z1 (sobressalente)",
        "Rolamento SKF 24060",
        "Óleo Mobil SHC Gear 320 (200L)",
        "Endoscópio industrial",
        "Equipamento de içamento 5 ton",
      ],
      observacoes: "CRÍTICO: Produção do moinho de bolas completamente parada. Estimativa de impacto: R$ 45.000/h. Alocar equipe completa.",
      equipamento: eq("RD-005"),
      solicitante: gestor,
      tecnicos: [tec(0), tec(1)].filter((t, i, arr) => arr.indexOf(t) === i),
    },

    // 8 — BAIXA · Preditiva · CONCLUIDA
    {
      codigo: "OM-2026-008",
      descricao:
        "Termografia periódica trimestral nos painéis elétricos e conexões do motor elétrico WEG. Identificar pontos quentes por conexões frouxas ou sobrecarga de circuitos antes que causem falhas.",
      tipo: TipoManutencao.PREDITIVA,
      prioridade: PrioridadeOM.BAIXA,
      status: StatusOM.CONCLUIDA,
      dataInicioPrevisto: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 dias atrás
      tempoEstimado: 1.5,
      materiaisNecessarios: [
        "Câmera termográfica FLIR T540",
        "EPI elétrico NR-10",
        "Formulário de laudo termográfico",
      ],
      observacoes: "Inspeção concluída sem anomalias. Relatório termográfico arquivado no sistema. Temperatura máxima registrada: 62°C (normal).",
      equipamento: eq("ME-003"),
      solicitante: gestor,
      tecnicos: [tec(1)],
    },

    // 9 — ALTA · Corretiva Programada · ABERTA
    {
      codigo: "OM-2026-009",
      descricao:
        "Substituição do separador de óleo Donaldson P-55 do compressor. Indicador de saturação na zona vermelha. Queda de eficiência de 12% identificada na última análise de desempenho. Elemento filtrante com 3.500h (limite: 4.000h).",
      tipo: TipoManutencao.CORRETIVA_PROGRAMADA,
      prioridade: PrioridadeOM.ALTA,
      status: StatusOM.ABERTA,
      dataInicioPrevisto: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // em 4 dias
      tempoEstimado: 4,
      materiaisNecessarios: [
        "Separador Donaldson P-55 (original)",
        "Junta de vedação 4\" NBR",
        "Chave de gancho 250mm",
        "Óleo Atlas Copco Roto-Inject Fluid (5L)",
      ],
      observacoes: "Peça em estoque no almoxarifado, prateleira A-14. Verificar o prazo de validade antes da aplicação.",
      equipamento: eq("CP-012"),
      solicitante: gestor,
      tecnicos: [tec(0)],
    },

    // 10 — MEDIA · Preventiva · CANCELADA
    {
      codigo: "OM-2026-010",
      descricao:
        "Balanceamento dinâmico das pás do ventilador axial Howden. Serviço preventivo anual para compensar desgaste diferencial das pás e manter vibração dentro dos limites ISO 10816.",
      tipo: TipoManutencao.PREVENTIVA,
      prioridade: PrioridadeOM.MEDIA,
      status: StatusOM.CANCELADA,
      dataInicioPrevisto: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
      tempoEstimado: 12,
      materiaisNecessarios: [
        "Massa de balanceamento (kit completo)",
        "Analisador de vibração portátil",
        "Guindaste para acesso ao nível 3",
      ],
      observacoes: "CANCELADA: Ventilador VA-007 não pode ser parado devido à crise de produção. Reagendar para a próxima janela de manutenção em 30 dias.",
      equipamento: eq("VA-007"),
      solicitante: gestor,
      tecnicos: [tec(0)],
    },
  ];

  /* ------------------------------------------------------------------
     Persiste as OMs no banco
     ------------------------------------------------------------------ */
  console.log(`📋 Inserindo ${omsMock.length} Ordens de Manutenção mock...`);

  for (const omData of omsMock) {
    const om = omRepo.create(omData as OrdemManutencao);
    await omRepo.save(om);
  }

  console.log(`✅ ${omsMock.length} OMs de demonstração criadas com sucesso.`);
}
