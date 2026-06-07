/**
 * Service: Equipamento
 *
 * Contém as regras de negócio do módulo de gestão de equipamentos industriais.
 * Operações de CRUD completo com validações de domínio PCM.
 *
 * No contexto de PCM, o equipamento é o ativo principal monitorado.
 * Cada equipamento possui uma TAG industrial única, um status operacional
 * e está associado a componentes mecânicos rastreados individualmente.
 *
 * Regras de negócio implementadas:
 * - TAG industrial deve ser única no sistema
 * - Status operacional segue valores pré-definidos (OPERANDO, PARADO, MANUTENCAO)
 * - Remoção de equipamento cascateia para seus componentes
 */

import { EquipamentoRepository } from "../repositories/equipamento.repository";
import {
  Equipamento,
  StatusEquipamento,
} from "../entities/equipamento.entity";
import { AppDataSource } from "../config/database";
import { OrdemManutencao, StatusOM } from "../entities/ordemmanutencao.entity";
import { EquipamentoAuditoria } from "../entities/equipamento-auditoria.entity";
import { EquipamentoAuditoriaRepository } from "../repositories/equipamento-auditoria.repository";

/**
 * Interface de dados para criação de um novo equipamento.
 * Todos os campos obrigatórios mais opcionais para dados complementares.
 */
interface CreateEquipamentoData {
  nome: string;
  tag: string;
  tipo: string;
  fabricante: string;
  modelo: string;
  localizacao: string;
  numeroSerie?: string;
  status?: StatusEquipamento;
  dataInstalacao?: string;
  descricao?: string;
}

/**
 * Interface de dados para atualização parcial de um equipamento.
 * Todos os campos são opcionais (PATCH semântico).
 */
interface UpdateEquipamentoData {
  nome?: string;
  tag?: string;
  tipo?: string;
  fabricante?: string;
  modelo?: string;
  localizacao?: string;
  numeroSerie?: string;
  status?: StatusEquipamento;
  dataInstalacao?: string;
  descricao?: string;
}

/**
 * Interface de resultado para atualização em lote
 */
export interface BulkUpdateResult {
  sucesso: string[];
  falhas: {
    id: string;
    nome: string;
    tag: string;
    motivo: string;
  }[];
}

/**
 * Lista todos os equipamentos cadastrados no sistema.
 *
 * Retorna os equipamentos com seus componentes associados,
 * ordenados por data de criação (mais recentes primeiro).
 * Usado na tela de listagem/grid de equipamentos.
 *
 * @returns Array de equipamentos com componentes
 */
export async function listEquipamentosService(): Promise<Equipamento[]> {
  return EquipamentoRepository.findAllWithComponentCount();
}

/**
 * Busca um equipamento específico pelo ID.
 *
 * Retorna o equipamento com todos os seus componentes mecânicos
 * carregados, ideal para a tela de detalhes do ativo.
 *
 * @param id - UUID do equipamento
 * @returns O equipamento encontrado com componentes
 * @throws Error se o equipamento não for encontrado
 */
export async function getEquipamentoService(
  id: string
): Promise<Equipamento> {
  const equipamento = await EquipamentoRepository.findByIdWithComponents(id);

  if (!equipamento) {
    throw new Error("Equipamento não encontrado.");
  }

  return equipamento;
}

/**
 * Cria um novo equipamento no sistema.
 *
 * Valida se a TAG industrial já está em uso antes de criar,
 * pois cada equipamento na planta deve ter uma TAG única.
 *
 * @param data - Dados do novo equipamento
 * @returns O equipamento criado
 * @throws Error se a TAG já estiver em uso
 */
