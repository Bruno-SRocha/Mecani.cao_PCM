/**
 * Controller: Autenticação (Auth)
 *
 * Handlers HTTP para as rotas de autenticação e gestão de usuários.
 * Responsável por receber as requisições, validar os inputs,
 * chamar os services adequados e retornar as respostas HTTP.
 *
 * Segue o padrão:
 *   Route → Controller → Service → Repository → Banco
 */

import { Request, Response } from "express";
import {
  loginService,
  createUserService,
  listUsersService,
  updateUserService,
  deleteUserService,
  changePasswordService,
  requestPasswordResetService,
  resetPasswordService,
} from "../services/auth.service";

/**
 * POST /api/auth/login
 *
 * Autentica um usuário com nome de usuário e senha.
 * Retorna o token JWT e os dados do usuário logado.
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
 * Restrito a administradores (middleware de auth).
 */
export async function registerController(req: Request, res: Response): Promise<void> {
  try {
    const { nomeUsuario, nome, email, nivel } = req.body;

    /* Validação de campos obrigatórios */
    if (!nomeUsuario || !nome || !email) {
      res.status(400).json({
        error: "Campos obrigatórios: nomeUsuario, nome, email.",
      });
      return;
    }

    const administradorNome = req.userNomeUsuario || "Admin";

    /* Chama o service de criação de usuário */
    const { user, senhaGerada } = await createUserService({
      nomeUsuario,
      nome,
      email,
      nivel,
      criadoPor: administradorNome,
    });

    /* Retorna 201 Created com os dados do usuário (sem senha) e a senha gerada */
    res.status(201).json({
      id: user.id,
      nomeUsuario: user.nomeUsuario,
      nome: user.nome,
      email: user.email,
      nivel: user.nivel,
      primeiroAcesso: user.primeiroAcesso,
      criadoPor: user.criadoPor,
      criadoEm: user.criadoEm,
      senhaGerada, // Retornada temporariamente para exibição na interface do Admin
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar usuário.";
    const statusCode = message.includes("já está em uso") ? 409 : 400;

    res.status(statusCode).json({ error: message });
  }
}

/**
 * GET /api/auth/users
 *
 * Lista todos os usuários do sistema (sem senhas).
 * Restrito a administradores (middleware de auth/autorização).
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

/**
 * PUT /api/auth/users/:id
 *
 * Atualiza um usuário existente.
 * Restrito a administradores (middleware de auth/autorização).
 */
export async function updateUserController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { nome, email, nivel } = req.body;

    if (!nome || !email || !nivel) {
      res.status(400).json({ error: "Campos obrigatórios: nome, email, nivel." });
      return;
    }

    const user = await updateUserService(id as string, { nome, email, nivel });

    res.status(200).json({
      id: user.id,
      nomeUsuario: user.nomeUsuario,
      nome: user.nome,
      email: user.email,
      nivel: user.nivel,
      primeiroAcesso: user.primeiroAcesso,
      criadoPor: user.criadoPor,
      criadoEm: user.criadoEm,
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Erro ao atualizar usuário.",
    });
  }
}

/**
 * DELETE /api/auth/users/:id
 *
 * Exclui um usuário do sistema.
 * Restrito a administradores (middleware de auth/autorização).
 */
export async function deleteUserController(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await deleteUserService(id as string);
    res.status(200).json({ message: "Usuário excluído com sucesso." });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Erro ao excluir usuário.",
    });
  }
}

/**
 * POST /api/auth/change-password
 *
 * Altera a senha do usuário autenticado no primeiro acesso (ou qualquer momento).
 */
export async function changePasswordController(req: Request, res: Response): Promise<void> {
  try {
    const { senhaAtual, novaSenha } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({ error: "Usuário não autenticado." });
      return;
    }

    if (!senhaAtual || !novaSenha) {
      res.status(400).json({ error: "Informe a senha atual e a nova senha." });
      return;
    }

    await changePasswordService(userId, senhaAtual, novaSenha);
    res.status(200).json({ message: "Senha alterada com sucesso." });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Erro ao alterar senha.",
    });
  }
}

/**
 * POST /api/auth/request-password-reset
 *
 * Solicita o e-mail de recuperação de senha.
 */
export async function requestPasswordResetController(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: "Informe o e-mail corporativo." });
      return;
    }

    await requestPasswordResetService(email);

    res.status(200).json({
      message: "Se o e-mail existir em nossa base, você receberá as instruções em breve.",
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Erro ao processar solicitação.",
    });
  }
}

/**
 * POST /api/auth/reset-password
 *
 * Efetivamente redefine a senha utilizando o token de segurança.
 */
export async function resetPasswordController(req: Request, res: Response): Promise<void> {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      res.status(400).json({ error: "Informe o token de segurança e a nova senha." });
      return;
    }

    await resetPasswordService(token, novaSenha);

    res.status(200).json({ message: "Senha redefinida com sucesso." });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Erro ao redefinir a senha.",
    });
  }
}
