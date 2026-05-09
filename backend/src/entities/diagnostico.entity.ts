import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Equipamento } from "./equipamento.entity";
import { User } from "./user.entity";
import { DiagnosticoHistorico } from "./diagnostico-historico.entity";

export enum SeveridadeDiagnostico {
  BAIXA = "BAIXA",
  MEDIA = "MEDIA",
  ALTA = "ALTA",
  CRITICA = "CRITICA",
}

@Entity("diagnosticos")
export class Diagnostico {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "date" })
  data: Date;

  @Column({
    type: "enum",
    enum: SeveridadeDiagnostico,
    default: SeveridadeDiagnostico.BAIXA,
  })
  severidade: SeveridadeDiagnostico;

  @Column({ type: "text" })
  texto: string;

  @ManyToOne(() => Equipamento, (equipamento) => equipamento.diagnosticos, {
    onDelete: "CASCADE",
  })
  equipamento: Equipamento;

  @ManyToOne(() => User)
  autor: User;

  @OneToMany(() => DiagnosticoHistorico, (historico) => historico.diagnostico, {
    cascade: true,
  })
  historico: DiagnosticoHistorico[];

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
