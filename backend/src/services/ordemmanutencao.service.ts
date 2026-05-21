/**
 * Service: Ordem de Manutenção
 *
 * Camada de regras de negócio do módulo de OMs.
 * Contém toda a lógica de criação, atualização, validação e
 * consulta de Ordens de Manutenção.
 *
 * Regras de negócio implementadas:
 * - Geração automática do código sequencial OM-YYYY-NNN
 * - Status inicial sempre = ABERTA
 * - Apenas TECNICO pode ser designado como responsável
 * - Validação de que o equipamento existe antes de criar a OM
 * - Notificação simulada ao salvar (log + estrutura para push futuro)
 */

import { AppDataSource } from "../config/database";
import { OrdemManutencaoRepository } from "../repositories/ordemmanutencao.repository";
import { OrdemManutencao, StatusOM, TipoManutencao, PrioridadeOM } from "../entities/ordemmanutencao.entity";
import { Equipamento } from "../entities/equipamento.entity";
import { User, NivelUsuario } from "../entities/user.entity";

/** DTO para criação de uma nova OM */
export interface CreateOMDto {
  equipamentoId: string;
  descricao: string;
  tipo: TipoManutencao;
  prioridade?: PrioridadeOM;
  dataInicioPrevisto?: string; // ISO string
  tecnicoIds: string[];
  materiaisNecessarios?: string[];
  observacoes?: string;
}

/** DTO para atualização de uma OM existente */
export interface UpdateOMDto {
  descricao?: string;
  tipo?: TipoManutencao;
  prioridade?: PrioridadeOM;
  status?: StatusOM;
  dataInicioPrevisto?: string;
  tecnicoIds?: string[];
  materiaisNecessarios?: string[];
  observacoes?: string;
}

/**
 * Cria uma nova Ordem de Manutenção.
 *
 * Fluxo:
 * 1. Valida que o equipamento existe
 * 2. Valida que todos os técnicos designados existem e têm nível TECNICO
 * 3. Gera o código sequencial OM-YYYY-NNN
 * 4. Persiste com status ABERTA
 * 5. Dispara notificação para os técnicos (log simulado)
 *
 * @param solicitanteId - ID do usuário (GESTOR/ADMIN) que criou a OM
 * @param dto - Dados da nova OM
 * @returns A OM criada com todos os relacionamentos
 */
export async function criarOM(solicitanteId: string, dto: CreateOMDto): Promise<OrdemManutencao> {
  const equipamentoRepo = AppDataSource.getRepository(Equipamento);
  const userRepo = AppDataSource.getRepository(User);

  // 1. Valida equipamento
  const equipamento = await equipamentoRepo.findOne({ where: { id: dto.equipamentoId } });
  if (!equipamento) {
    throw new Error(`Equipamento com ID "${dto.equipamentoId}" não encontrado.`);
  }

  // 2. Valida solicitante
  const solicitante = await userRepo.findOne({ where: { id: solicitanteId } });
  if (!solicitante) {
    throw new Error("Solicitante não encontrado.");
  }

  // 3. Valida técnicos
  if (!dto.tecnicoIds || dto.tecnicoIds.length === 0) {
    throw new Error("Pelo menos um técnico deve ser designado para a OM.");
  }

  const tecnicos: User[] = [];
  for (const tecnicoId of dto.tecnicoIds) {
    const tecnico = await userRepo.findOne({ where: { id: tecnicoId } });
    if (!tecnico) {
      throw new Error(`Técnico com ID "${tecnicoId}" não encontrado.`);
    }
    if (tecnico.nivel !== NivelUsuario.TECNICO) {
      throw new Error(`O usuário "${tecnico.nome}" não possui o perfil de Técnico.`);
    }
    tecnicos.push(tecnico);
  }

  // 4. Gera código sequencial
  const codigo = await OrdemManutencaoRepository.gerarProximoCodigo();

  // 5. Cria a entidade
  const om = OrdemManutencaoRepository.create({
    codigo,
    descricao: dto.descricao,
    tipo: dto.tipo,
    prioridade: dto.prioridade ?? PrioridadeOM.MEDIA,
    status: StatusOM.ABERTA, // Regra de negócio: sempre inicia como ABERTA
    dataInicioPrevisto: dto.dataInicioPrevisto ? new Date(dto.dataInicioPrevisto) : undefined,
    materiaisNecessarios: dto.materiaisNecessarios ?? [],
    observacoes: dto.observacoes,
    equipamento,
    solicitante,
    tecnicos,
  });

  const omSalva = await OrdemManutencaoRepository.save(om);

  // 6. Notificação simulada (AC6)
  // Em produção: integrar com Firebase FCM, OneSignal, ou WebSocket
  notificarTecnicos(omSalva, tecnicos);

  return omSalva;
}

