/**
 * Script standalone: Seed de Reportes de Substituição (Aprovações)
 *
 * Popula a aba "Aprovações" com dados realistas cobrindo:
 *   - Reportes AGUARDANDO_APROVACAO (pendentes — aparecem no topo)
 *   - Reportes APROVADO (histórico positivo)
 *   - Reportes REJEITADO (histórico com motivo claro)
 *
 * Pré-requisitos:
 *   - Equipamentos e componentes já existentes (seed-equipamentos)
 *   - Usuários admin/gestor/tecnico já existentes (seed inicial)
 *
 * Execução:
 *   npx ts-node src/seed-aprovacoes.ts
 */

import "reflect-metadata";
import { AppDataSource } from "./config/database";
import { NivelUsuario, User } from "./entities/user.entity";
import { Componente } from "./entities/componente.entity";
import { ReporteSubstituicao, StatusReporte, MotivoTroca } from "./entities/reporte-substituicao.entity";
import { EquipamentoRepository } from "./repositories/equipamento.repository";
import { UserRepository } from "./repositories/user.repository";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function seedAprovacoes() {
  console.log("🔌 Conectando ao banco de dados...");
  await AppDataSource.initialize();
  console.log("✅ Banco de dados conectado!\n");

  try {
    const reporteRepo = AppDataSource.getRepository(ReporteSubstituicao);
    const compRepo    = AppDataSource.getRepository(Componente);
    const userRepo    = AppDataSource.getRepository(User);

    /* ── 1. Garantir Usuários ─────────────────────────────────── */

    let tecnico1 = await UserRepository.findByNomeUsuario("tecnico");
    if (!tecnico1) {
      tecnico1 = UserRepository.create({
        nomeUsuario: "tecnico",
        senha: "tecnico@123",
        nome: "João Alves (Técnico)",
        nivel: NivelUsuario.TECNICO,
      });
      tecnico1 = await UserRepository.save(tecnico1);
      console.log("✅ Usuário tecnico criado (tecnico / tecnico@123)");
    }

    let tecnico2 = await UserRepository.findByNomeUsuario("tecnico2");
    if (!tecnico2) {
      tecnico2 = UserRepository.create({
        nomeUsuario: "tecnico2",
        senha: "tecnico@123",
        nome: "Carlos Mendes (Técnico)",
        nivel: NivelUsuario.TECNICO,
      });
      tecnico2 = await UserRepository.save(tecnico2);
      console.log("✅ Usuário tecnico2 criado (tecnico2 / tecnico@123)");
    }

    let tecnico3 = await UserRepository.findByNomeUsuario("tecnico3");
    if (!tecnico3) {
      tecnico3 = UserRepository.create({
        nomeUsuario: "tecnico3",
        senha: "tecnico@123",
        nome: "Fernanda Costa (Técnica)",
        nivel: NivelUsuario.TECNICO,
      });
      tecnico3 = await UserRepository.save(tecnico3);
      console.log("✅ Usuário tecnico3 criado (tecnico3 / tecnico@123)");
    }

    let gestor = await UserRepository.findByNomeUsuario("gestor");
    if (!gestor) {
      gestor = UserRepository.create({
        nomeUsuario: "gestor",
        senha: "gestor@123",
        nome: "Supervisora Maria (Gestora)",
        nivel: NivelUsuario.GESTOR,
      });
      gestor = await UserRepository.save(gestor);
      console.log("✅ Usuário gestor criado (gestor / gestor@123)");
    }

    /* ── 2. Buscar Equipamentos ──────────────────────────────── */

    const equipBomba      = await EquipamentoRepository.findByTag("BC-001");
    const equipMotor      = await EquipamentoRepository.findByTag("ME-003");
    const equipCompressor = await EquipamentoRepository.findByTag("CP-012");
    const equipVentilador = await EquipamentoRepository.findByTag("VA-007");
    const equipReductor   = await EquipamentoRepository.findByTag("RD-005");

    if (!equipBomba || !equipMotor || !equipCompressor) {
      console.error("❌ Equipamentos base não encontrados. Execute o seed de equipamentos primeiro.");
      return;
    }

    /* ── 3. Buscar Componentes ───────────────────────────────── */

    const compBombaRolamento    = await compRepo.findOne({ where: { equipamentoId: equipBomba.id, tipo: "rolamento" } });
    const compBombaSelo         = await compRepo.findOne({ where: { equipamentoId: equipBomba.id, tipo: "selo_mecanico" } });
    const compBombaMancal       = await compRepo.findOne({ where: { equipamentoId: equipBomba.id, tipo: "mancal" } });
    const compMotorRolamento    = await compRepo.findOne({ where: { equipamentoId: equipMotor.id, tipo: "rolamento" } });
    const compMotorAcoplamento  = await compRepo.findOne({ where: { equipamentoId: equipMotor.id, tipo: "acoplamento" } });
    const compCompressorCorreia = await compRepo.findOne({ where: { equipamentoId: equipCompressor.id, tipo: "correia" } });
    const compCompressorRolam   = await compRepo.findOne({ where: { equipamentoId: equipCompressor.id, tipo: "rolamento" } });
    const compVentRolamento     = equipVentilador ? await compRepo.findOne({ where: { equipamentoId: equipVentilador.id, tipo: "rolamento" } }) : null;
    const compRedutorRolamento  = equipReductor   ? await compRepo.findOne({ where: { equipamentoId: equipReductor.id, tipo: "rolamento" } }) : null;
    const compRedutorRetentor   = equipReductor   ? await compRepo.findOne({ where: { equipamentoId: equipReductor.id, tipo: "retentor" } }) : null;

    /* ── 4. Limpar reportes antigos ──────────────────────────── */

    const existentes = await reporteRepo.count();
    if (existentes > 0) {
      console.log(`🗑️  Removendo ${existentes} reportes existentes para fazer seed limpo...`);
      await reporteRepo.clear();
    }

    /* ── 5. Montar lote ──────────────────────────────────────── */

    const lote: Partial<ReporteSubstituicao>[] = [];

    /* ── PENDENTES ─────────────────────────────────────────── */

    if (compBombaRolamento) {
      lote.push({
        pecaInstalada: "Rolamento SKF 6310 Explorer C3",
        vidaUtilNovaPeca: 28000,
        dataSubstituicao: daysAgo(1),
        motivo: MotivoTroca.PREDITIVA,
        fabricanteNovaPeca: "SKF",
        observacoes:
          "Substituição preventiva por aumento de ruído e vibração detectados na última rota de inspeção preditiva (análise de vibração 4,2 mm/s RMS — limite: 2,8 mm/s).",
        status: StatusReporte.AGUARDANDO_APROVACAO,
        equipamentoId: equipBomba.id,
        componenteId: compBombaRolamento.id,
        tecnicoId: tecnico1.id,
      });
    }

    if (compMotorAcoplamento) {
      lote.push({
        pecaInstalada: "Acoplamento Flexível Falk T10 Série 2024",
        vidaUtilNovaPeca: 40000,
        dataSubstituicao: daysAgo(2),
        motivo: MotivoTroca.DESGASTE_NATURAL,
        fabricanteNovaPeca: "Falk / Rexnord",
        observacoes:
          "Elemento elástico do acoplamento com desgaste severo (trincas a 45°) identificado durante inspeção visual de parada programada de sábado. Substituição realizada imediatamente.",
        status: StatusReporte.AGUARDANDO_APROVACAO,
        equipamentoId: equipMotor.id,
        componenteId: compMotorAcoplamento.id,
        tecnicoId: tecnico2.id,
      });
    }

    if (compCompressorCorreia) {
      lote.push({
        pecaInstalada: "Correia Dentada Gates 3VX900 OEM",
        vidaUtilNovaPeca: 10000,
        dataSubstituicao: daysAgo(3),
        motivo: MotivoTroca.PREVENTIVA,
        fabricanteNovaPeca: "Gates",
        observacoes:
          "Correia original atingiu 90% da vida útil nominal com desgaste nas bordas visível. Substituição preventiva programada conforme PM-CP-012-005.",
        status: StatusReporte.AGUARDANDO_APROVACAO,
        equipamentoId: equipCompressor.id,
        componenteId: compCompressorCorreia.id,
        tecnicoId: tecnico3.id,
      });
    }

    if (compBombaMancal) {
      lote.push({
        pecaInstalada: "Mancal de Deslizamento LA-2 Revisado (SKF)",
        vidaUtilNovaPeca: 30000,
        dataSubstituicao: daysAgo(0),
        motivo: MotivoTroca.CORRETIVA,
        fabricanteNovaPeca: "SKF",
        observacoes:
          "EMERGÊNCIA: Temperatura do mancal atingiu 97 °C durante operação — limite crítico é 85 °C. Substituição emergencial realizada às 03h42. Equipamento retornou à operação às 06h10.",
        status: StatusReporte.AGUARDANDO_APROVACAO,
        equipamentoId: equipBomba.id,
        componenteId: compBombaMancal.id,
        tecnicoId: tecnico1.id,
      });
    }

    if (compVentRolamento && equipVentilador) {
      lote.push({
        pecaInstalada: "Rolamento Timken 23040 MB/C3 W33",
        vidaUtilNovaPeca: 40000,
        dataSubstituicao: daysAgo(4),
        motivo: MotivoTroca.PREVENTIVA,
        fabricanteNovaPeca: "Timken",
        observacoes:
          "Inspeção de lubrificação revelou ressecamento do graxeiro e início de corrosão fretting no anel interno. Troca preventiva realizada durante parada planejada de 2h.",
        status: StatusReporte.AGUARDANDO_APROVACAO,
        equipamentoId: equipVentilador.id,
        componenteId: compVentRolamento.id,
        tecnicoId: tecnico2.id,
      });
    }

    if (compRedutorRetentor && equipReductor) {
      lote.push({
        pecaInstalada: "Retentor de Óleo Viton 180×220×18 (NOK)",
        vidaUtilNovaPeca: 15000,
        dataSubstituicao: daysAgo(5),
        motivo: MotivoTroca.CORRETIVA,
        fabricanteNovaPeca: "NOK",
        observacoes:
          "Vazamento de óleo de caixa detectado na inspeção visual semanal — mancha de 30cm no piso. Retentor substituído durante janela de parada de 4h sem impactar produção.",
        status: StatusReporte.AGUARDANDO_APROVACAO,
        equipamentoId: equipReductor.id,
        componenteId: compRedutorRetentor.id,
        tecnicoId: tecnico3.id,
      });
    }

    /* ── APROVADOS ─────────────────────────────────────────── */

    if (compMotorRolamento) {
      lote.push({
        pecaInstalada: "Rolamento FAG 6208 C3 Alta Performance",
        vidaUtilNovaPeca: 20000,
        dataSubstituicao: daysAgo(10),
        motivo: MotivoTroca.CORRETIVA,
        fabricanteNovaPeca: "FAG / Schaeffler",
        observacoes:
          "Substituição corretiva. Rolamento antigo apresentava travamento leve com rumor característico de pista interna danificada. Análise de vibração confirmou diagnóstico.",
        status: StatusReporte.APROVADO,
        equipamentoId: equipMotor.id,
        componenteId: compMotorRolamento.id,
        tecnicoId: tecnico1.id,
        aprovadorId: gestor.id,
        decididoEm: daysAgo(9),
      });
    }

    if (compBombaSelo) {
      lote.push({
        pecaInstalada: "Selo Mecânico John Crane T1 Standard",
        vidaUtilNovaPeca: 16000,
        dataSubstituicao: daysAgo(20),
        motivo: MotivoTroca.PREVENTIVA,
        fabricanteNovaPeca: "John Crane",
        observacoes:
          "Substituição conforme plano de manutenção preventiva anual. Sem anomalias no componente substituído — desgaste dentro do esperado para o período.",
        status: StatusReporte.APROVADO,
        equipamentoId: equipBomba.id,
        componenteId: compBombaSelo.id,
        tecnicoId: tecnico2.id,
        aprovadorId: gestor.id,
        decididoEm: daysAgo(19),
      });
    }

    if (compCompressorRolam) {
      lote.push({
        pecaInstalada: "Rolamento SKF 22316 EK/C3 + Anel Adaptador H316",
        vidaUtilNovaPeca: 35000,
        dataSubstituicao: daysAgo(30),
        motivo: MotivoTroca.PREDITIVA,
        fabricanteNovaPeca: "SKF",
        observacoes:
          "Rolamento substituído após análise de óleo (ASTM D6595) indicar partículas metálicas Fe > 45 ppm — acima do limite de referência ISO 4406:2021.",
        status: StatusReporte.APROVADO,
        equipamentoId: equipCompressor.id,
        componenteId: compCompressorRolam.id,
        tecnicoId: tecnico3.id,
        aprovadorId: gestor.id,
        decididoEm: daysAgo(29),
      });
    }

    if (compMotorAcoplamento) {
      lote.push({
        pecaInstalada: "Acoplamento Elastomérico Rexnord Omega E70",
        vidaUtilNovaPeca: 35000,
        dataSubstituicao: daysAgo(45),
        motivo: MotivoTroca.PREVENTIVA,
        fabricanteNovaPeca: "Rexnord",
        observacoes:
          "Elemento elástico com trincas superficiais a 120° detectadas na inspeção com luz UV. Substituição preventiva aprovada conforme plano PM anual — procedimento PM-ME-003-002.",
        status: StatusReporte.APROVADO,
        equipamentoId: equipMotor.id,
        componenteId: compMotorAcoplamento.id,
        tecnicoId: tecnico1.id,
        aprovadorId: gestor.id,
        decididoEm: daysAgo(44),
      });
    }

    if (compRedutorRolamento && equipReductor) {
      lote.push({
        pecaInstalada: "Rolamento SKF 24060 CCK30/W33 + Luva H3060",
        vidaUtilNovaPeca: 50000,
        dataSubstituicao: daysAgo(60),
        motivo: MotivoTroca.DESGASTE_NATURAL,
        fabricanteNovaPeca: "SKF",
        observacoes:
          "Substituição realizada durante grande parada anual do moinho. Rolamento com 44.500h — substituído por vida útil atingida (90%) conforme cronograma OEM Siemens Flender.",
        status: StatusReporte.APROVADO,
        equipamentoId: equipReductor.id,
        componenteId: compRedutorRolamento.id,
        tecnicoId: tecnico2.id,
        aprovadorId: gestor.id,
        decididoEm: daysAgo(59),
      });
    }

    /* ── REJEITADOS ────────────────────────────────────────── */

    if (compCompressorCorreia) {
      lote.push({
        pecaInstalada: "Correia Gates 3VX Paralela (alternativa não-OEM)",
        vidaUtilNovaPeca: 5000,
        dataSubstituicao: daysAgo(15),
        motivo: MotivoTroca.CORRETIVA,
        fabricanteNovaPeca: "Gates (alternativa)",
        observacoes:
          "Correia trocada por modelo temporário alternativo devido à falta do item original em estoque. Aguardando validação do gestor para regularização.",
        status: StatusReporte.REJEITADO,
        motivoRejeicao:
          "Não é permitida a instalação de correias paralelas sem certificação OEM para este compressor crítico. Solicitar reposição ao fornecedor Atlas Copco e reabrir OS com peça correta (Gates 3VX900 OEM).",
        equipamentoId: equipCompressor.id,
        componenteId: compCompressorCorreia.id,
        tecnicoId: tecnico3.id,
        aprovadorId: gestor.id,
        decididoEm: daysAgo(14),
      });
    }

    if (compBombaRolamento) {
      lote.push({
        pecaInstalada: "Rolamento Genérico 6310 (sem marca certificada)",
        vidaUtilNovaPeca: 10000,
        dataSubstituicao: daysAgo(25),
        motivo: MotivoTroca.CORRETIVA,
        fabricanteNovaPeca: "Genérico",
        observacoes:
          "Rolamento de marca genérica instalado em caráter emergencial após ruptura inesperada às 22h. Vida útil informada pelo fornecedor de peças avulsas.",
        status: StatusReporte.REJEITADO,
        motivoRejeicao:
          "Política PCM-MAT-003 exige rolamentos de fabricantes homologados (SKF, FAG ou Timken) para equipamentos críticos como BC-001. Substituir imediatamente pelo SKF 6310 Explorer C3 e emitir novo reporte.",
        equipamentoId: equipBomba.id,
        componenteId: compBombaRolamento.id,
        tecnicoId: tecnico2.id,
        aprovadorId: gestor.id,
        decididoEm: daysAgo(24),
      });
    }

    if (compMotorRolamento) {
      lote.push({
        pecaInstalada: "Rolamento NSK 6208 ZZ (importação direta)",
        vidaUtilNovaPeca: 22000,
        dataSubstituicao: daysAgo(50),
        motivo: MotivoTroca.CORRETIVA,
        fabricanteNovaPeca: "NSK",
        observacoes:
          "Rolamento NSK utilizado pois o FAG estava em falta no almoxarifado. Qualidade equivalente segundo especificação técnica do fabricante NSK.",
        status: StatusReporte.REJEITADO,
        motivoRejeicao:
          "Reporte recusado por documentação incompleta — faltam: (1) fotos da peça substituída, (2) número do lote do componente instalado e (3) assinatura do supervisor no formulário de controle de qualidade. Reenviar conforme procedimento PCM-07.",
        equipamentoId: equipMotor.id,
        componenteId: compMotorRolamento.id,
        tecnicoId: tecnico1.id,
        aprovadorId: gestor.id,
        decididoEm: daysAgo(49),
      });
    }

    /* ── 6. Persistir ────────────────────────────────────────── */

    console.log(`📋 Inserindo ${lote.length} reportes de substituição...\n`);

    for (const dados of lote) {
      const reporte = reporteRepo.create(dados);
      await reporteRepo.save(reporte);

      const icon = {
        [StatusReporte.AGUARDANDO_APROVACAO]: "🟡",
        [StatusReporte.APROVADO]:             "✅",
        [StatusReporte.REJEITADO]:            "❌",
      }[dados.status!];

      console.log(`  ${icon} [${dados.status}] ${dados.pecaInstalada}`);
    }

    const pendentes  = lote.filter(r => r.status === StatusReporte.AGUARDANDO_APROVACAO).length;
    const aprovados  = lote.filter(r => r.status === StatusReporte.APROVADO).length;
    const rejeitados = lote.filter(r => r.status === StatusReporte.REJEITADO).length;

    console.log(`\n✅ Seed de aprovações concluído!`);
    console.log(`   🟡 Pendentes:  ${pendentes}`);
    console.log(`   ✅ Aprovados:  ${aprovados}`);
    console.log(`   ❌ Rejeitados: ${rejeitados}`);
    console.log(`\n🔑 Credenciais de teste:`);
    console.log(`   Técnicos: tecnico/tecnico@123 · tecnico2/tecnico@123 · tecnico3/tecnico@123`);
    console.log(`   Gestor:   gestor/gestor@123`);
    console.log(`   Admin:    admin/admin@123`);

  } catch (error) {
    console.error("\n❌ Erro durante o seed:", error);
    throw error;
  } finally {
    await AppDataSource.destroy();
    console.log("\n🔌 Conexão encerrada.");
  }
}

seedAprovacoes();
