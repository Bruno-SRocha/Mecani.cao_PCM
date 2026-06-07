import { Request, Response } from "express";
import { AlertaRepository } from "../repositories/alerta.repository";

export class AlertaController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { apenasNaoLidos } = req.query;
      let alertas;
      if (apenasNaoLidos === "true") {
        alertas = await AlertaRepository.findPendentes();
      } else {
        alertas = await AlertaRepository.findAllAlertas();
      }
      res.status(200).json(alertas);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao listar alertas.";
      res.status(500).json({ error: message });
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const alerta = await AlertaRepository.findOne({ where: { id: id as string } });
      if (!alerta) {
        res.status(404).json({ error: "Alerta não encontrado." });
        return;
      }
      alerta.lido = true;
      await AlertaRepository.save(alerta);
      res.status(200).json(alerta);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao marcar alerta como lido.";
      res.status(500).json({ error: message });
    }
  }

  async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      await AlertaRepository.update({ lido: false }, { lido: true });
      res.status(200).json({ message: "Todos os alertas foram marcados como lidos." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao marcar todos os alertas como lidos.";
      res.status(500).json({ error: message });
    }
  }

  async countUnread(req: Request, res: Response): Promise<void> {
    try {
      const count = await AlertaRepository.count({ where: { lido: false } });
      res.status(200).json({ count });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao contar alertas não lidos.";
      res.status(500).json({ error: message });
    }
  }
}
