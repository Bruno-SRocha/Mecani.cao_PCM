import { DiagnosticoRepository } from "../repositories/diagnostico.repository";
import { DiagnosticoHistoricoRepository } from "../repositories/diagnostico-historico.repository";
import { EquipamentoRepository } from "../repositories/equipamento.repository";
import { UserRepository } from "../repositories/user.repository";
import { Diagnostico, SeveridadeDiagnostico } from "../entities/diagnostico.entity";
import { User, NivelUsuario } from "../entities/user.entity";
import { DiagnosticoHistorico } from "../entities/diagnostico-historico.entity";

export class DiagnosticoService {
  async criar(equipamentoId: string, usuarioId: string, dados: Partial<Diagnostico>): Promise<Diagnostico> {
    const equipamento = await EquipamentoRepository.findOneBy({ id: equipamentoId });
    if (!equipamento) {
      throw new Error("Equipamento não encontrado");
    }

    const autor = await UserRepository.findOneBy({ id: usuarioId });
    if (!autor) {
      throw new Error("Usuário não encontrado");
    }

    const diagnostico = DiagnosticoRepository.create({
      ...dados,
      equipamento,
      autor,
    });

    return await DiagnosticoRepository.save(diagnostico);
  }

  async listarPorEquipamento(equipamentoId: string): Promise<Diagnostico[]> {
    return await DiagnosticoRepository.find({
      where: { equipamento: { id: equipamentoId } },
      relations: ["autor"],
      order: { data: "DESC", criadoEm: "DESC" },
    });
  }

  async editar(diagnosticoId: string, usuario: User, dados: Partial<Diagnostico>): Promise<Diagnostico> {
    const diagnostico = await DiagnosticoRepository.findOne({
      where: { id: diagnosticoId },
      relations: ["autor"],
    });

    if (!diagnostico) {
      throw new Error("Diagnóstico não encontrado");
    }

    // Regras de permissão
    if (usuario.nivel === NivelUsuario.TECNICO && diagnostico.autor.id !== usuario.id) {
      throw new Error("Técnicos só podem editar os próprios diagnósticos.");
    }

    // Salva o histórico antes de alterar
    const historico = DiagnosticoHistoricoRepository.create({
      diagnostico,
      editor: usuario,
      severidadeAnterior: diagnostico.severidade,
      textoAnterior: diagnostico.texto,
    });
    await DiagnosticoHistoricoRepository.save(historico);

    // Atualiza os dados
    if (dados.severidade) diagnostico.severidade = dados.severidade;
    if (dados.texto) diagnostico.texto = dados.texto;
    if (dados.data) diagnostico.data = dados.data;

    return await DiagnosticoRepository.save(diagnostico);
  }

  async obterAuditoria(diagnosticoId: string, usuario: User): Promise<DiagnosticoHistorico[]> {
    if (usuario.nivel !== NivelUsuario.ADMIN) {
      throw new Error("Apenas administradores podem visualizar o histórico de auditoria.");
    }

    return await DiagnosticoHistoricoRepository.find({
      where: { diagnostico: { id: diagnosticoId } },
      relations: ["editor"],
      order: { dataEdicao: "DESC" },
    });
  }
}
