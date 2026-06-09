import { Request, Response } from "express";
import { BiRepository } from "../repositories/bi.repository";

export class BiController {
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const metrics = await BiRepository.getBiMetrics();
      res.status(200).json(metrics);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao carregar métricas de BI.";
      res.status(500).json({ error: message });
    }
  }
}
