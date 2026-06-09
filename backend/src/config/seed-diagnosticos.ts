import { AppDataSource } from "./database";
import { Equipamento, StatusEquipamento } from "../entities/equipamento.entity";
import { User } from "../entities/user.entity";
import { Diagnostico, SeveridadeDiagnostico } from "../entities/diagnostico.entity";

export async function seedDiagnosticos(): Promise<void> {
  try {
    const equipamentoRepo = AppDataSource.getRepository(Equipamento);
    const userRepo = AppDataSource.getRepository(User);
    const diagnosticoRepo = AppDataSource.getRepository(Diagnostico);

    // Verify idempotency
    const diagCount = await diagnosticoRepo.count();
    if (diagCount > 0) {
      console.log(`ℹ️  ${diagCount} diagnóstico(s) já existem no banco. Seed de diagnósticos ignorado.`);
      return;
    }

    let tecnico = await userRepo.findOne({ where: { nomeUsuario: "tecnico" } });
    if (!tecnico) {
      tecnico = await userRepo.findOne({ where: {} });
    }

    if (!tecnico) {
      console.log("❌ Nenhum usuário encontrado. Seed de diagnósticos abortado.");
      return;
    }

    let equipamentos = await equipamentoRepo.find();
    if (equipamentos.length === 0) {
      console.log("❌ Nenhum equipamento encontrado. Seed de diagnósticos abortado.");
      return;
    }

    const equipamento = equipamentos[0];

    console.log(`📋 Inserindo diagnósticos mock para o equipamento ${equipamento.nome} (${equipamento.tag})...`);

    const diagnosticosMock = [
      {
        data: new Date(new Date().setDate(new Date().getDate() - 10)), // 10 days ago
        severidade: SeveridadeDiagnostico.BAIXA,
        texto: "Inspeção visual realizada. Equipamento operando em condições normais, com leve vibração dentro da tolerância.",
        equipamento: equipamento,
        autor: tecnico,
      },
      {
        data: new Date(new Date().setDate(new Date().getDate() - 5)), // 5 days ago
        severidade: SeveridadeDiagnostico.MEDIA,
        texto: "Detectado ruído anômalo na carcaça do motor durante partida. Recomendado monitoramento da temperatura.",
        equipamento: equipamento,
        autor: tecnico,
      },
      {
        data: new Date(), // today
        severidade: SeveridadeDiagnostico.ALTA,
        texto: "Vazamento contínuo de óleo no selo mecânico principal. Necessário agendar intervenção de manutenção.",
        equipamento: equipamento,
        autor: tecnico,
      },
    ];

    for (const diag of diagnosticosMock) {
      const novoDiagnostico = diagnosticoRepo.create(diag);
      await diagnosticoRepo.save(novoDiagnostico);
    }

    console.log(`✅ ${diagnosticosMock.length} diagnósticos de demonstração criados com sucesso.`);
  } catch (error) {
    console.error("❌ Erro ao inserir diagnósticos:", error);
  }
}
