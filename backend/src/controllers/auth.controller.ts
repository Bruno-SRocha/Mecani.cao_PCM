/**
 * Controller: Autenticação (Auth)
 *
 * Handlers HTTP para as rotas de autenticação.
 * Responsável por receber as requisições, validar os inputs,
 * chamar os services adequados e retornar as respostas HTTP.
 *
 * Segue o padrão:
 *   Route → Controller → Service → Repository → Banco
 *
 * Cada handler trata seus próprios erros e retorna status codes
 * HTTP semânticamente corretos.
 */

import { Request, Response } from "express";
import { loginService, createUserService, listUsersService } from "../services/auth.service";

/**
 * POST /api/auth/login
 *
 * Autentica um usuário com nome de usuário e senha.
 * Retorna o token JWT e os dados do usuário logado.
 *
 * Body esperado: { nomeUsuario: string, senha: string }
 * Resposta 200:  { token: string, usuario: { id, nomeUsuario, nome, nivel } }
 * Resposta 400:  { error: string } — campos ausentes
 * Resposta 401:  { error: string } — credenciais inválidas
 */
export async function loginController(req: Request, res: Response): Promise<void> {
  try {
    const { nomeUsuario, senha } = req.body;

    /* Validação de campos obrigatórios */
    if (!nomeUsuario || !senha) {
      res.status(400).json({ error: "Informe o nome de usuário e a senha." });
      return;
    }

    /* Chama o service de autenticação */
    const result = await loginService(nomeUsuario, senha);

    res.status(200).json(result);
  } catch (error) {
    /* Credenciais inválidas retornam 401 Unauthorized */
    res.status(401).json({
      error: error instanceof Error ? error.message : "Erro ao fazer login.",
    });
  }
}

/**
 * POST /api/auth/register
 *
 * Cria um novo usuário no sistema.
 * Normalmente restrito a administradores (middleware de auth).
 *
 * Body esperado: { nomeUsuario: string, senha: string, nome: string, nivel?: string }
 * Resposta 201:  Dados do usuário criado (sem senha)
 * Resposta 400:  { error: string } — validação falhou
 * Resposta 409:  { error: string } — usuário já existe
 */
export async function registerController(req: Request, res: Response): Promise<void> {
  try {
    const { nomeUsuario, senha, nome, nivel } = req.body;

    /* Validação de campos obrigatórios */
    if (!nomeUsuario || !senha || !nome) {
      res.status(400).json({
        error: "Campos obrigatórios: nomeUsuario, senha, nome.",
      });
      return;
    }

    /* Validação de tamanho mínimo da senha */
    if (senha.length < 6) {
      res.status(400).json({
        error: "A senha deve ter no mínimo 6 caracteres.",
      });
      return;
    }

    /* Chama o service de criação de usuário */
    const user = await createUserService({ nomeUsuario, senha, nome, nivel });

    /* Retorna 201 Created com os dados do usuário (sem senha) */
    res.status(201).json({
      id: user.id,
      nomeUsuario: user.nomeUsuario,
      nome: user.nome,
      nivel: user.nivel,
      criadoEm: user.criadoEm,
    });
  } catch (error) {
    /* Username duplicado retorna 409 Conflict */
    const message = error instanceof Error ? error.message : "Erro ao criar usuário.";
    const statusCode = message.includes("já está em uso") ? 409 : 500;

    res.status(statusCode).json({ error: message });
  }
}

/**
 * GET /api/auth/users
 *
 * Lista todos os usuários do sistema (sem senhas).
 * Restrito a administradores (middleware de auth/autorização).
 *
 * Resposta 200: Array de usuários
 */
export async function listUsersController(_req: Request, res: Response): Promise<void> {
  try {
    const users = await listUsersService();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      error: "Erro ao listar usuários.",
      details: error instanceof Error ? error.message : undefined,
    });
  }
}
