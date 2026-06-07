import { AppDataSource } from "../config/database";
import { EquipamentoAuditoria } from "../entities/equipamento-auditoria.entity";

/**
 * Repository: EquipamentoAuditoria
 *
 * Centraliza as consultas ao histórico/auditoria de equipamentos.
 */
export const EquipamentoAuditoriaRepository = AppDataSource.getRepository(EquipamentoAuditoria).extend({
  /**
   * Busca todo o histórico de auditoria de um equipamento, ordenado por data (mais recente primeiro).
   *
   * @param equipamentoId - ID do equipamento
   * @returns Array de logs de auditoria
   */
  async findByEquipamentoId(equipamentoId: string): Promise<EquipamentoAuditoria[]> {
    return this.find({
      where: { equipamentoId },
      order: { criadoEm: "DESC" },
      relations: ["usuario"],
    });
  },
});
