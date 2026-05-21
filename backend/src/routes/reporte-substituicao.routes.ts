/**
 * Rotas: Reporte de Substituição de Componente
 *
 * Rotas aninhadas sob componentes para criação e listagem:
 *   POST /api/equipamentos/:equipamentoId/componentes/:componenteId/reportes
 *   GET  /api/equipamentos/:equipamentoId/componentes/:componenteId/reportes
 *
 * Rotas globais para gestão/aprovação:
 *   GET   /api/reportes                   — Lista todos (ADMIN/GESTOR)
 *   GET   /api/reportes/pendentes         — Fila de aprovação (ADMIN/GESTOR)
 *   GET   /api/reportes/pendentes/count   — Badge de notificação (autenticado)
 *   PATCH /api/reportes/:id/aprovar       — Aprovar (ADMIN/GESTOR)
 *   PATCH /api/reportes/:id/rejeitar      — Rejeitar (ADMIN/GESTOR)
 */

import { Router } from "express";
import {
  createReporteController,
  listReportesByComponenteController,
  listPendentesController,
  listAllReportesController,
  countPendentesController,
  aprovarReporteController,
  rejeitarReporteController,
} from "../controllers/reporte-substituicao.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

/* ── Router aninhado: /api/equipamentos/:equipamentoId/componentes/:componenteId/reportes ── */
export const reporteComponenteRouter = Router({ mergeParams: true });

reporteComponenteRouter.use(authMiddleware);

/** Criação — todos os perfis autenticados */
reporteComponenteRouter.post("/", createReporteController);

/** Listagem por componente — todos os perfis autenticados */
reporteComponenteRouter.get("/", listReportesByComponenteController);

/* ── Router global: /api/reportes ── */
export const reporteGlobalRouter = Router();

reporteGlobalRouter.use(authMiddleware);

/** Badge de notificação — qualquer autenticado */
reporteGlobalRouter.get(
  "/pendentes/count",
  countPendentesController
);

/** Fila de aprovação — apenas ADMIN/GESTOR */
reporteGlobalRouter.get(
  "/pendentes",
  authorize("ADMIN", "GESTOR"),
  listPendentesController
);

/** Lista todos — apenas ADMIN/GESTOR */
reporteGlobalRouter.get(
  "/",
  authorize("ADMIN", "GESTOR"),
  listAllReportesController
);

/** Aprovar — apenas ADMIN/GESTOR */
reporteGlobalRouter.patch(
  "/:id/aprovar",
  authorize("ADMIN", "GESTOR"),
  aprovarReporteController
);

/** Rejeitar — apenas ADMIN/GESTOR */
reporteGlobalRouter.patch(
  "/:id/rejeitar",
  authorize("ADMIN", "GESTOR"),
  rejeitarReporteController
);

export default reporteGlobalRouter;
