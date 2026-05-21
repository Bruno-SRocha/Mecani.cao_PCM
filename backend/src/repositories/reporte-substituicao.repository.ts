/**
 * Repository: Reporte de Substituição
 *
 * Acesso ao banco de dados para a entidade ReporteSubstituicao.
 * Extende o repositório TypeORM com queries específicas do domínio.
 */

import { AppDataSource } from "../config/database";
import { ReporteSubstituicao, StatusReporte } from "../entities/reporte-substituicao.entity";

export const ReporteSubstituicaoRepository = AppDataSource.getRepository(
  ReporteSubstituicao
).extend({
  /**
   * Lista todos os reportes de um equipamento específico, do mais recente ao mais antigo.
   */
  async findByEquipamento(equipamentoId: string): Promise<ReporteSubstituicao[]> {
    return this.find({
      where: { equipamentoId },
      order: { criadoEm: "DESC" },
    });
  },

  /**
   * Lista todos os reportes de um componente específico.
   */
  async findByComponente(componenteId: string): Promise<ReporteSubstituicao[]> {
    return this.find({
      where: { componenteId },
      order: { criadoEm: "DESC" },
    });
  },

  /**
   * Lista todos os reportes aguardando aprovação (fila de aprovação global).
   */
  async findPendentes(): Promise<ReporteSubstituicao[]> {
    return this.find({
      where: { status: StatusReporte.AGUARDANDO_APROVACAO },
      order: { criadoEm: "ASC" }, // Mais antigos primeiro (FIFO)
    });
  },

  /**
   * Conta reportes pendentes de aprovação (para o badge de notificação).
   */
  async countPendentes(): Promise<number> {
    return this.count({
      where: { status: StatusReporte.AGUARDANDO_APROVACAO },
    });
  },

  /**
   * Lista todos os reportes do sistema, do mais recente ao mais antigo.
   */
  async findAll(): Promise<ReporteSubstituicao[]> {
    return this.find({
      order: { criadoEm: "DESC" },
    });
  },
});
