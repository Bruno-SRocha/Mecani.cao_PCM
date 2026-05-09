/**
 * Rotas: Componentes (/api/equipamentos/:equipamentoId/componentes)
 *
 * Define as rotas do módulo de gestão de componentes mecânicos.
 * As rotas são aninhadas sob equipamentos, pois um componente
 * sempre pertence a um equipamento específico no contexto de PCM.
 *
 * Todas as rotas exigem autenticação JWT (authMiddleware).
 *
 * Controle de acesso:
 * - GET (leitura): Todos os perfis autenticados (ADMIN, GESTOR, TECNICO)
 * - POST/PUT/DELETE (escrita): Apenas ADMIN e GESTOR
 *
 * Rotas:
 *   GET    /api/equipamentos/:equipamentoId/componentes       — Lista componentes
 *   GET    /api/equipamentos/:equipamentoId/componentes/:id   — Detalhe do componente
 *   POST   /api/equipamentos/:equipamentoId/componentes       — Cria componente (ADMIN/GESTOR)
 *   PUT    /api/equipamentos/:equipamentoId/componentes/:id   — Atualiza (ADMIN/GESTOR)
 *   DELETE /api/equipamentos/:equipamentoId/componentes/:id   — Remove (ADMIN/GESTOR)
 */

import { Router } from "express";
import {
  listComponentesController,
  getComponenteController,
  createComponenteController,
  updateComponenteController,
  deleteComponenteController,
} from "../controllers/componente.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

/**
 * Este router usa mergeParams: true para ter acesso ao :equipamentoId
 * definido no router pai (equipamento.routes.ts).
 */
const router = Router({ mergeParams: true });

/* ---------------------------------------------------------------
   Todas as rotas de componentes exigem autenticação
   --------------------------------------------------------------- */
router.use(authMiddleware);

/* ---------------------------------------------------------------
   Rotas de leitura — acessíveis por todos os perfis autenticados
   --------------------------------------------------------------- */

/**
 * GET /api/equipamentos/:equipamentoId/componentes
 * Lista todos os componentes do equipamento ordenados por desgaste.
 */
router.get("/", listComponentesController);

/**
 * GET /api/equipamentos/:equipamentoId/componentes/:id
 * Busca um componente específico com seu desgaste percentual calculado.
 */
router.get("/:id", getComponenteController);

/* ---------------------------------------------------------------
   Rotas de escrita — restritas a ADMIN e GESTOR
   --------------------------------------------------------------- */

/**
 * POST /api/equipamentos/:equipamentoId/componentes
 * Cria um novo componente (rolamento, selo, motor, etc.) para o equipamento.
 * Campo Vida Útil (vidaUtilNominal) é obrigatório.
 */
router.post("/", authorize("ADMIN", "GESTOR"), createComponenteController);

/**
 * PUT /api/equipamentos/:equipamentoId/componentes/:id
 * Atualiza um componente existente (ex: corrige vida útil, registra horas).
 */
router.put("/:id", authorize("ADMIN", "GESTOR"), updateComponenteController);

/**
 * DELETE /api/equipamentos/:equipamentoId/componentes/:id
 * Remove um componente do equipamento.
 */
router.delete(
  "/:id",
  authorize("ADMIN", "GESTOR"),
  deleteComponenteController
);

export default router;
