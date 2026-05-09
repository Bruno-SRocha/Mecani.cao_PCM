import { AppDataSource } from "./config/database";
import { Equipamento, StatusEquipamento } from "./entities/equipamento.entity";
import { User } from "./entities/user.entity";
import { Diagnostico, SeveridadeDiagnostico } from "./entities/diagnostico.entity";

async function seedDiagnosticos() {
  console.log("Conectando ao banco de dados...");
  await AppDataSource.initialize();
  console.log("Banco de dados conectado!");

  try {
    const equipamentoRepo = AppDataSource.getRepository(Equipamento);
    const userRepo = AppDataSource.getRepository(User);
    const diagnosticoRepo = AppDataSource.getRepository(Diagnostico);

    let tecnico = await userRepo.findOne({ where: { nomeUsuario: "tecnico" } });
    if (!tecnico) {
      tecnico = await userRepo.findOne({ where: {} });
    }

    if (!tecnico) {
      console.log("Nenhum usuário encontrado. Execute o seed de usuários primeiro.");
      return;
    }

    let equipamentos = await equipamentoRepo.find();
    if (equipamentos.length === 0) {
      console.log("Nenhum equipamento encontrado. Criando um equipamento de teste...");
      const equipamento = equipamentoRepo.create({
        tag: "BOM-001",
        nome: "Bomba Centrífuga",
        tipo: "Bomba",
        fabricante: "WEG",
        modelo: "W22",
        localizacao: "Área de Utilidades",
        status: StatusEquipamento.OPERANDO,
      });
      await equipamentoRepo.save(equipamento);
      equipamentos = [equipamento];
    }

    const equipamento = equipamentos[0];

    console.log(`Inserindo diagnósticos mock para o equipamento ${equipamento.nome} (${equipamento.tag})...`);

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
      console.log(`Diagnóstico (${diag.severidade}) inserido com sucesso!`);
    }

    console.log("Seed de diagnósticos finalizado com sucesso!");
  } catch (error) {
    console.error("Erro ao inserir diagnósticos:", error);
  } finally {
    await AppDataSource.destroy();
    console.log("Conexão fechada.");
  }
}

seedDiagnosticos();
