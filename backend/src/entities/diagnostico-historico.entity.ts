import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from "typeorm";
import { Diagnostico, SeveridadeDiagnostico } from "./diagnostico.entity";
import { User } from "./user.entity";

@Entity("diagnosticos_historico")
export class DiagnosticoHistorico {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: ["BAIXA", "MEDIA", "ALTA", "CRITICA"],
  })
  severidadeAnterior: SeveridadeDiagnostico;

  @Column({ type: "text" })
  textoAnterior: string;

  @ManyToOne(() => Diagnostico, (diagnostico) => diagnostico.historico, {
    onDelete: "CASCADE",
  })
  diagnostico: Diagnostico;

  @ManyToOne(() => User)
  editor: User;

  @CreateDateColumn()
  dataEdicao: Date;
}
