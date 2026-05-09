/**
 * Rotas: Autenticação (/api/auth)
 *
 * Define as rotas do módulo de autenticação e gestão de usuários.
 *
 * Rotas públicas (sem autenticação):
 *   POST /api/auth/login    — Login com credenciais
 *
 * Rotas protegidas (requerem token JWT):
 *   POST /api/auth/register — Cadastro de novo usuário
 *   GET  /api/auth/users    — Listagem de todos os usuários
 */

import { Router } from "express";
import {
  loginController,
  registerController,
  listUsersController,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/* ---------------------------------------------------------------
   Rotas públicas — não exigem autenticação
   --------------------------------------------------------------- */

/**
 * POST /api/auth/login
 * Autentica um usuário e retorna token JWT.
 */
router.post("/login", loginController);

/* ---------------------------------------------------------------
   Rotas protegidas — exigem token JWT válido
   --------------------------------------------------------------- */

/**
 * POST /api/auth/register
 * Cria um novo usuário no sistema.
 * Apenas usuários autenticados podem registrar novos usuários.
 */
router.post("/register", authMiddleware, registerController);

/**
 * GET /api/auth/users
 * Lista todos os usuários cadastrados (sem senhas).
 * Apenas usuários autenticados podem acessar esta rota.
 */
router.get("/users", authMiddleware, listUsersController);

export default router;
