/**
 * Rotas: Autenticação e Gestão de Usuários (/api/auth)
 *
 * Define as rotas do módulo de autenticação e gestão de usuários.
 */

import { Router } from "express";
import {
  loginController,
  registerController,
  listUsersController,
  updateUserController,
  deleteUserController,
  changePasswordController,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

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
   Rotas protegidas para qualquer usuário autenticado
   --------------------------------------------------------------- */

/**
 * POST /api/auth/change-password
 * Altera a senha do próprio usuário logado.
 */
router.post("/change-password", authMiddleware, changePasswordController);

/* ---------------------------------------------------------------
   Rotas restritas — apenas ADMIN
   --------------------------------------------------------------- */

/**
 * GET /api/auth/users
 * Lista todos os usuários cadastrados (sem senhas).
 */
router.get("/users", authMiddleware, authorize("ADMIN"), listUsersController);

/**
 * POST /api/auth/register
 * Cria um novo usuário no sistema com senha aleatória.
 */
router.post("/register", authMiddleware, authorize("ADMIN"), registerController);

/**
 * PUT /api/auth/users/:id
 * Atualiza os dados cadastrais de um usuário.
 */
router.put("/users/:id", authMiddleware, authorize("ADMIN"), updateUserController);

/**
 * DELETE /api/auth/users/:id
 * Remove um usuário do sistema (ADMINs bloqueados no controller).
 */
router.delete("/users/:id", authMiddleware, authorize("ADMIN"), deleteUserController);

export default router;
