/**
 * Entidade: Equipamento Industrial
 *
 * Representa uma máquina ou ativo industrial cadastrado no sistema Mecâni.cão PCM.
 * Exemplos: Motor Elétrico, Bomba Centrífuga, Compressor, Ventilador Industrial.
 *
 * No contexto de PCM, o equipamento é o ativo principal monitorado.
 * Cada equipamento possui componentes mecânicos críticos (rolamentos, selos,
 * mancais, correias) que são rastreados individualmente quanto ao desgaste.
 *
 * Relacionamentos:
 * - 1:N com Componente — um equipamento possui vários componentes mecânicos
 *
 * O campo `status` indica a condição operacional atual:
 * - OPERANDO:  Equipamento em funcionamento normal
 * - PARADO:    Equipamento fora de operação (manutenção planejada ou falha)
 * - MANUTENCAO: Equipamento em processo de manutenção ativa
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Componente } from "./componente.entity";
import { Diagnostico } from "./diagnostico.entity";

/**
 * Enum dos estados operacionais possíveis de um equipamento.
 * Corresponde à coluna 'status' na tabela 'equipamentos'.
 */
export enum StatusEquipamento {
  OPERANDO = "OPERANDO",
  PARADO = "PARADO",
  MANUTENCAO = "MANUTENCAO",
}

@Entity("equipamentos") // Nome da tabela no MySQL
export class Equipamento {
  /**
   * Identificador único do equipamento (UUID v4).
   * Gerado automaticamente pelo TypeORM ao criar o registro.
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * Nome descritivo do equipamento.
   * Exemplo: "Bomba Centrífuga BC-001", "Motor Elétrico ME-003"
   */
  @Column({ length: 150 })
  nome: string;

  /**
   * Código identificador (TAG) do equipamento na planta.
   * Segue nomenclatura industrial padrão (único no sistema).
   * Exemplo: "BC-001", "ME-003", "CP-012"
   */
  @Column({ length: 50, unique: true })
  tag: string;

  /**
   * Tipo/categoria do equipamento.
   * Exemplo: "Bomba Centrífuga", "Motor Elétrico", "Compressor"
   */
  @Column({ length: 100 })
  tipo: string;

  /**
   * Fabricante do equipamento.
   * Exemplo: "WEG", "KSB", "Siemens", "ABB"
   */
  @Column({ length: 120 })
  fabricante: string;

  /**
   * Modelo do equipamento (conforme documentação do fabricante).
   * Exemplo: "W22 Plus", "Megabloc", "FLENDER"
   */
  @Column({ length: 120 })
  modelo: string;

  /**
   * Número de série único do fabricante.
   * Usado para rastreabilidade e garantia.
   */
  @Column({ length: 100, nullable: true })
  numeroSerie: string;

  /**
   * Localização física do equipamento na planta industrial.
   * Exemplo: "Área de Utilidades — Sala de Bombas", "Linha 2 — Setor B"
   */
  @Column({ length: 200 })
  localizacao: string;

  /**
   * Status operacional atual do equipamento.
   * Determina a cor do indicador na interface (verde, vermelho, amarelo).
   */
  @Column({
    type: "enum",
    enum: StatusEquipamento,
    default: StatusEquipamento.OPERANDO,
  })
  status: StatusEquipamento;

  /**
   * Data de instalação do equipamento na planta.
   * Usada para calcular o tempo total de operação desde a instalação.
   */
  @Column({ type: "date", nullable: true })
  dataInstalacao: Date;

  /**
   * Descrição detalhada ou observações sobre o equipamento.
   * Campo livre para informações complementares de engenharia.
   */
  @Column({ type: "text", nullable: true })
  descricao: string;

  /**
   * Relacionamento 1:N — um equipamento possui vários componentes mecânicos.
   * Quando o equipamento é carregado, seus componentes podem ser incluídos
   * via eager loading ou join explícito.
   */
  @OneToMany(() => Componente, (componente) => componente.equipamento, {
    cascade: true, // Operações de persistência cascateiam para componentes
  })
  componentes: Componente[];

  @OneToMany(() => Diagnostico, (diagnostico) => diagnostico.equipamento, {
    cascade: true,
  })
  diagnosticos: Diagnostico[];

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
