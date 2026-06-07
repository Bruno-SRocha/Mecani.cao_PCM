/**
 * Service: Autenticação (Auth)
 *
 * Contém as regras de negócio do módulo de autenticação:
 * - Validação de credenciais (username + senha)
 * - Geração de token JWT para sessão autenticada
 * - Registro de novos usuários (com hash de senha)
 * - CRUD de usuários
 * - Troca de senha
 *
 * No contexto de PCM, a autenticação garante que apenas
 * usuários autorizados (Admin, Gestor, Técnico) acessem
 * as funcionalidades correspondentes ao seu nível de acesso.
 */

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
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
    primeiroAcesso: boolean;
  };
}

/**
 * Interface de dados para criação de um novo usuário.
 */
interface CreateUserData {
  nomeUsuario: string;
  nome: string;
  email: string;
  nivel?: NivelUsuario;
  criadoPor?: string;
}

/**
 * Interface de dados para atualização de um usuário existente.
 */
interface UpdateUserData {
  nome: string;
  email: string;
  nivel: NivelUsuario;
}

/**
 * Gera uma senha aleatória que atende aos padrões de complexidade da empresa:
 * - Mínimo de 12 caracteres
 * - Pelo menos uma letra maiúscula
 * - Pelo menos uma letra minúscula
 * - Pelo menos um número
 * - Pelo menos um caractere especial (símbolo)
 */