/**
 * Lista OMs com filtros opcionais.
 * - GESTOR/ADMIN: vê todas as OMs
 * - TECNICO: vê apenas as OMs designadas a ele
 */
export async function listarOMs(filtros: {
  status?: StatusOM;
  prioridade?: PrioridadeOM;
  equipamentoId?: string;
  tecnicoId?: string;
}): Promise<OrdemManutencao[]> {
  return OrdemManutencaoRepository.findComFiltros(filtros);
}

/**
 * Busca uma OM pelo ID com todos os relacionamentos.
 */
export async function buscarOM(id: string): Promise<OrdemManutencao> {
  const om = await OrdemManutencaoRepository.findByIdCompleto(id);
  if (!om) {
    throw new Error(`Ordem de Manutenção com ID "${id}" não encontrada.`);
  }
  return om;
}

/**
 * Atualiza uma OM existente.
 * Permite alterar descrição, tipo, prioridade, status e técnicos.
 */
export async function atualizarOM(id: string, dto: UpdateOMDto): Promise<OrdemManutencao> {
  const om = await OrdemManutencaoRepository.findByIdCompleto(id);
  if (!om) {
    throw new Error(`Ordem de Manutenção com ID "${id}" não encontrada.`);
  }

  // Atualiza campos simples
  if (dto.descricao !== undefined) om.descricao = dto.descricao;
  if (dto.tipo !== undefined) om.tipo = dto.tipo;
  if (dto.prioridade !== undefined) om.prioridade = dto.prioridade;
  if (dto.status !== undefined) om.status = dto.status;
  if (dto.dataInicioPrevisto !== undefined) {
    om.dataInicioPrevisto = new Date(dto.dataInicioPrevisto);
  }
  if (dto.materiaisNecessarios !== undefined) om.materiaisNecessarios = dto.materiaisNecessarios;
  if (dto.observacoes !== undefined) om.observacoes = dto.observacoes;

  // Atualiza técnicos se fornecidos
  if (dto.tecnicoIds !== undefined) {
    const userRepo = AppDataSource.getRepository(User);
    const tecnicos: User[] = [];
    for (const tecnicoId of dto.tecnicoIds) {
      const tecnico = await userRepo.findOne({ where: { id: tecnicoId } });
      if (!tecnico) throw new Error(`Técnico com ID "${tecnicoId}" não encontrado.`);
      if (tecnico.nivel !== NivelUsuario.TECNICO) {
        throw new Error(`O usuário "${tecnico.nome}" não possui o perfil de Técnico.`);
      }
      tecnicos.push(tecnico);
    }
    om.tecnicos = tecnicos;
  }

  return OrdemManutencaoRepository.save(om);
}

/**
 * Remove uma OM pelo ID.
 * Apenas OMs em status ABERTA ou CANCELADA podem ser removidas.
 */
export async function deletarOM(id: string): Promise<void> {
  const om = await OrdemManutencaoRepository.findOne({ where: { id } });
  if (!om) {
    throw new Error(`Ordem de Manutenção com ID "${id}" não encontrada.`);
  }
  await OrdemManutencaoRepository.remove(om);
}

/**
 * Lista todos os usuários com nível TECNICO.
 * Usado para popular o dropdown de designação de responsável no formulário.
 */
export async function listarTecnicos(): Promise<User[]> {
  const userRepo = AppDataSource.getRepository(User);
  return userRepo.find({
    where: { nivel: NivelUsuario.TECNICO },
    order: { nome: "ASC" },
  });
}

/**
 * Simula o envio de notificação push para os técnicos designados.
 * AC6: "Ao salvar a OM, o técnico designado deve receber uma notificação (push)."
 *
 * Em produção, substituir este log por integração real com:
 * - Firebase Cloud Messaging (FCM)
 * - OneSignal
 * - Server-Sent Events (SSE)
 * - WebSocket
 */
function notificarTecnicos(om: OrdemManutencao, tecnicos: User[]): void {
  tecnicos.forEach((tecnico) => {
    console.log(
      `🔔 [NOTIFICAÇÃO] → Técnico "${tecnico.nome}" (${tecnico.nomeUsuario}): ` +
      `Nova OM atribuída — ${om.codigo} | ${om.tipo} | Prioridade: ${om.prioridade} | ` +
      `Equipamento: ${om.equipamento.nome}`
    );
  });
}
