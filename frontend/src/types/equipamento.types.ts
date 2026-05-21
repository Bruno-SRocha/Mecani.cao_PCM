/**
 * Tipos globais — Módulo de Equipamentos
 *
 * Define as interfaces TypeScript para o módulo de gestão de
 * equipamentos industriais do sistema Mecâni.cão PCM.
 *
 * No contexto de PCM, um equipamento é o ativo principal monitorado.
 * Cada equipamento possui componentes mecânicos críticos cujo desgaste
 * é rastreado individualmente para gerar alertas preventivos.
 */

/**
 * Status operacional de um equipamento na planta industrial.
 * Determina a cor do indicador visual na interface.
 */
export type StatusEquipamento = "OPERANDO" | "PARADO" | "MANUTENCAO";

/**
 * Interface que representa um componente mecânico de um equipamento.
 * Espelha a entidade Componente do back-end.
 */
export interface Componente {
  id: string;
  nome: string; // Ex: "Rolamento SKF 6310"
  tipo: string; // Ex: "rolamento", "selo_mecanico"
  vidaUtilNominal: number; // Horas de vida útil (fabricante)
  horasOperacionais: number; // Horas acumuladas desde a última troca
  equipamentoId: string; // FK do equipamento pai
  modificado?: boolean; // Tag de modificação de projeto
  criadoEm: string; // ISO date string
  atualizadoEm: string;
}

/**
 * Interface que representa um equipamento industrial.
 * Espelha a entidade Equipamento do back-end.
 */
export interface Equipamento {
  id: string;
  nome: string; // Ex: "Bomba Centrífuga KSB Megabloc"
  tag: string; // TAG industrial única (ex: "BC-001")
  tipo: string; // Ex: "Bomba Centrífuga"
  fabricante: string; // Ex: "KSB"
  modelo: string; // Ex: "Megabloc 65-200"
  numeroSerie: string | null; // Número de série do fabricante
  localizacao: string; // Localização na planta
  status: StatusEquipamento; // Estado operacional
  dataInstalacao: string | null; // ISO date string
  descricao: string | null; // Descrição técnica
  componentes: Componente[]; // Componentes mecânicos associados
  criadoEm: string; // ISO date string
  atualizadoEm: string;
}

/**
 * Payload para criação de um novo equipamento.
 */
export interface CreateEquipamentoRequest {
  nome: string;
  tag: string;
  tipo: string;
  fabricante: string;
  modelo: string;
  localizacao: string;
  numeroSerie?: string;
  status?: StatusEquipamento;
  dataInstalacao?: string;
  descricao?: string;
}

/**
 * Payload para atualização parcial de um equipamento.
 */
export interface UpdateEquipamentoRequest {
  nome?: string;
  tag?: string;
  tipo?: string;
  fabricante?: string;
  modelo?: string;
  localizacao?: string;
  numeroSerie?: string;
  status?: StatusEquipamento;
  dataInstalacao?: string;
  descricao?: string;
}
