import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Equipamento } from "./equipamento.entity";
import { Componente } from "./componente.entity";

export enum TipoModificacao {
  ADICAO = "ADICAO",
  SUBSTITUICAO_TECNOLOGIA = "SUBSTITUICAO_TECNOLOGIA",
  REMOCAO = "REMOCAO",
}

export enum StatusModificacao {
  PENDENTE = "PENDENTE",
  EM_IMPLEMENTACAO = "EM_IMPLEMENTACAO",
  CONCLUIDO = "CONCLUIDO",
}

@Entity("solicitacoes_modificacao")
export class SolicitacaoModificacao {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  equipamentoId: string;

  @ManyToOne(() => Equipamento, { onDelete: "CASCADE", eager: true })
  @JoinColumn({ name: "equipamentoId" })
  equipamento: Equipamento;

  @Column({
    type: "enum",
    enum: TipoModificacao,
  })
  tipoModificacao: TipoModificacao;

  @Column({ type: "text" })
  justificativa: string;

  @Column({ type: "varchar", nullable: true })
  componenteSaidaId: string;

  @ManyToOne(() => Componente, { onDelete: "SET NULL", nullable: true, eager: true })
  @JoinColumn({ name: "componenteSaidaId" })
  componenteSaida: Componente | null;

  @Column({ type: "varchar", nullable: true })
  componenteEntradaId: string;

  @ManyToOne(() => Componente, { onDelete: "SET NULL", nullable: true, eager: true })
  @JoinColumn({ name: "componenteEntradaId" })
  componenteEntrada: Componente | null;

  /* Detalhes do novo componente (usados para criar o componente quando aprovado/finalizado) */
  @Column({ type: "varchar", length: 120, nullable: true })
  novoComponenteNome: string | null;

  @Column({ type: "varchar", length: 80, nullable: true })
  novoComponenteTipo: string | null;

  @Column({ type: "float", nullable: true })
  novoComponenteVidaUtilNominal: number | null;

  @Column({ type: "text", nullable: true })
  parecerEngenharia: string | null;

  @Column({
    type: "enum",
    enum: StatusModificacao,
    default: StatusModificacao.PENDENTE,
  })
  status: StatusModificacao;

  @Column({ type: "datetime", nullable: true })
  dataImplementacao: Date | null;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
