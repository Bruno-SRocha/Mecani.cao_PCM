/**
 * Service: Reporte de Substituição de Componente
 *
 * Regras de negócio do fluxo de substituição:
 *
 * 1. Qualquer usuário autenticado (TECNICO, GESTOR, ADMIN) pode criar um reporte.
 * 2. O reporte nasce com status AGUARDANDO_APROVACAO.
 * 3. Apenas GESTOR e ADMIN podem aprovar ou rejeitar.
 * 4. Ao APROVAR:
 *    - O componente tem seu nome atualizado para `pecaInstalada`
 *    - A `vidaUtilNominal` é atualizada com `vidaUtilNovaPeca`
 *    - As `horasOperacionais` são ZERADAS (reset após substituição)
 *    - O reporte é marcado como APROVADO
 * 5. Ao REJEITAR:
 *    - O componente NÃO é alterado
 *    - O reporte é marcado como REJEITADO com o motivo informado
 */

import { ReporteSubstituicaoRepository } from "../repositories/reporte-substituicao.repository";
import { ComponenteRepository } from "../repositories/componente.repository";
import { EquipamentoRepository } from "../repositories/equipamento.repository";
import {
  ReporteSubstituicao,
  StatusReporte,
} from "../entities/reporte-substituicao.entity";

/* ── Interfaces ───────────────────────────────────────────── */

export interface CreateReporteData {
  pecaInstalada: string;
  vidaUtilNovaPeca: number;
  dataSubstituicao: string; // ISO date string (YYYY-MM-DD)
  observacoes?: string;
}

export interface AprovarReporteData {
  aprovadorId: string;
}

export interface RejeitarReporteData {
  aprovadorId: string;
  motivoRejeicao: string;
}

/* ── Service Functions ────────────────────────────────────── */

/**
 * Cria um novo reporte de substituição de componente.
 * Acessível por todos os perfis autenticados.
 *
 * @param equipamentoId - UUID do equipamento
 * @param componenteId - UUID do componente substituído
 * @param tecnicoId - UUID do usuário que criou o reporte
 * @param data - Dados do reporte
 */
export async function createReporteService(
  equipamentoId: string,
  componenteId: string,
  tecnicoId: string,
  data: CreateReporteData
): Promise<ReporteSubstituicao> {
  /* Valida existência do equipamento */
  const equipamento = await EquipamentoRepository.findOne({
    where: { id: equipamentoId },
  });
  if (!equipamento) {
    throw new Error("Equipamento não encontrado.");
  }

  /* Valida existência do componente e pertencimento ao equipamento */
  const componente = await ComponenteRepository.findByIdAndEquipamento(
    componenteId,
    equipamentoId
  );
  if (!componente) {
    throw new Error("Componente não encontrado neste equipamento.");
  }

  /* Valida campos obrigatórios */
  if (!data.pecaInstalada?.trim()) {
    throw new Error("Nome da peça instalada é obrigatório.");
  }
  if (!data.vidaUtilNovaPeca || data.vidaUtilNovaPeca <= 0) {
    throw new Error("Vida útil da nova peça deve ser maior que zero.");
  }
  if (!data.dataSubstituicao) {
    throw new Error("Data da substituição é obrigatória.");
  }

  const reporte = ReporteSubstituicaoRepository.create({
    pecaInstalada: data.pecaInstalada.trim(),
    vidaUtilNovaPeca: data.vidaUtilNovaPeca,
    dataSubstituicao: new Date(data.dataSubstituicao),
    observacoes: data.observacoes?.trim() || undefined,
    status: StatusReporte.AGUARDANDO_APROVACAO,
    componenteId,
    equipamentoId,
    tecnicoId,
  });

  return ReporteSubstituicaoRepository.save(reporte);
}

/**
 * Lista todos os reportes de um componente específico.
 */
export async function listReportesByComponenteService(
  equipamentoId: string,
  componenteId: string
): Promise<ReporteSubstituicao[]> {
  /* Verifica que o componente pertence ao equipamento */
  const componente = await ComponenteRepository.findByIdAndEquipamento(
    componenteId,
    equipamentoId
  );
  if (!componente) {
    throw new Error("Componente não encontrado neste equipamento.");
  }

  return ReporteSubstituicaoRepository.findByComponente(componenteId);
}