function generateComplexPassword(): string {
  const length = 12;
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
  const allChars = uppercase + lowercase + numbers + symbols;

  let password = "";
  // Garante pelo menos um caractere de cada categoria
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Completa a senha até o tamanho desejado
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Embaralha os caracteres da senha gerada
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

/**
 * Simula o envio de um e-mail gravando o arquivo em mock-emails/
 * e exibindo o conteúdo no console do servidor.
 */
function simulateSendEmail(
  nome: string,
  email: string,
  nomeUsuario: string,
  senhaAleatoria: string
): void {
  const dir = path.join(__dirname, "../../mock-emails");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const content = `Para: ${email}
Assunto: Bem-vindo ao Mecâni.cão PCM - Suas Credenciais de Acesso
Data: ${new Date().toLocaleString("pt-BR")}

Olá ${nome},

Sua conta de colaborador foi criada com sucesso no sistema centralizado de controle de manutenção Mecâni.cão PCM!

Aqui estão as suas credenciais de acesso:
---------------------------------------------
Usuário: ${nomeUsuario}
Senha Temporária: ${senhaAleatoria}
Link de Acesso: http://localhost:3000/login
---------------------------------------------

Atenção: Por motivos de segurança, ao realizar o primeiro login com esta senha temporária, você será obrigatoriamente redirecionado para a tela de troca de senha para definir a sua senha pessoal definitiva.

Atenciosamente,
Equipe de TI Mecâni.cão PCM
`;

  const safeUsername = nomeUsuario.replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `email-${safeUsername}-${Date.now()}.txt`;
  fs.writeFileSync(path.join(dir, filename), content, "utf-8");

  console.log("\x1b[32m%s\x1b[0m", `[EMAIL SIMULATOR] E-mail enviado para ${email}:`);
  console.log(content);
}

/**
 * Realiza a autenticação de um usuário no sistema.
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
      primeiroAcesso: user.primeiroAcesso,
    },
  };
}

/**
 * Cria um novo usuário no sistema com senha aleatória complexa.
 */
export async function createUserService(
  data: CreateUserData
): Promise<{ user: User; senhaGerada: string }> {
  /* Valida campos obrigatórios */
  if (!data.nomeUsuario || !data.nome || !data.email) {
    throw new Error("Todos os campos obrigatórios devem ser preenchidos.");
  }

  /* Valida e-mail corporativo (simples regex) */
  if (!data.email.includes("@")) {
    throw new Error("Formato de e-mail corporativo inválido.");
  }

  /* Verifica se já existe um usuário com este nome de login */
  const existenteUsername = await UserRepository.findByNomeUsuario(data.nomeUsuario);
  if (existenteUsername) {
    throw new Error("Este nome de usuário já está em uso.");
  }

  /* Verifica se já existe um usuário com este e-mail */
  const existenteEmail = await UserRepository.findOne({ where: { email: data.email } });
  if (existenteEmail) {
    throw new Error("Este e-mail corporativo já está em uso.");
  }

  /* Gera a senha aleatória complexa */
  const senhaGerada = generateComplexPassword();

  /* Cria a instância da entidade e salva no banco */
  const user = UserRepository.create({
    nomeUsuario: data.nomeUsuario,
    senha: senhaGerada,
    nome: data.nome,
    email: data.email,
    nivel: data.nivel ?? NivelUsuario.TECNICO,
    primeiroAcesso: true,
    criadoPor: data.criadoPor ?? "Admin",
  });

  const savedUser = await UserRepository.save(user);

  /* Simula o envio de e-mail com as credenciais */
  simulateSendEmail(savedUser.nome, savedUser.email, savedUser.nomeUsuario, senhaGerada);

  return { user: savedUser, senhaGerada };
}

/**
 * Atualiza os dados cadastrais de um usuário existente.
 */
export async function updateUserService(
  id: string,
  data: UpdateUserData
): Promise<User> {
  const user = await UserRepository.findOne({ where: { id } });
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  /* Valida e-mail corporativo */
  if (!data.email || !data.email.includes("@")) {
    throw new Error("Formato de e-mail corporativo inválido.");
  }

  /* Verifica se o e-mail já está em uso por outro usuário */
  if (data.email !== user.email) {
    const existenteEmail = await UserRepository.findOne({ where: { email: data.email } });
    if (existenteEmail) {
      throw new Error("Este e-mail corporativo já está em uso.");
    }
  }

  /* Atualiza os campos */
  user.nome = data.nome;
  user.email = data.email;
  user.nivel = data.nivel;

  return UserRepository.save(user);
}

/**
 * Exclui um usuário do sistema (usuários ADMIN não podem ser excluídos).
 */
export async function deleteUserService(id: string): Promise<void> {
  const user = await UserRepository.findOne({ where: { id } });
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  if (user.nivel === NivelUsuario.ADMIN) {
    throw new Error("Usuários com nível de acesso ADMIN não podem ser excluídos.");
  }

  await UserRepository.remove(user);
}

/**
 * Altera a senha de um usuário autenticado e marca primeiroAcesso como false.
 */
export async function changePasswordService(
  userId: string,
  senhaAtual: string,
  novaSenha: string
): Promise<void> {
  /* Busca o usuário com a senha para validação */
  const userBasico = await UserRepository.findOne({ where: { id: userId } });
  if (!userBasico) {
    throw new Error("Usuário não encontrado.");
  }

  const user = await UserRepository.findByNomeUsuarioComSenha(userBasico.nomeUsuario);
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  /* Compara a senha atual informada com a cadastrada */
  const senhaValida = await bcrypt.compare(senhaAtual, user.senha);
  if (!senhaValida) {
    throw new Error("A senha atual informada está incorreta.");
  }

  /* Valida regras de complexidade para a nova senha */
  if (novaSenha.length < 12) {
    throw new Error("A nova senha deve ter no mínimo 12 caracteres.");
  }
  const regexNumero = /[0-9]/;
  const regexSimbolo = /[!@#$%^&*()_+~`|}{[\]:;?><,./-]/;
  if (!regexNumero.test(novaSenha) || !regexSimbolo.test(novaSenha)) {
    throw new Error("A nova senha deve conter números e símbolos (caracteres especiais).");
  }

  /* Criptografa a nova senha e salva */
  const saltRounds = 10;
  user.senha = await bcrypt.hash(novaSenha, saltRounds);
  user.primeiroAcesso = false;

  await UserRepository.save(user);
}

/**
 * Lista todos os usuários do sistema (sem as senhas).
 */
export async function listUsersService(): Promise<User[]> {
  return UserRepository.find({
    order: { criadoEm: "DESC" },
  });
}
