/**
 * Rotas: Ordens de Manutenção (/api/ordens-manutencao)
 *
 * Define as rotas do módulo de Ordens de Manutenção (OM).
 * Todas as rotas exigem autenticação JWT (authMiddleware).
 *
 * Controle de acesso (AC1):
 * - GET (leitura): Todos os perfis autenticados
 *   • GESTOR/ADMIN: veem todas as OMs
 *   • TECNICO: vê apenas suas OMs
 * - POST/DELETE: Apenas ADMIN e GESTOR
 * - PUT: ADMIN, GESTOR e TECNICO (técnico só altera status)
 *
 * Rotas:
 *   GET    /api/ordens-manutencao                  — Lista OMs
 *   GET    /api/ordens-manutencao/meu-backlog       — Backlog do técnico
 *   GET    /api/ordens-manutencao/:id               — Detalhe de uma OM
 *   POST   /api/ordens-manutencao                   — Cria OM (ADMIN/GESTOR)
 *   PUT    /api/ordens-manutencao/:id               — Atualiza OM
 *   DELETE /api/ordens-manutencao/:id               — Remove OM (ADMIN/GESTOR)
 *
 * Rota auxiliar (usuários técnicos):
 *   GET    /api/usuarios/tecnicos                   — Lista técnicos disponíveis
 */

import { Router } from "express";
import {
  listOrdens,
  getOrdem,
  createOrdem,
  updateOrdem,
  deleteOrdem,
  meuBacklog,
  listTecnicos,
} from "../controllers/ordemmanutencao.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

/* ---------------------------------------------------------------
   Router principal de Ordens de Manutenção
   --------------------------------------------------------------- */
const ordemRouter = Router();

// Todas as rotas exigem autenticação
ordemRouter.use(authMiddleware);

/**
 * GET /api/ordens-manutencao/meu-backlog
 * ATENÇÃO: deve vir ANTES de /:id para não ser capturado como parâmetro.
 * Retorna as OMs do técnico logado, ordenadas por prioridade.
 */
ordemRouter.get("/meu-backlog", meuBacklog);

/**
 * GET /api/ordens-manutencao
 * Lista todas as OMs com filtros opcionais (status, prioridade, equipamentoId).
 * TECNICO: filtrado automaticamente para suas OMs.
 */
ordemRouter.get("/", listOrdens);

/**
 * GET /api/ordens-manutencao/:id
 * Retorna uma OM específica com todos os relacionamentos.
 */
ordemRouter.get("/:id", getOrdem);

/**
 * POST /api/ordens-manutencao
 * Cria uma nova OM. Restrito a ADMIN e GESTOR (AC1).
 */
ordemRouter.post("/", authorize("ADMIN", "GESTOR"), createOrdem);

/**
 * PUT /api/ordens-manutencao/:id
 * Atualiza uma OM existente.
 * Técnico pode apenas alterar o status (lógica no controller).
 */
ordemRouter.put("/:id", updateOrdem);

/**
 * DELETE /api/ordens-manutencao/:id
 * Remove uma OM. Restrito a ADMIN e GESTOR.
 */
ordemRouter.delete("/:id", authorize("ADMIN", "GESTOR"), deleteOrdem);

/* ---------------------------------------------------------------
   Router auxiliar para usuários técnicos
   --------------------------------------------------------------- */
export const usuariosRouter = Router();
usuariosRouter.use(authMiddleware);

/**
 * GET /api/usuarios/tecnicos
 * Lista todos os usuários com perfil TECNICO.
 * Acessível por ADMIN e GESTOR para popular o formulário de criação de OM.
 */
usuariosRouter.get(
  "/tecnicos",
  authorize("ADMIN", "GESTOR"),
  listTecnicos
);

export default ordemRouter;
