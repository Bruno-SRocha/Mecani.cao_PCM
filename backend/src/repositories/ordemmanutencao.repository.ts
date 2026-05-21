/**
 * Repository: Ordem de Manutenção
 *
 * Centraliza todas as queries ao banco de dados relacionadas à
 * entidade OrdemManutencao. Os Services devem usar este repository
 * ao invés de acessar o banco diretamente.
 *
 * Inclui métodos customizados para:
 * - Geração sequencial do código legível (OM-YYYY-NNN)
 * - Filtros por técnico designado, status, prioridade e equipamento
 */

import { AppDataSource } from "../config/database";
import { OrdemManutencao, StatusOM, PrioridadeOM } from "../entities/ordemmanutencao.entity";

export const OrdemManutencaoRepository = AppDataSource.getRepository(OrdemManutencao).extend({
  /**
   * Gera o próximo código sequencial no formato OM-YYYY-NNN.
   *
   * Conta quantas OMs existem no ano corrente e incrementa +1.
   * Exemplo: se já existem 5 OMs em 2024 → retorna "OM-2024-006".
   *
   * @returns Código único gerado (ex: "OM-2024-001")
   */
  async gerarProximoCodigo(): Promise<string> {
    const anoAtual = new Date().getFullYear();
    const count = await this.createQueryBuilder("om")
      .where("YEAR(om.criadoEm) = :ano OR om.codigo LIKE :pattern", {
        ano: anoAtual,
        pattern: `OM-${anoAtual}-%`,
      })
      .getCount();

    // Contando as já existentes no banco (inclusive a que está sendo criada)
    const sequencial = String(count + 1).padStart(3, "0");
    return `OM-${anoAtual}-${sequencial}`;
  },

  /**
   * Lista todas as OMs com filtros opcionais, ordenadas por prioridade e data.
   * A ordenação por prioridade segue: CRITICA > ALTA > MEDIA > BAIXA.
   */
  async findComFiltros(filtros: {
    status?: StatusOM;
    prioridade?: PrioridadeOM;
    equipamentoId?: string;
    tecnicoId?: string;
  }): Promise<OrdemManutencao[]> {
    const qb = this.createQueryBuilder("om")
      .leftJoinAndSelect("om.equipamento", "equipamento")
      .leftJoinAndSelect("om.solicitante", "solicitante")
      .leftJoinAndSelect("om.tecnicos", "tecnicos");

    if (filtros.status) {
      qb.andWhere("om.status = :status", { status: filtros.status });
    }

    if (filtros.prioridade) {
      qb.andWhere("om.prioridade = :prioridade", { prioridade: filtros.prioridade });
    }

    if (filtros.equipamentoId) {
      qb.andWhere("equipamento.id = :equipamentoId", { equipamentoId: filtros.equipamentoId });
    }

    if (filtros.tecnicoId) {
      qb.andWhere("tecnicos.id = :tecnicoId", { tecnicoId: filtros.tecnicoId });
    }

    // Ordem: CRITICA primeiro, depois ALTA, MEDIA, BAIXA; dentro de cada prioridade, mais recente primeiro
    qb.orderBy(
      `FIELD(om.prioridade, 'CRITICA', 'ALTA', 'MEDIA', 'BAIXA')`,
      "ASC"
    ).addOrderBy("om.criadoEm", "DESC");

    return qb.getMany();
  },

  /**
   * Busca uma OM pelo UUID com todos os relacionamentos carregados.
   */
  async findByIdCompleto(id: string): Promise<OrdemManutencao | null> {
    return this.createQueryBuilder("om")
      .leftJoinAndSelect("om.equipamento", "equipamento")
      .leftJoinAndSelect("om.solicitante", "solicitante")
      .leftJoinAndSelect("om.tecnicos", "tecnicos")
      .where("om.id = :id", { id })
      .getOne();
  },

  /**
   * Lista OMs atribuídas a um técnico específico, ordenadas por prioridade.
   * Usado no backlog do técnico.
   */
  async findByTecnico(tecnicoId: string): Promise<OrdemManutencao[]> {
    return this.createQueryBuilder("om")
      .leftJoinAndSelect("om.equipamento", "equipamento")
      .leftJoinAndSelect("om.solicitante", "solicitante")
      .leftJoinAndSelect("om.tecnicos", "tecnicos")
      .where("tecnicos.id = :tecnicoId", { tecnicoId })
      .orderBy(`FIELD(om.prioridade, 'CRITICA', 'ALTA', 'MEDIA', 'BAIXA')`, "ASC")
      .addOrderBy("om.criadoEm", "DESC")
      .getMany();
  },
});
