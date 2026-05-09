/**
 * Service: Componente
 *
 * Contém as regras de negócio do módulo de gestão de componentes mecânicos.
 * CRUD completo com validações específicas do domínio PCM:
 *
 * - Um componente só pode ser criado/editado vinculado a um equipamento existente
 * - Vida útil nominal (vidaUtilNominal) é obrigatória e deve ser > 0
 * - Horas operacionais não podem exceder a vida útil nominal (limitado a 100%)
 * - O cálculo de desgaste é: (horasOperacionais / vidaUtilNominal) × 100
 *
 * Regra de alerta PCM:
 * - desgaste ≥ 85% → Crítico (alerta preventivo)
 * - desgaste ≥ 60% → Atenção
 * - desgaste < 60%  → Normal
 */

import { EquipamentoRepository } from "../repositories/equipamento.repository";
import { ComponenteRepository } from "../repositories/componente.repository";
import { Componente } from "../entities/componente.entity";

/**
 * Interface de dados para criação de um novo componente.
 */
interface CreateComponenteData {
  nome: string;
  tipo: string;
  vidaUtilNominal: number;
  horasOperacionais?: number;
}

/**
 * Interface de dados para atualização parcial de um componente.
 */
interface UpdateComponenteData {
  nome?: string;
  tipo?: string;
  vidaUtilNominal?: number;
  horasOperacionais?: number;
}

/**
 * Interface de retorno enriquecida com o percentual de desgaste calculado.
 * O campo `desgastePct` é calculado em tempo de execução e não é persistido no banco.
 */
export interface ComponenteComDesgaste extends Componente {
  desgastePct: number;
}

/**
 * Calcula o percentual de desgaste de um componente.
 *
 * @param horasOperacionais - Horas acumuladas desde a última troca
 * @param vidaUtilNominal - Vida útil nominal definida pelo fabricante
 * @returns Percentual de 0 a 100 (limitado ao máximo de 100%)
 */
function calcularDesgaste(
  horasOperacionais: number,
  vidaUtilNominal: number
): number {
  if (vidaUtilNominal <= 0) return 0;
  return Math.min((horasOperacionais / vidaUtilNominal) * 100, 100);
}

/**
 * Enriquece um componente com o campo `desgastePct` calculado.
 */
function enriquecerComponente(comp: Componente): ComponenteComDesgaste {
  return {
    ...comp,
    desgastePct: calcularDesgaste(comp.horasOperacionais, comp.vidaUtilNominal),
  };
}

/**
 * Lista todos os componentes de um equipamento, ordenados por desgaste decrescente.
 *
 * Cada componente retornado inclui o campo `desgastePct` calculado,
 * pronto para exibição na interface.
 *
 * @param equipamentoId - UUID do equipamento pai
 * @returns Array de componentes com desgaste percentual
 * @throws Error se o equipamento não existir
 */
export async function listComponentesService(
  equipamentoId: string
): Promise<ComponenteComDesgaste[]> {
  const equipamento = await EquipamentoRepository.findOne({
    where: { id: equipamentoId },
  });

  if (!equipamento) {
    throw new Error("Equipamento não encontrado.");
  }

  const componentes = await ComponenteRepository.findByEquipamento(
    equipamentoId
  );

  return componentes
    .map(enriquecerComponente)
    .sort((a, b) => b.desgastePct - a.desgastePct);
}

/**
 * Busca um componente específico pelo ID.
 *
 * @param equipamentoId - UUID do equipamento pai
 * @param id - UUID do componente
 * @returns O componente com desgaste percentual
 * @throws Error se o equipamento ou componente não existirem
 */
export async function getComponenteService(
  equipamentoId: string,
  id: string
): Promise<ComponenteComDesgaste> {
  const equipamento = await EquipamentoRepository.findOne({
    where: { id: equipamentoId },
  });

  if (!equipamento) {
    throw new Error("Equipamento não encontrado.");
  }

  const componente = await ComponenteRepository.findByIdAndEquipamento(
    id,
    equipamentoId
  );

  if (!componente) {
    throw new Error("Componente não encontrado.");
  }

  return enriquecerComponente(componente);
}

