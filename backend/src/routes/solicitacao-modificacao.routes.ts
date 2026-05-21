import { Router } from "express";
import {
  createModificacaoController,
  listModificacoesByEquipamentoController,
  listAllModificacoesController,
  getModificacaoController,
  iniciarImplementacaoModificacaoController,
  finalizarModificacaoController,
} from "../controllers/solicitacao-modificacao.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authorize } from "../middlewares/authorize.middleware";

// Router aninhado: /api/equipamentos/:equipamentoId/solicitacoes-modificacao
export const solicitacaoModificacaoEquipamentoRouter = Router({ mergeParams: true });

solicitacaoModificacaoEquipamentoRouter.use(authMiddleware);

// Qualquer usuário autenticado (Técnico, Gestor, Admin) pode criar e ver solicitações de um equipamento
solicitacaoModificacaoEquipamentoRouter.post("/", createModificacaoController);
solicitacaoModificacaoEquipamentoRouter.get("/", listModificacoesByEquipamentoController);

// Router global: /api/solicitacoes-modificacao
export const solicitacaoModificacaoGlobalRouter = Router();

solicitacaoModificacaoGlobalRouter.use(authMiddleware);

// Obter detalhes de uma solicitação específica
solicitacaoModificacaoGlobalRouter.get("/:id", getModificacaoController);

// Listar todas as solicitações (apenas ADMIN e GESTOR)
solicitacaoModificacaoGlobalRouter.get(
  "/",
  authorize("ADMIN", "GESTOR"),
  listAllModificacoesController
);

// Iniciar a implementação da solicitação (qualquer técnico, gestor ou admin pode marcar como "Em Implementação")
solicitacaoModificacaoGlobalRouter.patch("/:id/iniciar", iniciarImplementacaoModificacaoController);

// Finalizar/Aprovar solicitação (apenas ADMIN e GESTOR podem aprovar a finalização para atualizar a BOM)
solicitacaoModificacaoGlobalRouter.patch(
  "/:id/finalizar",
  authorize("ADMIN", "GESTOR"),
  finalizarModificacaoController
);

export default solicitacaoModificacaoGlobalRouter;
