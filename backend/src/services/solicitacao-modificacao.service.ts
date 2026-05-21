import { SolicitacaoModificacaoRepository } from "../repositories/solicitacao-modificacao.repository";
import { ComponenteRepository } from "../repositories/componente.repository";
import { EquipamentoRepository } from "../repositories/equipamento.repository";
import {
  SolicitacaoModificacao,
  TipoModificacao,
  StatusModificacao,
} from "../entities/solicitacao-modificacao.entity";

export interface CreateModificacaoData {
  tipoModificacao: TipoModificacao;
  justificativa: string;
  componenteSaidaId?: string;
  novoComponenteNome?: string;
  novoComponenteTipo?: string;
  novoComponenteVidaUtilNominal?: number;
}

export interface FinalizarModificacaoData {
  parecerEngenharia?: string;
}

/**
 * Cria uma nova solicitação de modificação de equipamento.
 */
export async function createModificacaoService(
  equipamentoId: string,
  data: CreateModificacaoData
): Promise<SolicitacaoModificacao> {
  const equipamento = await EquipamentoRepository.findOne({
    where: { id: equipamentoId },
  });

  if (!equipamento) {
    throw new Error("Equipamento não encontrado.");
  }

  if (!data.justificativa?.trim()) {
    throw new Error("A justificativa técnica da modificação é obrigatória.");
  }

  if (!Object.values(TipoModificacao).includes(data.tipoModificacao)) {
    throw new Error("Tipo de modificação inválido.");
  }

  // Validações específicas por tipo de modificação
  if (data.tipoModificacao === TipoModificacao.SUBSTITUICAO_TECNOLOGIA || data.tipoModificacao === TipoModificacao.REMOCAO) {
    if (!data.componenteSaidaId) {
      throw new Error("Componente de saída é obrigatório para substituição ou remoção.");
    }
    const componenteSaida = await ComponenteRepository.findByIdAndEquipamento(
      data.componenteSaidaId,
      equipamentoId
    );
    if (!componenteSaida) {
      throw new Error("Componente de saída não encontrado neste equipamento.");
    }
  }

  if (data.tipoModificacao === TipoModificacao.ADICAO || data.tipoModificacao === TipoModificacao.SUBSTITUICAO_TECNOLOGIA) {
    if (!data.novoComponenteNome?.trim()) {
      throw new Error("Nome do novo componente é obrigatório.");
    }
    if (!data.novoComponenteTipo?.trim()) {
      throw new Error("Tipo do novo componente é obrigatório.");
    }
    if (!data.novoComponenteVidaUtilNominal || data.novoComponenteVidaUtilNominal <= 0) {
      throw new Error("Vida útil nominal do novo componente deve ser maior que zero.");
    }
  }

  const solicitacao = SolicitacaoModificacaoRepository.create({
    equipamentoId,
    tipoModificacao: data.tipoModificacao,
    justificativa: data.justificativa.trim(),
    componenteSaidaId: data.componenteSaidaId || undefined,
    novoComponenteNome: data.novoComponenteNome?.trim() || null,
    novoComponenteTipo: data.novoComponenteTipo?.trim() || null,
    novoComponenteVidaUtilNominal: data.novoComponenteVidaUtilNominal || null,
    status: StatusModificacao.PENDENTE,
  });

  return SolicitacaoModificacaoRepository.save(solicitacao);
}

/**
 * Lista as solicitações de um equipamento.
 */
export async function listModificacoesByEquipamentoService(
  equipamentoId: string
): Promise<SolicitacaoModificacao[]> {
  const equipamento = await EquipamentoRepository.findOne({
    where: { id: equipamentoId },
  });
  if (!equipamento) {
    throw new Error("Equipamento não encontrado.");
  }
  return SolicitacaoModificacaoRepository.findByEquipamento(equipamentoId);
}

/**
 * Lista todas as solicitações do sistema.
 */
export async function listAllModificacoesService(): Promise<SolicitacaoModificacao[]> {
  return SolicitacaoModificacaoRepository.findAll();
}

/**
 * Obtém uma solicitação pelo ID.
 */
export async function getModificacaoService(id: string): Promise<SolicitacaoModificacao> {
  const solicitacao = await SolicitacaoModificacaoRepository.findOne({
    where: { id },
  });
  if (!solicitacao) {
    throw new Error("Solicitação de modificação não encontrada.");
  }
  return solicitacao;
}

/**
 * Coloca a solicitação em progresso (Em Implementação).
 */
