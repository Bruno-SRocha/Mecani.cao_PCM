import { Router } from "express";
import { AlertaController } from "../controllers/alerta.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const controller = new AlertaController();

router.use(authMiddleware);

router.get("/", controller.list.bind(controller));
router.get("/nao-lidos/count", controller.countUnread.bind(controller));
router.put("/:id/lido", controller.markAsRead.bind(controller));
router.put("/lido/todos", controller.markAllAsRead.bind(controller));

export default router;
