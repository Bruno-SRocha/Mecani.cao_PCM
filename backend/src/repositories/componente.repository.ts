/**
 * Repository: Componente
 *
 * Centraliza todas as queries ao banco de dados relacionadas à
 * entidade Componente. Segue o mesmo padrão do EquipamentoRepository:
 * repository estendido com métodos específicos do domínio PCM.
 *
 * Os Services de Componente devem usar este repository ao invés
 * de acessar o banco diretamente.
 */

import { AppDataSource } from "../config/database";
import { Componente } from "../entities/componente.entity";

/**
 * Repository customizado de Componente.
 *
 * Além dos métodos CRUD padrão do TypeORM, inclui métodos
 * específicos para rastreamento de desgaste de peças industriais.
 */
export const ComponenteRepository = AppDataSource.getRepository(
  Componente
).extend({
  /**
   * Lista todos os componentes de um equipamento específico.
   *
   * Retorna os componentes ordenados por percentual de desgaste
   * decrescente (componentes mais críticos aparecem primeiro),
   * facilitando a priorização de manutenção.
   *
   * @param equipamentoId - UUID do equipamento pai
   * @returns Array de componentes do equipamento
   */
  async findByEquipamento(equipamentoId: string): Promise<Componente[]> {
    return this.find({
      where: { equipamentoId },
      order: { criadoEm: "DESC" },
    });
  },

  /**
   * Busca um componente pelo ID.
   *
   * @param id - UUID do componente
   * @returns O componente encontrado ou null
   */
  async findById(id: string): Promise<Componente | null> {
    return this.findOne({ where: { id } });
  },

  /**
   * Busca um componente pelo ID validando que pertence ao equipamento.
   *
   * Usado nas operações de update/delete para garantir que o
   * componente realmente pertence ao equipamento informado na rota,
   * evitando manipulação de dados cross-equipamento.
   *
   * @param id - UUID do componente
   * @param equipamentoId - UUID do equipamento pai esperado
   * @returns O componente encontrado ou null
   */
  async findByIdAndEquipamento(
    id: string,
    equipamentoId: string
  ): Promise<Componente | null> {
    return this.findOne({ where: { id, equipamentoId } });
  },
});