export async function createEquipamentoService(
  data: CreateEquipamentoData
): Promise<Equipamento> {
  /* Verifica se já existe um equipamento com esta TAG */
  const existente = await EquipamentoRepository.findByTag(data.tag);

  if (existente) {
    throw new Error("Já existe um equipamento com esta TAG.");
  }

  /* Cria a instância da entidade e salva no banco */
  const equipamento = EquipamentoRepository.create({
    nome: data.nome,
    tag: data.tag.toUpperCase(), // TAGs são sempre em maiúsculas
    tipo: data.tipo,
    fabricante: data.fabricante,
    modelo: data.modelo,
    localizacao: data.localizacao,
    numeroSerie: data.numeroSerie,
    status: data.status ?? StatusEquipamento.OPERANDO,
    dataInstalacao: data.dataInstalacao
      ? new Date(data.dataInstalacao)
      : undefined,
    descricao: data.descricao,
  });

  return EquipamentoRepository.save(equipamento);
}

/**
 * Atualiza um equipamento existente.
 *
 * Se a TAG for alterada, valida se a nova TAG não está em uso
 * por outro equipamento no sistema.
 *
 * Se o status for alterado, valida se o equipamento não possui OMs abertas.
 *
 * @param id - UUID do equipamento a atualizar
 * @param data - Campos a serem atualizados (parcial)
 * @param editorId - ID do usuário realizando a edição
 * @returns O equipamento atualizado
 * @throws Error se o equipamento não for encontrado, TAG duplicada ou possuir OM aberta
 */
export async function updateEquipamentoService(
  id: string,
  data: UpdateEquipamentoData,
  editorId?: string
): Promise<Equipamento> {
  /* Busca o equipamento existente */
  const equipamento = await EquipamentoRepository.findOne({ where: { id } });

  if (!equipamento) {
    throw new Error("Equipamento não encontrado.");
  }

  /* Se está alterando a TAG, verifica duplicidade */
  if (data.tag && data.tag !== equipamento.tag) {
    const tagEmUso = await EquipamentoRepository.findByTag(data.tag);
    if (tagEmUso) {
      throw new Error("Já existe um equipamento com esta TAG.");
    }
  }

  const statusAnterior = equipamento.status;
  const statusNovo = data.status;
  const statusAlterado = statusNovo !== undefined && statusNovo !== statusAnterior;

  /* Se está alterando o status, valida se há OM aberta somente se o novo status for OPERANDO */
  if (statusAlterado && statusNovo === StatusEquipamento.OPERANDO) {
    const openOM = await AppDataSource.getRepository(OrdemManutencao)
      .createQueryBuilder("om")
      .where("om.equipamentoId = :equipamentoId", { equipamentoId: id })
      .andWhere("om.status NOT IN (:...closedStatuses)", {
        closedStatuses: [StatusOM.CONCLUIDA, StatusOM.CANCELADA],
      })
      .getOne();

    if (openOM) {
      throw new Error(
        `Não é possível alterar o status do equipamento pois ele está vinculado a uma ordem de manutenção aberta (${openOM.codigo}).`
      );
    }
  }

  /* Aplica as atualizações nos campos fornecidos */
  if (data.nome !== undefined) equipamento.nome = data.nome;
  if (data.tag !== undefined) equipamento.tag = data.tag.toUpperCase();
  if (data.tipo !== undefined) equipamento.tipo = data.tipo;
  if (data.fabricante !== undefined) equipamento.fabricante = data.fabricante;
  if (data.modelo !== undefined) equipamento.modelo = data.modelo;
  if (data.localizacao !== undefined) equipamento.localizacao = data.localizacao;
  if (data.numeroSerie !== undefined) equipamento.numeroSerie = data.numeroSerie;
  if (data.status !== undefined) equipamento.status = data.status;
  if (data.dataInstalacao !== undefined) {
    equipamento.dataInstalacao = new Date(data.dataInstalacao);
  }
  if (data.descricao !== undefined) equipamento.descricao = data.descricao;

  const equipamentoSalvo = await EquipamentoRepository.save(equipamento);

  /* Se o status foi alterado e o editorId foi passado, registra auditoria */
  if (statusAlterado && editorId && statusNovo) {
    const auditoria = EquipamentoAuditoriaRepository.create({
      equipamentoId: id,
      usuarioId: editorId,
      statusAnterior,
      statusNovo,
      detalhes: "Alteração individual",
    });
    await EquipamentoAuditoriaRepository.save(auditoria);
  }

  return equipamentoSalvo;
}