export async function iniciarImplementacaoModificacaoService(
  id: string
): Promise<SolicitacaoModificacao> {
  const solicitacao = await SolicitacaoModificacaoRepository.findOne({
    where: { id },
  });

  if (!solicitacao) {
    throw new Error("Solicitação de modificação não encontrada.");
  }

  if (solicitacao.status !== StatusModificacao.PENDENTE) {
    throw new Error("Apenas solicitações Pendentes podem ser iniciadas.");
  }

  solicitacao.status = StatusModificacao.EM_IMPLEMENTACAO;
  return SolicitacaoModificacaoRepository.save(solicitacao);
}

/**
 * Finaliza/Aprova a solicitação e atualiza a BOM do equipamento.
 */
export async function finalizarModificacaoService(
  id: string,
  data: FinalizarModificacaoData
): Promise<SolicitacaoModificacao> {
  const solicitacao = await SolicitacaoModificacaoRepository.findOne({
    where: { id },
  });

  if (!solicitacao) {
    throw new Error("Solicitação de modificação não encontrada.");
  }

  if (solicitacao.status === StatusModificacao.CONCLUIDO) {
    throw new Error("Esta solicitação já foi concluída.");
  }

  let novoComponenteId: string | null = null;

  // Atualização automática da BOM (Bill of Materials) do equipamento
  if (solicitacao.tipoModificacao === TipoModificacao.ADICAO) {
    // Cria novo componente
    const novoComponente = ComponenteRepository.create({
      nome: solicitacao.novoComponenteNome!,
      tipo: solicitacao.novoComponenteTipo!,
      vidaUtilNominal: solicitacao.novoComponenteVidaUtilNominal!,
      horasOperacionais: 0,
      equipamentoId: solicitacao.equipamentoId,
      modificado: true, // Tag como modificado!
    });
    const saved = await ComponenteRepository.save(novoComponente);
    novoComponenteId = saved.id;
  } else if (solicitacao.tipoModificacao === TipoModificacao.SUBSTITUICAO_TECNOLOGIA) {
    // Cria novo componente
    const novoComponente = ComponenteRepository.create({
      nome: solicitacao.novoComponenteNome!,
      tipo: solicitacao.novoComponenteTipo!,
      vidaUtilNominal: solicitacao.novoComponenteVidaUtilNominal!,
      horasOperacionais: 0,
      equipamentoId: solicitacao.equipamentoId,
      modificado: true, // Tag como modificado!
    });
    const saved = await ComponenteRepository.save(novoComponente);
    novoComponenteId = saved.id;

    // Remove componente de saída do equipamento
    if (solicitacao.componenteSaidaId) {
      const compSaida = await ComponenteRepository.findOne({
        where: { id: solicitacao.componenteSaidaId },
      });
      if (compSaida) {
        const saId = solicitacao.componenteSaidaId;
        
        // Clear references both in-memory and in db
        solicitacao.componenteSaida = null;
        solicitacao.componenteSaidaId = null as any;
        await SolicitacaoModificacaoRepository.save(solicitacao);

        await SolicitacaoModificacaoRepository.createQueryBuilder()
          .update(SolicitacaoModificacao)
          .set({ componenteSaidaId: null })
          .where("componenteSaidaId = :saId", { saId })
          .execute();

        await ComponenteRepository.remove(compSaida);
      }
    }
  } else if (solicitacao.tipoModificacao === TipoModificacao.REMOCAO) {
    // Remove componente de saída
    if (solicitacao.componenteSaidaId) {
      const compSaida = await ComponenteRepository.findOne({
        where: { id: solicitacao.componenteSaidaId },
      });
      if (compSaida) {
        const saId = solicitacao.componenteSaidaId;
        
        // Clear references both in-memory and in db
        solicitacao.componenteSaida = null;
        solicitacao.componenteSaidaId = null as any;
        await SolicitacaoModificacaoRepository.save(solicitacao);

        await SolicitacaoModificacaoRepository.createQueryBuilder()
          .update(SolicitacaoModificacao)
          .set({ componenteSaidaId: null })
          .where("componenteSaidaId = :saId", { saId })
          .execute();

        await ComponenteRepository.remove(compSaida);
      }
    }
  }

  solicitacao.status = StatusModificacao.CONCLUIDO;
  if (novoComponenteId) {
    solicitacao.componenteEntradaId = novoComponenteId;
  }
  solicitacao.parecerEngenharia = data.parecerEngenharia?.trim() || null;
  solicitacao.dataImplementacao = new Date();

  return SolicitacaoModificacaoRepository.save(solicitacao);
}
