import { Request, Response } from "express";
import { DiagnosticoService } from "../services/diagnostico.service";

const diagnosticoService = new DiagnosticoService();

export class DiagnosticoController {
  async criar(req: Request, res: Response) {
    try {
      const equipamentoId = req.params.equipamentoId as string;
      const usuarioId = req.userId!;
      const dados = req.body;

      const diagnostico = await diagnosticoService.criar(equipamentoId, usuarioId, dados);
      return res.status(201).json(diagnostico);
    } catch (error: any) {
      return res.status(400).json({ erro: error.message });
    }
  }

  async listar(req: Request, res: Response) {
    try {
      const equipamentoId = req.params.equipamentoId as string;
      const diagnosticos = await diagnosticoService.listarPorEquipamento(equipamentoId);
      return res.json(diagnosticos);
    } catch (error: any) {
      return res.status(400).json({ erro: error.message });
    }
  }

  async editar(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const dados = req.body;
      const usuario = { id: req.userId!, nivel: req.userNivel! };
      
      const diagnostico = await diagnosticoService.editar(id, usuario as any, dados);
      return res.json(diagnostico);
    } catch (error: any) {
      if (error.message.includes("Técnicos só podem editar") || error.message.includes("Apenas administradores")) {
        return res.status(403).json({ erro: error.message });
      }
      return res.status(400).json({ erro: error.message });
    }
  }

  async auditoria(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      const usuario = { id: req.userId!, nivel: req.userNivel! };

      const historico = await diagnosticoService.obterAuditoria(id, usuario as any);
      return res.json(historico);
    } catch (error: any) {
      if (error.message.includes("Apenas administradores")) {
        return res.status(403).json({ erro: error.message });
      }
      return res.status(400).json({ erro: error.message });
    }
  }
}
