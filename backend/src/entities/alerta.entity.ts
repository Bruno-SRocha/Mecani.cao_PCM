import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from "typeorm";
import { Componente } from "./componente.entity";

@Entity("alertas")
export class Alerta {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  mensagem: string;

  /**
   * Tipo/Severidade do alerta: "Atenção" ou "Crítico"
   */
  @Column({ type: "varchar", length: 50 })
  tipo: string;

  @Column({ type: "boolean", default: false })
  lido: boolean;

  @ManyToOne(() => Componente, { onDelete: "CASCADE" })
  @JoinColumn({ name: "componenteId" })
  componente: Componente;

  @Column({ type: "varchar" })
  componenteId: string;

  @CreateDateColumn()
  criadoEm: Date;
}
