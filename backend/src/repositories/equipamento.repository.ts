/**
 * Repository: Equipamento
 *
 * Centraliza todas as queries ao banco de dados relacionadas à
 * entidade Equipamento. Os Services devem usar este repository ao
 * invés de acessar o banco diretamente, mantendo a separação
 * de responsabilidades (padrão Repository do TypeORM).
 *
 * O repository estende o repositório padrão do TypeORM com
 * métodos customizados específicos do domínio PCM.
 */

import { AppDataSource } from "../config/database";
import { Equipamento } from "../entities/equipamento.entity";

/**
 * Repository customizado de Equipamento.
 *
 * Além dos métodos CRUD padrão (find, save, delete, etc),
 * inclui métodos específicos para gestão de ativos industriais.
 */
export const EquipamentoRepository = AppDataSource.getRepository(Equipamento).extend({
  /**
   * Busca todos os equipamentos com contagem de componentes.
   *
   * Retorna a lista completa de equipamentos cadastrados,
   * incluindo o número de componentes associados a cada um.
   * Ordenados por data de criação (mais recentes primeiro).
   *
   * @returns Array de equipamentos com quantidade de componentes
   */
  async findAllWithComponentCount(): Promise<Equipamento[]> {
    return this.find({
      order: { criadoEm: "DESC" },
      relations: ["componentes"],
    });
  },

  /**
   * Busca um equipamento pelo ID incluindo seus componentes.
   *
   * Carrega o equipamento com todos os seus componentes mecânicos
   * para exibição na tela de detalhes do ativo industrial.
   *
   * @param id - UUID do equipamento
   * @returns O equipamento encontrado com componentes ou null
   */
  async findByIdWithComponents(id: string): Promise<Equipamento | null> {
    return this.findOne({
      where: { id },
      relations: ["componentes"],
    });
  },

  /**
   * Busca um equipamento pela TAG industrial.
   *
   * A TAG é o código identificador único do equipamento na planta
   * (ex: "BC-001", "ME-003"). Usada para validar duplicidade.
   *
   * @param tag - TAG do equipamento na planta
   * @returns O equipamento encontrado ou null
   */
  async findByTag(tag: string): Promise<Equipamento | null> {
    return this.findOne({ where: { tag } });
  },
});
