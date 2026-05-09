/**
 * Service: Autenticação (Auth)
 *
 * Contém as regras de negócio do módulo de autenticação:
 * - Validação de credenciais (username + senha)
 * - Geração de token JWT para sessão autenticada
 * - Registro de novos usuários (com hash de senha)
 *
 * No contexto de PCM, a autenticação garante que apenas
 * usuários autorizados (Admin, Gestor, Técnico) acessem
 * as funcionalidades correspondentes ao seu nível de acesso.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { UserRepository } from "../repositories/user.repository";
import { User, NivelUsuario } from "../entities/user.entity";

/**
 * Interface de retorno do login bem-sucedido.
 * Contém o token JWT e os dados do usuário (sem a senha).
 */
interface LoginResult {
  token: string;
  usuario: {
    id: string;
    nomeUsuario: string;
    nome: string;
    nivel: NivelUsuario;
  };
}

/**
 * Interface de dados para criação de um novo usuário.
 */
interface CreateUserData {
  nomeUsuario: string;
  senha: string;
  nome: string;
  nivel?: NivelUsuario;
}

/**
 * Realiza a autenticação de um usuário no sistema.
 *
 * Fluxo:
 * 1. Busca o usuário pelo nome de login (incluindo a senha hashada)
 * 2. Compara a senha informada com o hash armazenado usando bcrypt
 * 3. Se válido, gera um token JWT com os dados do usuário
 * 4. Retorna o token + dados públicos do usuário
 *
 * @param nomeUsuario - Nome de login informado pelo usuário
 * @param senha - Senha em texto puro para verificação
 * @returns Objeto com token JWT e dados do usuário
 * @throws Error se as credenciais forem inválidas
 */
export async function loginService(
  nomeUsuario: string,
  senha: string
): Promise<LoginResult> {
  /* 1. Busca o usuário no banco (incluindo o campo senha) */
  const user = await UserRepository.findByNomeUsuarioComSenha(nomeUsuario);

  if (!user) {
    throw new Error("Usuário ou senha inválidos.");
  }

  /* 2. Compara a senha informada com o hash bcrypt armazenado */
  const senhaValida = await bcrypt.compare(senha, user.senha);

  if (!senhaValida) {
    throw new Error("Usuário ou senha inválidos.");
  }

  /* 3. Gera o token JWT contendo o ID, username e nível de acesso */
  const token = jwt.sign(
    {
      id: user.id,
      nomeUsuario: user.nomeUsuario,
      nivel: user.nivel,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );

  /* 4. Retorna o token e os dados públicos do usuário (sem senha) */
  return {
    token,
    usuario: {
      id: user.id,
      nomeUsuario: user.nomeUsuario,
      nome: user.nome,
      nivel: user.nivel,
    },
  };
}

/**
 * Cria um novo usuário no sistema.
 *
 * Valida se o nome de usuário já existe antes de criar.
 * A senha é automaticamente hashada pelo hook @BeforeInsert
 * da entidade User.
 *
 * @param data - Dados do novo usuário
 * @returns O usuário criado (sem a senha)
 * @throws Error se o nome de usuário já estiver em uso
 */
export async function createUserService(data: CreateUserData): Promise<User> {
  /* Verifica se já existe um usuário com este nome de login */
  const existente = await UserRepository.findByNomeUsuario(data.nomeUsuario);

  if (existente) {
    throw new Error("Este nome de usuário já está em uso.");
  }

  /* Cria a instância da entidade e salva no banco */
  const user = UserRepository.create({
    nomeUsuario: data.nomeUsuario,
    senha: data.senha,
    nome: data.nome,
    nivel: data.nivel ?? NivelUsuario.TECNICO,
  });

  return UserRepository.save(user);
}

/**
 * Lista todos os usuários do sistema (sem as senhas).
 *
 * Utilizado pelo painel administrativo para gestão de acessos.
 * Apenas administradores devem ter acesso a esta funcionalidade.
 *
 * @returns Array com todos os usuários cadastrados
 */
export async function listUsersService(): Promise<User[]> {
  return UserRepository.find({
    order: { criadoEm: "DESC" },
  });
}
