/**
 * Entidade: Componente Mecânico
 *
 * Representa uma peça crítica de um equipamento industrial no sistema Mecâni.cão PCM.
 * Exemplos: Rolamento SKF 6205, Selo Mecânico John Crane T1, Mancal de Deslizamento.
 *
 * No contexto de PCM, cada componente é monitorado individualmente quanto ao desgaste.
 * O cálculo de desgaste é a base do sistema de alertas preventivos:
 *
 *   desgaste (%) = (horasOperacionais / vidaUtilNominal) × 100
 *
 * Quando o desgaste atinge ≥ 85%, um alerta preventivo é gerado automaticamente,
 * permitindo que a equipe de manutenção planeje a substituição antes da falha.
 *
 * Relacionamentos:
 * - N:1 com Equipamento — muitos componentes pertencem a um equipamento
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
import { Equipamento } from "./equipamento.entity";

@Entity("componentes") // Nome da tabela no MySQL
export class Componente {
  /**
   * Identificador único do componente (UUID v4).
   * Gerado automaticamente pelo TypeORM ao criar o registro.
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * Nome descritivo do componente mecânico.
   * Exemplo: "Rolamento SKF 6205", "Selo Mecânico T1"
   */
  @Column({ length: 120 })
  nome: string;

  /**
   * Tipo/categoria do componente mecânico.
   * Exemplo: "rolamento", "selo_mecanico", "mancal", "correia", "acoplamento"
   */
  @Column({ length: 80 })
  tipo: string;

  /**
   * Vida útil nominal definida pelo fabricante (em horas).
   * Base para o cálculo de desgaste percentual do componente.
   * Exemplo: 20000 horas para um rolamento industrial padrão.
   */
  @Column("float")
  vidaUtilNominal: number;

  /**
   * Horas operacionais acumuladas desde a última substituição.
   * Este valor cresce conforme o equipamento opera e é zerado
   * quando o componente é substituído (reset via reporte aprovado).
   */
  @Column("float", { default: 0 })
  horasOperacionais: number;

  /**
   * Relacionamento N:1 — muitos componentes pertencem a um equipamento.
   * Se o equipamento for deletado, seus componentes são removidos em cascata.
   */
  @ManyToOne(() => Equipamento, (equipamento) => equipamento.componentes, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "equipamentoId" })
  equipamento: Equipamento;

  /**
   * FK explícita para o equipamento (facilita queries sem join).
   */
  @Column({ type: "varchar" })
  equipamentoId: string;

  /**
   * Marcador de "Modificado" para indicar que este componente foi alterado
   * do projeto original (e.g. substituição de tecnologia ou adição tardia).
   */
  @Column({ type: "boolean", default: false })
  modificado: boolean;

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
