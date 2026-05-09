/**
 * Entidade: Usuário (User)
 *
 * Representa um usuário do sistema Mecâni.cão PCM.
 * No contexto de PCM, existem 3 perfis de acesso com responsabilidades distintas:
 *
 * - ADMIN:   Administrador do sistema — acesso total a todas as funcionalidades.
 * - GESTOR:  Gestor de manutenção — gerencia equipamentos, visualiza diagnósticos,
 *            aprova ou rejeita reportes de substituição de componentes.
 * - TECNICO: Técnico de campo — registra diagnósticos de inspeção e cria
 *            reportes de substituição de peças mecânicas.
 *
 * A senha é armazenada como hash bcrypt (nunca em texto puro) e o hook
 * @BeforeInsert garante que toda senha seja automaticamente hashada
 * antes de persistir no banco de dados.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from "typeorm";
import bcrypt from "bcryptjs";

/**
 * Enum dos níveis de acesso do sistema.
 * Corresponde à coluna 'nivel' na tabela 'usuarios'.
 */
export enum NivelUsuario {
  ADMIN = "ADMIN",
  GESTOR = "GESTOR",
  TECNICO = "TECNICO",
}

@Entity("usuarios") // Nome da tabela no MySQL
export class User {
  /**
   * Identificador único do usuário (UUID v4).
   * Gerado automaticamente pelo TypeORM ao criar o registro.
   */
  @PrimaryGeneratedColumn("uuid")
  id: string;

  /**
   * Nome de login do usuário (único no sistema).
   * Usado para autenticação junto com a senha.
   * Exemplo: "admin", "gestor", "tecnico01"
   */
  @Column({ length: 50, unique: true })
  nomeUsuario: string;

  /**
   * Senha do usuário armazenada como hash bcrypt.
   * NUNCA é retornada nas respostas da API (select: false).
   */
  @Column({ length: 255, select: false })
  senha: string;

  /**
   * Nome completo do usuário para exibição na interface.
   * Exemplo: "João Silva", "Maria Oliveira"
   */
  @Column({ length: 120 })
  nome: string;

  /**
   * Nível de acesso do usuário no sistema.
   * Determina quais rotas e funcionalidades ele pode acessar.
   */
  @Column({
    type: "enum",
    enum: NivelUsuario,
    default: NivelUsuario.TECNICO,
  })
  nivel: NivelUsuario;

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

  /**
   * Hook executado antes de inserir um novo usuário no banco.
   * Garante que a senha seja automaticamente hashada com bcrypt
   * antes da persistência, evitando armazenamento em texto puro.
   *
   * O salt rounds = 10 oferece um bom equilíbrio entre segurança
   * e performance para o cenário de autenticação do sistema.
   */
  @BeforeInsert()
  async hashSenha(): Promise<void> {
    if (this.senha) {
      const saltRounds = 10;
      this.senha = await bcrypt.hash(this.senha, saltRounds);
    }
  }
}
