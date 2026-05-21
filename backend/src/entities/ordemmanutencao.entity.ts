/**
 * Entidade: Ordem de Manutenção (OM)
 *
 * Representa uma solicitação formal emitida por um Gestor ou Admin
 * para que um ou mais Técnicos executem manutenção em um equipamento.
 *
 * No contexto de PCM, a OM é o documento central que:
 * - Registra o ativo a ser mantido (relacionamento com Equipamento)
 * - Define o tipo e prioridade da intervenção
 * - Designa o(s) técnico(s) responsável(is)
 * - Rastreia o status desde "Aberta" até "Concluída"
 *
 * Regras de negócio:
 * - Status inicial: ABERTA
 * - ID gerado automaticamente no formato OM-YYYY-NNN
 * - Apenas GESTOR e ADMIN podem criar/editar OMs
 * - Técnicos podem visualizar e atualizar o status das OMs atribuídas a eles
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Equipamento } from "./equipamento.entity";
import { User } from "./user.entity";

/**
 * Tipos de manutenção possíveis em uma OM.
 * Segue a nomenclatura padrão de PCM.
 */
export enum TipoManutencao {
  PREVENTIVA = "PREVENTIVA",
  CORRETIVA_PROGRAMADA = "CORRETIVA_PROGRAMADA",
  CORRETIVA_EMERGENCIAL = "CORRETIVA_EMERGENCIAL",
  PREDITIVA = "PREDITIVA",
}

/**
 * Níveis de prioridade da OM.
 * Influencia a ordenação no backlog do técnico.
 */
export enum PrioridadeOM {
  BAIXA = "BAIXA",
  MEDIA = "MEDIA",
  ALTA = "ALTA",
  CRITICA = "CRITICA",
}

/**
 * Status do ciclo de vida da OM.
 */
export enum StatusOM {
  ABERTA = "ABERTA",
  AGUARDANDO_INICIO = "AGUARDANDO_INICIO",
  EM_EXECUCAO = "EM_EXECUCAO",
  PAUSADA = "PAUSADA",
  CONCLUIDA = "CONCLUIDA",
  CANCELADA = "CANCELADA",
}

@Entity("ordens_manutencao")
export class OrdemManutencao {
  /**
   * Identificador interno UUID (chave primária do banco).
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * Código legível da OM exibido na interface.
   * Formato: OM-YYYY-NNN (ex: OM-2024-001).
   * Gerado automaticamente pelo service ao criar a OM.
   */
  @Column({ length: 20, unique: true })
  codigo: string;

  /**
   * Descrição detalhada do problema ou da intervenção necessária.
   * Campo obrigatório — o técnico precisa entender o escopo do trabalho.
   */
  @Column({ type: "text" })
  descricao: string;

  /**
   * Tipo da manutenção a ser executada.
   * Preventiva, Corretiva (Programada/Emergencial) ou Preditiva.
   */
  @Column({
    type: "enum",
    enum: TipoManutencao,
  })
  tipo: TipoManutencao;

  /**
   * Prioridade da OM — ordena o backlog do técnico.
   * CRITICA: intervenção imediata. BAIXA: pode aguardar.
   */
  @Column({
    type: "enum",
    enum: PrioridadeOM,
    default: PrioridadeOM.MEDIA,
  })
  prioridade: PrioridadeOM;

  /**
   * Status atual do ciclo de vida da OM.
   * Toda nova OM inicia como ABERTA.
   */
  @Column({
    type: "enum",
    enum: StatusOM,
    default: StatusOM.ABERTA,
  })
  status: StatusOM;

  /**
   * Data e hora previstas para o início da execução.
   */
  @Column({ type: "datetime", nullable: true })
  dataInicioPrevisto: Date;

  /**
   * Lista de materiais necessários para a execução (peças, lubrificantes, etc).
   * Armazenado como JSON array de strings.
   */
  @Column({ type: "json", nullable: true })
  materiaisNecessarios: string[];

  /**
   * URLs dos anexos (fotos da falha, manuais, PDFs).
   * Armazenado como JSON array de strings.
   * Em produção, armazenar os arquivos em object storage (S3, GCS).
   */
  @Column({ type: "json", nullable: true })
  anexos: string[];

  /**
   * Observações adicionais do gestor ao criar a OM.
   */
  @Column({ type: "text", nullable: true })
  observacoes: string;

  /* ---------------------------------------------------------------
     Relacionamentos
     --------------------------------------------------------------- */

  /**
   * Equipamento alvo da manutenção.
   * N:1 — muitas OMs podem ser criadas para o mesmo equipamento.
   */
  @ManyToOne(() => Equipamento, { eager: true, nullable: false, onDelete: "CASCADE" })
  equipamento: Equipamento;

  /**
   * Gestor ou Admin que abriu a OM.
   */
  @ManyToOne(() => User, { eager: true, nullable: false })
  solicitante: User;

  /**
   * Técnicos designados para executar a OM.
   * N:M — uma OM pode ter vários técnicos, um técnico pode ter várias OMs.
   */
  @ManyToMany(() => User, { eager: true })
  @JoinTable({
    name: "om_tecnicos",
    joinColumn: { name: "om_id" },
    inverseJoinColumn: { name: "tecnico_id" },
  })
  tecnicos: User[];

  /* ---------------------------------------------------------------
     Timestamps automáticos
     --------------------------------------------------------------- */

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
