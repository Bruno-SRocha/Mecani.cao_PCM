import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Equipamento, StatusEquipamento } from "./equipamento.entity";
import { User } from "./user.entity";

/**
 * Entidade: Auditoria de Equipamento
 *
 * Registra o histórico de alterações feitas nos equipamentos,
 * especificamente a mudança de status operacional, registrando
 * qual usuário fez a alteração, quando e o motivo/detalhe.
 */
@Entity("equipamento_auditoria")
export class EquipamentoAuditoria {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  equipamentoId: string;

  @ManyToOne(() => Equipamento, { onDelete: "CASCADE" })
  @JoinColumn({ name: "equipamentoId" })
  equipamento: Equipamento;

  @Column({ type: "varchar", nullable: true })
  usuarioId: string | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", nullable: true, eager: true })
  @JoinColumn({ name: "usuarioId" })
  usuario: User | null;

  @Column({
    type: "enum",
    enum: StatusEquipamento,
  })
  statusAnterior: StatusEquipamento;

  @Column({
    type: "enum",
    enum: StatusEquipamento,
  })
  statusNovo: StatusEquipamento;

  @Column({ type: "varchar", length: 255, nullable: true })
  detalhes: string | null;

  @CreateDateColumn()
  criadoEm: Date;
}
