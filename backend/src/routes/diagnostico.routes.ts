import { Router } from "express";
import { DiagnosticoController } from "../controllers/diagnostico.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router({ mergeParams: true });
const diagnosticoController = new DiagnosticoController();

// /api/equipamentos/:equipamentoId/diagnosticos
router.post("/", authMiddleware, diagnosticoController.criar.bind(diagnosticoController));
router.get("/", authMiddleware, diagnosticoController.listar.bind(diagnosticoController));

// /api/diagnosticos/:id
// As rotas de edição e auditoria são diretas do diagnóstico, não precisam estar aninhadas em equipamentoId
const routerDireto = Router();
routerDireto.put("/:id", authMiddleware, diagnosticoController.editar.bind(diagnosticoController));
routerDireto.get("/:id/auditoria", authMiddleware, diagnosticoController.auditoria.bind(diagnosticoController));

export { router as diagnosticoEquipamentoRoutes, routerDireto as diagnosticoRoutes };
