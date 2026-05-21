/**
 * Controller: Reporte de Substituição de Componente
 *
 * Handlers HTTP para as rotas do módulo de reportes.
 *
 * Controle de acesso:
 * - Criação (POST): Todos os perfis autenticados (ADMIN, GESTOR, TECNICO)
 * - Listagem (GET pendentes/todos): Apenas ADMIN e GESTOR
 * - Aprovação/Rejeição (PATCH): Apenas ADMIN e GESTOR
 *
 * Rotas:
 *   POST   /api/equipamentos/:equipamentoId/componentes/:componenteId/reportes
 *   GET    /api/equipamentos/:equipamentoId/componentes/:componenteId/reportes
 *   GET    /api/reportes                         — Lista todos (ADMIN/GESTOR)
 *   GET    /api/reportes/pendentes               — Fila de aprovação (ADMIN/GESTOR)
 *   GET    /api/reportes/pendentes/count         — Badge de notificação
 *   PATCH  /api/reportes/:id/aprovar             — Aprovar (ADMIN/GESTOR)
 *   PATCH  /api/reportes/:id/rejeitar            — Rejeitar (ADMIN/GESTOR)
 */

import { Request, Response } from "express";
import {
  createReporteService,
  listReportesByComponenteService,
  listPendentesService,
  listAllReportesService,
  countPendentesService,
  aprovarReporteService,
  rejeitarReporteService,
} from "../services/reporte-substituicao.service";

/**
 * POST /api/equipamentos/:equipamentoId/componentes/:componenteId/reportes
 * Cria um reporte de substituição. Acessível por todos os perfis.
 */
export async function createReporteController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const equipamentoId = req.params.equipamentoId as string;
    const componenteId = req.params.componenteId as string;
    const tecnicoId = req.userId as string;

    const { pecaInstalada, vidaUtilNovaPeca, dataSubstituicao, observacoes } =
      req.body;

    if (!pecaInstalada) {
      res.status(400).json({ error: "Campo obrigatório: pecaInstalada." });
      return;
    }
    if (
      vidaUtilNovaPeca === undefined ||
      vidaUtilNovaPeca === null ||
      isNaN(Number(vidaUtilNovaPeca))
    ) {
      res.status(400).json({
        error: "Campo obrigatório: vidaUtilNovaPeca (número de horas).",
      });
      return;
    }
    if (!dataSubstituicao) {
      res.status(400).json({ error: "Campo obrigatório: dataSubstituicao." });
      return;
    }

    const reporte = await createReporteService(
      equipamentoId,
      componenteId,
      tecnicoId,
      {
        pecaInstalada,
        vidaUtilNovaPeca: Number(vidaUtilNovaPeca),
        dataSubstituicao,
        observacoes,
      }
    );

    res.status(201).json(reporte);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar reporte.";
    const statusCode = message.includes("não encontrado") ? 404 : 500;
    res.status(statusCode).json({ error: message });
  }
}

/**
 * GET /api/equipamentos/:equipamentoId/componentes/:componenteId/reportes
 * Lista reportes de um componente específico.
 */
export async function listReportesByComponenteController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const equipamentoId = req.params.equipamentoId as string;
    const componenteId = req.params.componenteId as string;
    const reportes = await listReportesByComponenteService(
      equipamentoId,
      componenteId
    );
    res.status(200).json(reportes);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar reportes.";
    const statusCode = message.includes("não encontrado") ? 404 : 500;
    res.status(statusCode).json({ error: message });
  }
}

/**
 * GET /api/reportes/pendentes
 * Lista todos os reportes aguardando aprovação. Restrito a GESTOR/ADMIN.
 */
export async function listPendentesController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const reportes = await listPendentesService();
    res.status(200).json(reportes);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar pendentes.";
    res.status(500).json({ error: message });
  }
}

/**
 * GET /api/reportes/pendentes/count
 * Conta reportes pendentes para o badge de notificação.
 */
export async function countPendentesController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const count = await countPendentesService();
    res.status(200).json({ count });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao contar pendentes.";
    res.status(500).json({ error: message });
  }
}

/**
 * GET /api/reportes
 * Lista todos os reportes do sistema. Restrito a GESTOR/ADMIN.
 */
export async function listAllReportesController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const reportes = await listAllReportesService();
    res.status(200).json(reportes);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar reportes.";
    res.status(500).json({ error: message });
  }
}

/**
 * PATCH /api/reportes/:id/aprovar
 * Aprova um reporte e atualiza o componente. Restrito a GESTOR/ADMIN.
 */
export async function aprovarReporteController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;
    const aprovadorId = req.userId as string;

    const reporte = await aprovarReporteService(id, { aprovadorId });
    res.status(200).json(reporte);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao aprovar reporte.";
    const statusCode = message.includes("não encontrado")
      ? 404
      : message.includes("já foi")
      ? 409
      : 500;
    res.status(statusCode).json({ error: message });
  }
}

/**
 * PATCH /api/reportes/:id/rejeitar
 * Rejeita um reporte. O componente não é alterado. Restrito a GESTOR/ADMIN.
 */
export async function rejeitarReporteController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;
    const aprovadorId = req.userId as string;
    const { motivoRejeicao } = req.body;

    if (!motivoRejeicao) {
      res.status(400).json({ error: "Campo obrigatório: motivoRejeicao." });
      return;
    }

    const reporte = await rejeitarReporteService(id, {
      aprovadorId,
      motivoRejeicao,
    });
    res.status(200).json(reporte);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao rejeitar reporte.";
    const statusCode = message.includes("não encontrado")
      ? 404
      : message.includes("já foi")
      ? 409
      : 500;
    res.status(statusCode).json({ error: message });
  }
}