/**
 * Cria um novo componente vinculado a um equipamento.
 *
 * Validações realizadas:
 * - O equipamento pai deve existir
 * - vidaUtilNominal deve ser um número positivo
 *
 * @param equipamentoId - UUID do equipamento pai
 * @param data - Dados do novo componente
 * @returns O componente criado com desgaste percentual
 * @throws Error em caso de validação falha ou equipamento inexistente
 */
export async function createComponenteService(
  equipamentoId: string,
  data: CreateComponenteData
): Promise<ComponenteComDesgaste> {
  /* Valida existência do equipamento pai */
  const equipamento = await EquipamentoRepository.findOne({
    where: { id: equipamentoId },
  });

  if (!equipamento) {
    throw new Error("Equipamento não encontrado.");
  }

  /* Valida vida útil nominal: deve ser um número positivo */
  if (!data.vidaUtilNominal || data.vidaUtilNominal <= 0) {
    throw new Error("Vida útil nominal deve ser maior que zero.");
  }

  /* Valida horas operacionais: não pode ser negativa */
  const horasOperacionais = data.horasOperacionais ?? 0;
  if (horasOperacionais < 0) {
    throw new Error("Horas operacionais não podem ser negativas.");
  }

  const componente = ComponenteRepository.create({
    nome: data.nome,
    tipo: data.tipo,
    vidaUtilNominal: data.vidaUtilNominal,
    horasOperacionais,
    equipamentoId,
    equipamento,
  });

  const saved = await ComponenteRepository.save(componente);
  return enriquecerComponente(saved);
}

/**
 * Atualiza um componente existente.
 *
 * Validações:
 * - O equipamento e componente devem existir
 * - Se vidaUtilNominal for alterada, deve continuar > 0
 * - Se horasOperacionais for alterada, deve ser >= 0
 *
 * @param equipamentoId - UUID do equipamento pai
 * @param id - UUID do componente
 * @param data - Campos a serem atualizados (parcial)
 * @returns O componente atualizado com desgaste percentual
 * @throws Error em caso de validação falha ou recurso inexistente
 */
export async function updateComponenteService(
  equipamentoId: string,
  id: string,
  data: UpdateComponenteData
): Promise<ComponenteComDesgaste> {
  const componente = await ComponenteRepository.findByIdAndEquipamento(
    id,
    equipamentoId
  );

  if (!componente) {
    throw new Error("Componente não encontrado.");
  }

  /* Valida vida útil nominal se fornecida */
  if (data.vidaUtilNominal !== undefined && data.vidaUtilNominal <= 0) {
    throw new Error("Vida útil nominal deve ser maior que zero.");
  }

  /* Valida horas operacionais se fornecidas */
  if (data.horasOperacionais !== undefined && data.horasOperacionais < 0) {
    throw new Error("Horas operacionais não podem ser negativas.");
  }

  /* Aplica as atualizações nos campos fornecidos */
  if (data.nome !== undefined) componente.nome = data.nome;
  if (data.tipo !== undefined) componente.tipo = data.tipo;
  if (data.vidaUtilNominal !== undefined)
    componente.vidaUtilNominal = data.vidaUtilNominal;
  if (data.horasOperacionais !== undefined)
    componente.horasOperacionais = data.horasOperacionais;

  const saved = await ComponenteRepository.save(componente);
  return enriquecerComponente(saved);
}

/**
 * Remove um componente do sistema.
 *
 * ⚠️ Operação irreversível — deve ser restrita a Admin/Gestor.
 *
 * @param equipamentoId - UUID do equipamento pai
 * @param id - UUID do componente a remover
 * @throws Error se o componente não for encontrado
 */
export async function deleteComponenteService(
  equipamentoId: string,
  id: string
): Promise<void> {
  const componente = await ComponenteRepository.findByIdAndEquipamento(
    id,
    equipamentoId
  );

  if (!componente) {
    throw new Error("Componente não encontrado.");
  }

  await ComponenteRepository.remove(componente);
}
