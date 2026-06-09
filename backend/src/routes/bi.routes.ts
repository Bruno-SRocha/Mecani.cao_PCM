import { Router } from "express";
import { BiController } from "../controllers/bi.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();
const controller = new BiController();

router.use(authMiddleware);

router.get("/metrics", controller.getMetrics.bind(controller));

export default router;
