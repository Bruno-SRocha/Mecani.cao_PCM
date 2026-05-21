/**
 * Seed: Reportes de Substituição de Componentes e Usuários de Teste
 *
 * Garante a existência dos usuários de teste (técnico e gestor) e
 * popula a tabela de reportes de substituição com dados fictícios para testes.
 */

import { UserRepository } from "../repositories/user.repository";
import { NivelUsuario } from "../entities/user.entity";
import { EquipamentoRepository } from "../repositories/equipamento.repository";
import { AppDataSource } from "../config/database";
import { Componente } from "../entities/componente.entity";
import { ReporteSubstituicao, StatusReporte } from "../entities/reporte-substituicao.entity";

export async function seedReportes(): Promise<void> {
  /* 1. Criar Usuário Técnico de Teste se não existir */
  let tecnico = await UserRepository.findByNomeUsuario("tecnico");
  if (!tecnico) {
    tecnico = UserRepository.create({
      nomeUsuario: "tecnico",
      senha: "tecnico@123",
      nome: "Téc. de Campo João",
      nivel: NivelUsuario.TECNICO,
    });
    tecnico = await UserRepository.save(tecnico);
    console.log("✅ Usuário técnico de teste criado (tecnico / tecnico@123)");
  }

  /* 2. Criar Usuário Gestor de Teste se não existir */
  let gestor = await UserRepository.findByNomeUsuario("gestor");
  if (!gestor) {
    gestor = UserRepository.create({
      nomeUsuario: "gestor",
      senha: "gestor@123",
      nome: "Supervisor Maria",
      nivel: NivelUsuario.GESTOR,
    });
    gestor = await UserRepository.save(gestor);
    console.log("✅ Usuário gestor de teste criado (gestor / gestor@123)");
  }

  const reporteRepo = AppDataSource.getRepository(ReporteSubstituicao);
  const compRepo = AppDataSource.getRepository(Componente);

  /* Buscar equipamentos e componentes para associar aos reportes */
  const equipBomba = await EquipamentoRepository.findByTag("BC-001");
  const equipMotor = await EquipamentoRepository.findByTag("ME-003");
  const equipCompressor = await EquipamentoRepository.findByTag("CP-012");

  if (!equipBomba || !equipMotor || !equipCompressor) {
    return;
  }

  const compBomba = await compRepo.findOne({ where: { equipamentoId: equipBomba.id, tipo: "rolamento" } });
  const compSelo = await compRepo.findOne({ where: { equipamentoId: equipBomba.id, tipo: "selo_mecanico" } });
  const compMotor = await compRepo.findOne({ where: { equipamentoId: equipMotor.id, tipo: "rolamento" } });
  const compCompressor = await compRepo.findOne({ where: { equipamentoId: equipCompressor.id, tipo: "correia" } });

  /* Garantir que SEMPRE exista pelo menos UM reporte PENDENTE no sistema */
  const countPendentes = await reporteRepo.count({ where: { status: StatusReporte.AGUARDANDO_APROVACAO } });
  if (countPendentes === 0 && compSelo) {
    const novoPendente = reporteRepo.create({
      pecaInstalada: "Selo Mecânico John Crane T1 Premium",
      vidaUtilNovaPeca: 18000,
      dataSubstituicao: new Date(),
      observacoes: "Substituição preventiva periódica. O selo anterior apresentava leve gotejamento de lubrificante.",
      status: StatusReporte.AGUARDANDO_APROVACAO,
      equipamentoId: equipBomba.id,
      componenteId: compSelo.id,
      tecnicoId: tecnico.id,
    });
    await reporteRepo.save(novoPendente);
    console.log("⚠️ Nenhum reporte pendente encontrado. Criado novo reporte pendente de teste para 'Selo Mecânico'!");
  }

  /* 3. Verificar se já existem reportes no sistema para o restante do seed */
  const countTotal = await reporteRepo.count();
  if (countTotal > 1) {
    console.log(`ℹ️  Seeded de reportes complementares ignorado (${countTotal} reportes no total).`);
    return;
  }

  if (compBomba && compMotor && compCompressor) {
    /* Reporte 1: Aguardando Aprovação (Rolamento da Bomba KSB) */
    const reportePendente = reporteRepo.create({
      pecaInstalada: "Rolamento SKF 6310 Explorer Novo",
      vidaUtilNovaPeca: 28000,
      dataSubstituicao: new Date(),
      observacoes: "Substituição preventiva devido ao aumento de ruído e vibração detectados na rota de inspeção.",
      status: StatusReporte.AGUARDANDO_APROVACAO,
      equipamentoId: equipBomba.id,
      componenteId: compBomba.id,
      tecnicoId: tecnico.id,
    });
    await reporteRepo.save(reportePendente);

    /* Reporte 2: Aprovado (Rolamento do Motor WEG) */
    const reporteAprovado = reporteRepo.create({
      pecaInstalada: "Rolamento FAG 6208 C3 Alta Performance",
      vidaUtilNovaPeca: 20000,
      dataSubstituicao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 dias atrás
      observacoes: "Substituição corretiva. Rolamento antigo apresentava travamento leve.",
      status: StatusReporte.APROVADO,
      equipamentoId: equipMotor.id,
      componenteId: compMotor.id,
      tecnicoId: tecnico.id,
      aprovadorId: gestor.id,
      decididoEm: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
    });
    await reporteRepo.save(reporteAprovado);

    /* Reporte 3: Rejeitado (Correia do Compressor Atlas Copco) */
    const reporteRejeitado = reporteRepo.create({
      pecaInstalada: "Correia Gates 3VX Paralela",
      vidaUtilNovaPeca: 5000,
      dataSubstituicao: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás
      observacoes: "Correia trocada por modelo temporário alternativo devido à falta do item original em estoque.",
      status: StatusReporte.REJEITADO,
      motivoRejeicao: "Não é permitida a instalação de correias paralelas sem certificação OEM para este compressor crítico.",
      equipamentoId: equipCompressor.id,
      componenteId: compCompressor.id,
      tecnicoId: tecnico.id,
      aprovadorId: gestor.id,
      decididoEm: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    });
    await reporteRepo.save(reporteRejeitado);

    console.log("✅ Seed de reportes complementares criado com sucesso (pendente, aprovado, rejeitado).");
  }
}
