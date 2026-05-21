import { AppDataSource } from "../config/database";
import { SolicitacaoModificacao, StatusModificacao } from "../entities/solicitacao-modificacao.entity";

export const SolicitacaoModificacaoRepository = AppDataSource.getRepository(
  SolicitacaoModificacao
).extend({
  /**
   * Lista todas as solicitações de um equipamento, da mais recente à mais antiga.
   */
  async findByEquipamento(equipamentoId: string): Promise<SolicitacaoModificacao[]> {
    return this.find({
      where: { equipamentoId },
      order: { criadoEm: "DESC" },
    });
  },

  /**
   * Lista todas as solicitações de modificação pendentes.
   */
  async findPendentes(): Promise<SolicitacaoModificacao[]> {
    return this.find({
      where: { status: StatusModificacao.PENDENTE },
      order: { criadoEm: "ASC" },
    });
  },

  /**
   * Conta solicitações pendentes de análise.
   */
  async countPendentes(): Promise<number> {
    return this.count({
      where: { status: StatusModificacao.PENDENTE },
    });
  },

  /**
   * Lista todas as solicitações do sistema, das mais recentes às mais antigas.
   */
  async findAll(): Promise<SolicitacaoModificacao[]> {
    return this.find({
      order: { criadoEm: "DESC" },
    });
  },
});