/**
 * Altera o status de múltiplos equipamentos em lote.
 *
 * Valida a existência de ordens de manutenção abertas para cada item.
 *
 * @param ids - Array de IDs dos equipamentos
 * @param status - Novo status a ser aplicado
 * @param editorId - ID do usuário que solicitou a alteração
 * @returns Objeto contendo os IDs atualizados com sucesso e a lista de falhas com motivos
 */
export async function bulkUpdateEquipamentoStatusService(
  ids: string[],
  status: StatusEquipamento,
  editorId: string
): Promise<BulkUpdateResult> {
  const sucesso: string[] = [];
  const falhas: { id: string; nome: string; tag: string; motivo: string }[] = [];

  for (const id of ids) {
    try {
      const equipamento = await EquipamentoRepository.findOne({ where: { id } });
      if (!equipamento) {
        falhas.push({
          id,
          nome: "Desconhecido",
          tag: "N/A",
          motivo: "Equipamento não encontrado.",
        });
        continue;
      }

      // Validação de OM aberta (somente se o novo status for OPERANDO)
      if (status === StatusEquipamento.OPERANDO) {
        const openOM = await AppDataSource.getRepository(OrdemManutencao)
          .createQueryBuilder("om")
          .where("om.equipamentoId = :equipamentoId", { equipamentoId: id })
          .andWhere("om.status NOT IN (:...closedStatuses)", {
            closedStatuses: [StatusOM.CONCLUIDA, StatusOM.CANCELADA],
          })
          .getOne();

        if (openOM) {
          falhas.push({
            id,
            nome: equipamento.nome,
            tag: equipamento.tag,
            motivo: `Possui ordem de manutenção aberta (${openOM.codigo}).`,
          });
          continue;
        }
      }

      const statusAnterior = equipamento.status;
      const statusNovo = status;
      const statusAlterado = statusNovo !== statusAnterior;

      equipamento.status = statusNovo;
      await EquipamentoRepository.save(equipamento);

      if (statusAlterado) {
        const auditoria = EquipamentoAuditoriaRepository.create({
          equipamentoId: id,
          usuarioId: editorId,
          statusAnterior,
          statusNovo,
          detalhes: "Alteração em lote",
        });
        await EquipamentoAuditoriaRepository.save(auditoria);
      }

      sucesso.push(id);
    } catch (error) {
      falhas.push({
        id,
        nome: "Desconhecido",
        tag: "N/A",
        motivo: error instanceof Error ? error.message : "Erro desconhecido.",
      });
    }
  }

  return { sucesso, falhas };
}

/**
 * Retorna o histórico de auditoria de alterações de status de um equipamento.
 *
 * @param equipamentoId - ID do equipamento
 * @returns Array de registros de auditoria
 */
export async function listEquipamentoAuditoriaService(
  equipamentoId: string
): Promise<EquipamentoAuditoria[]> {
  return EquipamentoAuditoriaRepository.findByEquipamentoId(equipamentoId);
}

/**
 * Remove um equipamento do sistema.
 *
 * A remoção cascateia para todos os componentes associados
 * (configurado via onDelete: CASCADE na entidade Componente).
 *
 * ⚠️ Operação irreversível — deve ser restrita a Admin/Gestor.
 *
 * @param id - UUID do equipamento a remover
 * @throws Error se o equipamento não for encontrado
 */
export async function deleteEquipamentoService(id: string): Promise<void> {
  const equipamento = await EquipamentoRepository.findOne({ where: { id } });

  if (!equipamento) {
    throw new Error("Equipamento não encontrado.");
  }

  await EquipamentoRepository.remove(equipamento);
}
