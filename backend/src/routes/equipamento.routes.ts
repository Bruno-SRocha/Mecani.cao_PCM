/**
 * Rotas: Equipamentos (/api/equipamentos)
 *
 * Define as rotas do módulo de gestão de equipamentos industriais.
 * Todas as rotas exigem autenticação JWT (authMiddleware).
 *
 * Controle de acesso por nível:
 * - GET (leitura): Todos os perfis autenticados (ADMIN, GESTOR, TECNICO)
 * - POST/PUT/DELETE (escrita): Apenas ADMIN e GESTOR
 *
 * No contexto de PCM, técnicos podem visualizar equipamentos para
 * registrar diagnósticos e reportes, mas não podem alterar o cadastro.
 *
 * Rotas:
 *   GET    /api/equipamentos       — Lista todos os equipamentos
 *   GET    /api/equipamentos/:id   — Detalhes de um equipamento + componentes
 *   POST   /api/equipamentos       — Cria novo equipamento (ADMIN/GESTOR)
 *   PUT    /api/equipamentos/:id   — Atualiza equipamento (ADMIN/GESTOR)
 *   DELETE /api/equipamentos/:id   — Remove equipamento (ADMIN/GESTOR)
 */

import { Router } from "express";
import {
  listEquipamentosController,
  getEquipamentoController,
  createEquipamentoController,
  updateEquipamentoController,
  deleteEquipamentoController,
} from "../controllers/equipamento.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

const router = Router();

/* ---------------------------------------------------------------
   Todas as rotas de equipamentos exigem autenticação
   --------------------------------------------------------------- */
router.use(authMiddleware);

/* ---------------------------------------------------------------
   Rotas de leitura — acessíveis por todos os perfis autenticados
   (ADMIN, GESTOR, TECNICO)
   --------------------------------------------------------------- */

/**
 * GET /api/equipamentos
 * Lista todos os equipamentos cadastrados com seus componentes.
 */
router.get("/", listEquipamentosController);

/**
 * GET /api/equipamentos/:id
 * Busca um equipamento específico pelo ID com componentes detalhados.
 */
router.get("/:id", getEquipamentoController);

/* ---------------------------------------------------------------
   Rotas de escrita — restritas a ADMIN e GESTOR
   Técnicos só podem visualizar, não podem modificar o cadastro.
   --------------------------------------------------------------- */

/**
 * POST /api/equipamentos
 * Cria um novo equipamento no sistema.
 */
router.post("/", authorize("ADMIN", "GESTOR"), createEquipamentoController);

/**
 * PUT /api/equipamentos/:id
 * Atualiza um equipamento existente.
 */
router.put("/:id", authorize("ADMIN", "GESTOR"), updateEquipamentoController);

/**
 * DELETE /api/equipamentos/:id
 * Remove um equipamento e todos os seus componentes em cascata.
 */
router.delete(
  "/:id",
  authorize("ADMIN", "GESTOR"),
  deleteEquipamentoController
);

export default router;
