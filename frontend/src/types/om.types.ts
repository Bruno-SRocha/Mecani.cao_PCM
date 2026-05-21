/**
 * Tipos globais — Módulo de Ordens de Manutenção (OM)
 *
 * Define as interfaces TypeScript para o módulo de OM do sistema
 * Mecâni.cão PCM. Espelha as entidades e enums do back-end.
 */

import type { Equipamento } from "./equipamento.types";
import type { Usuario } from "./usuario.types";

/** Tipos de manutenção possíveis em uma OM */
export type TipoManutencao =
  | "PREVENTIVA"
  | "CORRETIVA_PROGRAMADA"
  | "CORRETIVA_EMERGENCIAL"
  | "PREDITIVA";

/** Prioridades disponíveis — influencia ordenação no backlog */
export type PrioridadeOM = "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";

/** Status do ciclo de vida de uma OM */
export type StatusOM =
  | "ABERTA"
  | "AGUARDANDO_INICIO"
  | "EM_EXECUCAO"
  | "PAUSADA"
  | "CONCLUIDA"
  | "CANCELADA";

/**
 * Representa uma Ordem de Manutenção completa retornada pela API.
 */
export interface OrdemManutencao {
  id: string;
  codigo: string;
  descricao: string;
  tipo: TipoManutencao;
  prioridade: PrioridadeOM;
  status: StatusOM;
  dataInicioPrevisto: string | null;
  materiaisNecessarios: string[];
  anexos: string[];
  observacoes: string | null;
  equipamento: Equipamento;
  solicitante: Usuario;
  tecnicos: Usuario[];
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * DTO para criação de uma nova OM (enviado no body do POST).
 */
export interface CreateOMRequest {
  equipamentoId: string;
  descricao: string;
  tipo: TipoManutencao;
  prioridade?: PrioridadeOM;
  dataInicioPrevisto?: string; // ISO datetime string
  tecnicoIds: string[];
  materiaisNecessarios?: string[];
  observacoes?: string;
}

/**
 * DTO para atualização de uma OM existente (enviado no PUT).
 */
export interface UpdateOMRequest {
  descricao?: string;
  tipo?: TipoManutencao;
  prioridade?: PrioridadeOM;
  status?: StatusOM;
  dataInicioPrevisto?: string;
  tecnicoIds?: string[];
  materiaisNecessarios?: string[];
  observacoes?: string;
}

/**
 * Labels amigáveis para os tipos de manutenção.
 */
export const TIPO_MANUTENCAO_LABELS: Record<TipoManutencao, string> = {
  PREVENTIVA: "Preventiva",
  CORRETIVA_PROGRAMADA: "Corretiva Programada",
  CORRETIVA_EMERGENCIAL: "Corretiva Emergencial",
  PREDITIVA: "Preditiva",
};

/**
 * Labels amigáveis para as prioridades.
 */
export const PRIORIDADE_LABELS: Record<PrioridadeOM, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

/**
 * Labels amigáveis para os status.
 */
export const STATUS_OM_LABELS: Record<StatusOM, string> = {
  ABERTA: "Aberta",
  AGUARDANDO_INICIO: "Aguardando Início",
  EM_EXECUCAO: "Em Execução",
  PAUSADA: "Pausada",
  CONCLUIDA: "Concluída",
  CANCELADA: "Cancelada",
};

/**
 * Cores associadas a cada status (para badges/indicadores visuais).
 */
export const STATUS_OM_COLORS: Record<StatusOM, string> = {
  ABERTA: "#22A0B4",
  AGUARDANDO_INICIO: "#FBBF24",
  EM_EXECUCAO: "#4ADE80",
  PAUSADA: "#94A3B8",
  CONCLUIDA: "#4ADE80",
  CANCELADA: "#F87171",
};

/**
 * Cores associadas a cada prioridade.
 */
export const PRIORIDADE_COLORS: Record<PrioridadeOM, string> = {
  BAIXA: "#4ADE80",
  MEDIA: "#FBBF24",
  ALTA: "#F97316",
  CRITICA: "#F87171",
};
