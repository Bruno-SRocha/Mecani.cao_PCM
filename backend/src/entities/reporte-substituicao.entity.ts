/**
 * Entidade: Reporte de Substituição de Componente
 *
 * Registra quando um técnico de campo troca um componente mecânico
 * em um equipamento. O reporte entra em uma fila de aprovação e
 * permanece com status "AGUARDANDO_APROVACAO" até que um gestor
 * ou admin aprove ou rejeite.
 *
 * Fluxo:
 *   Técnico cria reporte → AGUARDANDO_APROVACAO
 *   Gestor/Admin aprova → APROVADO (componente é atualizado)
 *   Gestor/Admin rejeita → REJEITADO (componente NÃO é atualizado)
 *
 * Relacionamentos:
 * - N:1 com Componente — o componente que foi substituído
 * - N:1 com Equipamento — o equipamento ao qual pertence o componente
 * - N:1 com User (tecnico) — quem criou o reporte
 * - N:1 com User (aprovador) — quem aprovou/rejeitou (nullable)
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from "typeorm";
import { Componente } from "./componente.entity";
import { Equipamento } from "./equipamento.entity";
import { User } from "./user.entity";

/**
 * Status possíveis de um reporte de substituição.
 */
export enum StatusReporte {
  AGUARDANDO_APROVACAO = "AGUARDANDO_APROVACAO",
  APROVADO = "APROVADO",
  REJEITADO = "REJEITADO",
}

@Entity("reportes_substituicao")
export class ReporteSubstituicao {
  /**
   * Identificador único do reporte (UUID v4).
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * Nome da peça nova instalada.
   * Exemplo: "Rolamento SKF 6205 novo", "Selo Mecânico T1 substituto"
   */
  @Column({ length: 200 })
  pecaInstalada: string;

  /**
   * Vida útil nominal da nova peça instalada (em horas).
   * Será aplicada ao componente quando o reporte for aprovado.
   */
  @Column("float")
  vidaUtilNovaPeca: number;

  /**
   * Data em que a substituição física foi realizada.
   */
  @Column({ type: "date" })
  dataSubstituicao: Date;

  /**
   * Observações livres do técnico sobre a substituição.
   */
  @Column({ type: "text", nullable: true })
  observacoes: string;

  /**
   * Status atual do reporte no fluxo de aprovação.
   */
  @Column({
    type: "enum",
    enum: StatusReporte,
    default: StatusReporte.AGUARDANDO_APROVACAO,
  })
  status: StatusReporte;

  /**
   * Motivo da rejeição (preenchido apenas quando status = REJEITADO).
   */
  @Column({ type: "text", nullable: true })
  motivoRejeicao: string;

  /* ── Relacionamentos ─────────────────────────────────────── */

  /**
   * Componente que foi substituído.
   */
  @ManyToOne(() => Componente, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "componenteId" })
  componente: Componente;

  @Column({ type: "varchar" })
  componenteId: string;

  /**
   * Equipamento ao qual o componente pertence.
   */
  @ManyToOne(() => Equipamento, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "equipamentoId" })
  equipamento: Equipamento;

  @Column({ type: "varchar" })
  equipamentoId: string;

  /**
   * Técnico que criou o reporte.
   */
  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true, eager: true })
  @JoinColumn({ name: "tecnicoId" })
  tecnico: User;

  @Column({ type: "varchar", nullable: true })
  tecnicoId: string;

  /**
   * Gestor/Admin que aprovou ou rejeitou o reporte.
   * Preenchido somente após a decisão.
   */
  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true, eager: true })
  @JoinColumn({ name: "aprovadorId" })
  aprovador: User;

  @Column({ type: "varchar", nullable: true })
  aprovadorId: string;

  /**
   * Data/hora em que a decisão (aprovação ou rejeição) foi tomada.
   */
  @Column({ type: "datetime", nullable: true })
  decididoEm: Date;

  /**
   * Data de criação do registro (preenchida automaticamente).
   */
  @CreateDateColumn()
  criadoEm: Date;

  /**
   * Data da última atualização do registro (preenchida automaticamente).
   */
  @UpdateDateColumn()
  atualizadoEm: Date;
}
