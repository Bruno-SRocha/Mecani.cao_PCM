/**
 * Seed: Equipamentos e Componentes de Demonstração
 *
 * Popula o banco de dados com equipamentos industriais realistas
 * e seus componentes mecânicos para demonstração do sistema.
 *
 * Os dados simulam uma planta industrial típica com:
 * - Bombas centrífugas com rolamentos, selos e mancais
 * - Motores elétricos com rolamentos e acoplamentos
 * - Compressores com válvulas, pistões e correias
 * - Ventiladores industriais com hélices e rolamentos
 *
 * Componentes possuem diferentes níveis de desgaste para
 * demonstrar os indicadores visuais e alertas do sistema.
 *
 * Se os equipamentos já existirem (verificado pela TAG),
 * o seed é ignorado, garantindo idempotência.
 */

import { EquipamentoRepository } from "../repositories/equipamento.repository";
import { AppDataSource } from "../config/database";
import {
  Equipamento,
  StatusEquipamento,
} from "../entities/equipamento.entity";
import { Componente } from "../entities/componente.entity";

/**
 * Dados de seed com equipamentos e seus respectivos componentes.
 * Cada entrada simula um ativo real de uma planta industrial.
 */
const equipamentosSeed = [
  {
    nome: "Bomba Centrífuga KSB Megabloc",
    tag: "BC-001",
    tipo: "Bomba Centrífuga",
    fabricante: "KSB",
    modelo: "Megabloc 65-200",
    localizacao: "Área de Utilidades — Sala de Bombas",
    status: StatusEquipamento.OPERANDO,
    numeroSerie: "KSB-2024-00142",
    dataInstalacao: "2023-03-15",
    descricao:
      "Bomba centrífuga de estágio único para recirculação de água de resfriamento. Vazão nominal 120 m³/h. Potência 45 kW.",
    componentes: [
      {
        nome: "Rolamento SKF 6310",
        tipo: "rolamento",
        vidaUtilNominal: 25000,
        horasOperacionais: 18500,
      },
      {
        nome: "Selo Mecânico John Crane T1",
        tipo: "selo_mecanico",
        vidaUtilNominal: 16000,
        horasOperacionais: 14200,
      },
      {
        nome: "Mancal de Deslizamento LA-2",
        tipo: "mancal",
        vidaUtilNominal: 30000,
        horasOperacionais: 8400,
      },
    ],
  },
  {
    nome: "Motor Elétrico WEG W22 Plus",
    tag: "ME-003",
    tipo: "Motor Elétrico",
    fabricante: "WEG",
    modelo: "W22 Plus 315S/M",
    localizacao: "Linha de Produção 2 — Setor B",
    status: StatusEquipamento.OPERANDO,
    numeroSerie: "WEG-2022-08754",
    dataInstalacao: "2022-06-10",
    descricao:
      "Motor elétrico trifásico de indução, 200 CV, 1780 RPM. Acionamento da esteira transportadora principal.",
    componentes: [
      {
        nome: "Rolamento FAG 6208",
        tipo: "rolamento",
        vidaUtilNominal: 20000,
        horasOperacionais: 5200,
      },
      {
        nome: "Rolamento FAG 6308 (traseiro)",
        tipo: "rolamento",
        vidaUtilNominal: 20000,
        horasOperacionais: 5200,
      },
      {
        nome: "Acoplamento Flexível Falk T10",
        tipo: "acoplamento",
        vidaUtilNominal: 40000,
        horasOperacionais: 12800,
      },
    ],
  },
  {
    nome: "Compressor Atlas Copco GA 55",
    tag: "CP-012",
    tipo: "Compressor",
    fabricante: "Atlas Copco",
    modelo: "GA 55",
    localizacao: "Casa de Compressores — Bloco C",
    status: StatusEquipamento.MANUTENCAO,
    numeroSerie: "AC-2021-19283",
    dataInstalacao: "2021-01-20",
    descricao:
      "Compressor parafuso rotativo com injeção de óleo. Pressão de trabalho 8 bar. Vazão FAD 528 l/s.",
    componentes: [
      {
        nome: "Rolamento SKF 22316",
        tipo: "rolamento",
        vidaUtilNominal: 35000,
        horasOperacionais: 30100,
      },
      {
        nome: "Válvula de Admissão AIV",
        tipo: "valvula",
        vidaUtilNominal: 20000,
        horasOperacionais: 18600,
      },
      {
        nome: "Correia de Transmissão Gates 3VX",
        tipo: "correia",
        vidaUtilNominal: 8000,
        horasOperacionais: 7200,
      },
      {
        nome: "Separador de Óleo Donaldson P-55",
        tipo: "filtro",
        vidaUtilNominal: 4000,
        horasOperacionais: 3500,
      },
    ],
  },
  {
    nome: "Ventilador Axial Howden",
    tag: "VA-007",
    tipo: "Ventilador Industrial",
    fabricante: "Howden",
    modelo: "Axial Joy Series II",
    localizacao: "Torre de Resfriamento — Nível 3",
    status: StatusEquipamento.OPERANDO,
    numeroSerie: "HWD-2023-04561",
    dataInstalacao: "2023-08-05",
    descricao:
      "Ventilador axial para torre de resfriamento. Diâmetro 3.6m, 6 pás em fibra de vidro. Vazão 250.000 m³/h.",
    componentes: [
      {
        nome: "Rolamento Timken 23040",
        tipo: "rolamento",
        vidaUtilNominal: 40000,
        horasOperacionais: 4800,
      },
      {
        nome: "Hélice GFRP 6-pás",
        tipo: "helice",
        vidaUtilNominal: 60000,
        horasOperacionais: 4800,
      },
    ],
  },
  {
    nome: "Redutor Flender SIG",
    tag: "RD-005",
    tipo: "Redutor de Velocidade",
    fabricante: "Siemens Flender",
    modelo: "SIG 300",
    localizacao: "Moagem — Moinho de Bolas 01",
    status: StatusEquipamento.PARADO,
    numeroSerie: "FLD-2020-31456",
    dataInstalacao: "2020-04-12",
    descricao:
      "Redutor industrial de engrenagens helicoidais, relação 1:28. Torque de saída 180 kNm. Acionamento do moinho de bolas.",
    componentes: [
      {
        nome: "Rolamento SKF 24060",
        tipo: "rolamento",
        vidaUtilNominal: 50000,
        horasOperacionais: 44500,
      },
      {
        nome: "Engrenagem Helicoidal Z1",
        tipo: "engrenagem",
        vidaUtilNominal: 80000,
        horasOperacionais: 38000,
      },
      {
        nome: "Retentor de Óleo Viton",
        tipo: "retentor",
        vidaUtilNominal: 15000,
        horasOperacionais: 14200,
      },
    ],
  },
];

