/**
 * Repository: Usuário
 *
 * Centraliza todas as queries ao banco de dados relacionadas à
 * entidade Usuário. Os Services devem usar este repository ao
 * invés de acessar o banco diretamente, mantendo a separação
 * de responsabilidades (padrão Repository do TypeORM).
 *
 * O repository estende o repositório padrão do TypeORM com
 * métodos customizados específicos do domínio PCM.
 */

import { AppDataSource } from "../config/database";
import { User } from "../entities/user.entity";

/**
 * Repository customizado de Usuário.
 *
 * Além dos métodos CRUD padrão (find, save, delete, etc),
 * inclui métodos específicos para o fluxo de autenticação.
 */
export const UserRepository = AppDataSource.getRepository(User).extend({
  /**
   * Busca um usuário pelo nome de login incluindo o campo senha.
   *
   * Por padrão, a coluna 'senha' é excluída das queries (select: false
   * na entidade). Este método força o carregamento da senha para
   * ser usada apenas no fluxo de autenticação (login).
   *
   * @param nomeUsuario - Nome de login do usuário
   * @returns O usuário encontrado (com senha) ou null
   */
  async findByNomeUsuarioComSenha(nomeUsuario: string): Promise<User | null> {
    return this.createQueryBuilder("user")
      .addSelect("user.senha") // Inclui a senha que é select: false
      .where("user.nomeUsuario = :nomeUsuario", { nomeUsuario })
      .getOne();
  },

  /**
   * Busca um usuário pelo nome de login (sem senha).
   *
   * Utilizado para validações como verificar duplicidade
   * de username durante o cadastro de novos usuários.
   *
   * @param nomeUsuario - Nome de login a verificar
   * @returns O usuário encontrado (sem senha) ou null
   */
  async findByNomeUsuario(nomeUsuario: string): Promise<User | null> {
    return this.findOne({ where: { nomeUsuario } });
  },
});