/**
 * Lista todos os reportes pendentes de aprovação (fila de aprovação global).
 * Restrito a GESTOR e ADMIN.
 */
export async function listPendentesService(): Promise<ReporteSubstituicao[]> {
  return ReporteSubstituicaoRepository.findPendentes();
}

/**
 * Conta reportes pendentes para o badge de notificação.
 */
export async function countPendentesService(): Promise<number> {
  return ReporteSubstituicaoRepository.countPendentes();
}

/**
 * Lista todos os reportes do sistema.
 * Restrito a GESTOR e ADMIN.
 */
export async function listAllReportesService(): Promise<ReporteSubstituicao[]> {
  return ReporteSubstituicaoRepository.findAll();
}

/**
 * Busca um reporte específico pelo ID.
 */
export async function getReporteService(
  id: string
): Promise<ReporteSubstituicao> {
  const reporte = await ReporteSubstituicaoRepository.findOne({
    where: { id },
  });
  if (!reporte) {
    throw new Error("Reporte não encontrado.");
  }
  return reporte;
}

/**
 * Aprova um reporte de substituição.
 *
 * Efeitos colaterais:
 * - Atualiza o nome do componente com `pecaInstalada`
 * - Atualiza `vidaUtilNominal` com `vidaUtilNovaPeca`
 * - Zera `horasOperacionais` (reset após substituição)
 * - Marca reporte como APROVADO
 *
 * Restrito a GESTOR e ADMIN.
 */
export async function aprovarReporteService(
  id: string,
  data: AprovarReporteData
): Promise<ReporteSubstituicao> {
  const reporte = await ReporteSubstituicaoRepository.findOne({
    where: { id },
    relations: ["componente"],
  });

  if (!reporte) {
    throw new Error("Reporte não encontrado.");
  }

  if (reporte.status !== StatusReporte.AGUARDANDO_APROVACAO) {
    throw new Error(
      `Este reporte já foi ${reporte.status === StatusReporte.APROVADO ? "aprovado" : "rejeitado"}.`
    );
  }

  /* Atualiza o componente: nome, vida útil e zera horas */
  const componente = await ComponenteRepository.findOne({
    where: { id: reporte.componenteId },
  });

  if (!componente) {
    throw new Error("Componente não encontrado. Pode ter sido removido.");
  }

  componente.nome = reporte.pecaInstalada;
  componente.vidaUtilNominal = reporte.vidaUtilNovaPeca;
  componente.horasOperacionais = 0; // Reset após substituição aprovada

  await ComponenteRepository.save(componente);

  /* Marca o reporte como aprovado */
  reporte.status = StatusReporte.APROVADO;
  reporte.aprovadorId = data.aprovadorId;
  reporte.decididoEm = new Date();

  return ReporteSubstituicaoRepository.save(reporte);
}

/**
 * Rejeita um reporte de substituição.
 * O componente NÃO é alterado.
 *
 * Restrito a GESTOR e ADMIN.
 */
export async function rejeitarReporteService(
  id: string,
  data: RejeitarReporteData
): Promise<ReporteSubstituicao> {
  const reporte = await ReporteSubstituicaoRepository.findOne({
    where: { id },
  });

  if (!reporte) {
    throw new Error("Reporte não encontrado.");
  }

  if (reporte.status !== StatusReporte.AGUARDANDO_APROVACAO) {
    throw new Error(
      `Este reporte já foi ${reporte.status === StatusReporte.APROVADO ? "aprovado" : "rejeitado"}.`
    );
  }

  if (!data.motivoRejeicao?.trim()) {
    throw new Error("Motivo da rejeição é obrigatório.");
  }

  reporte.status = StatusReporte.REJEITADO;
  reporte.aprovadorId = data.aprovadorId;
  reporte.motivoRejeicao = data.motivoRejeicao.trim();
  reporte.decididoEm = new Date();

  return ReporteSubstituicaoRepository.save(reporte);
}