/**
 * Popula o banco com equipamentos e componentes de demonstração.
 * Chamado automaticamente durante a inicialização do servidor.
 *
 * Verificação de idempotência: se a TAG já existir, o seed é ignorado.
 */
export async function seedEquipamentos(): Promise<void> {
  /* Verifica se já existem equipamentos cadastrados */
  const count = await EquipamentoRepository.count();

  if (count > 0) {
    console.log(
      `ℹ️  ${count} equipamento(s) já cadastrado(s). Seed de equipamentos ignorado.`
    );
    return;
  }

  /* Obtém o repository de componentes para salvar em lote */
  const componenteRepo = AppDataSource.getRepository(Componente);

  /* Cria cada equipamento com seus componentes */
  for (const seed of equipamentosSeed) {
    const { componentes: componentesSeed, dataInstalacao, ...equipData } = seed;

    /* Cria e salva o equipamento */
    const equipamento = EquipamentoRepository.create({
      ...equipData,
      dataInstalacao: dataInstalacao ? new Date(dataInstalacao) : undefined,
    });
    const saved = await EquipamentoRepository.save(equipamento);

    /* Cria e salva os componentes associados */
    for (const compData of componentesSeed) {
      const componente = componenteRepo.create({
        ...compData,
        equipamentoId: saved.id,
      });
      await componenteRepo.save(componente);
    }
  }

  console.log(
    `✅ ${equipamentosSeed.length} equipamentos de demonstração criados com sucesso.`
  );
}
