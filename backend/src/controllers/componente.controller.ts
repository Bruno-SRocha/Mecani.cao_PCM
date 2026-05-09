/**
 * Controller: Componente
 *
 * Handlers HTTP para as rotas de gestão de componentes mecânicos.
 * Recebe requisições, valida inputs obrigatórios, chama os services
 * e retorna as respostas HTTP com os status codes corretos.
 *
 * Segue o padrão:
 *   Route → Controller → Service → Repository → Banco
 *
 * As rotas são aninhadas sob equipamentos:
 *   /api/equipamentos/:equipamentoId/componentes
 *
 * Controle de acesso:
 * - Leitura (GET): Todos os perfis autenticados (ADMIN, GESTOR, TECNICO)
 * - Escrita (POST, PUT, DELETE): Apenas ADMIN e GESTOR
 */

import { Request, Response } from "express";
import {
  listComponentesService,
  getComponenteService,
  createComponenteService,
  updateComponenteService,
  deleteComponenteService,
} from "../services/componente.service";

/**
 * GET /api/equipamentos/:equipamentoId/componentes
 *
 * Lista todos os componentes de um equipamento, ordenados por
 * desgaste decrescente (mais críticos primeiro).
 *
 * Resposta 200: Array de componentes com campo desgastePct
 * Resposta 404: Equipamento não encontrado
 */
export async function listComponentesController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const equipamentoId = req.params.equipamentoId as string;
    const componentes = await listComponentesService(equipamentoId);
    res.status(200).json(componentes);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao listar componentes.";
    const statusCode = message.includes("não encontrado") ? 404 : 500;
    res.status(statusCode).json({ error: message });
  }
}

/**
 * GET /api/equipamentos/:equipamentoId/componentes/:id
 *
 * Busca um componente específico pelo ID.
 *
 * Resposta 200: Componente com desgastePct
 * Resposta 404: Equipamento ou componente não encontrado
 */
export async function getComponenteController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const equipamentoId = req.params.equipamentoId as string;
    const id = req.params.id as string;
    const componente = await getComponenteService(equipamentoId, id);
    res.status(200).json(componente);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar componente.";
    const statusCode = message.includes("não encontrado") ? 404 : 500;
    res.status(statusCode).json({ error: message });
  }
}

/**
 * POST /api/equipamentos/:equipamentoId/componentes
 *
 * Cria um novo componente vinculado ao equipamento.
 * Restrito a ADMIN e GESTOR.
 *
 * Body obrigatório: { nome, tipo, vidaUtilNominal }
 * Body opcional:    { horasOperacionais }
 *
 * Resposta 201: Componente criado com desgastePct
 * Resposta 400: Campos obrigatórios ausentes ou inválidos
 * Resposta 404: Equipamento não encontrado
 */
export async function createComponenteController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const equipamentoId = req.params.equipamentoId as string;
    const { nome, tipo, vidaUtilNominal } = req.body;

    /* Validação de campos obrigatórios */
    if (!nome || !tipo) {
      res.status(400).json({
        error: "Campos obrigatórios: nome, tipo, vidaUtilNominal.",
      });
      return;
    }

    if (
      vidaUtilNominal === undefined ||
      vidaUtilNominal === null ||
      isNaN(Number(vidaUtilNominal))
    ) {
      res.status(400).json({
        error:
          "Campo obrigatório: vidaUtilNominal (Vida Útil em horas, deve ser um número).",
      });
      return;
    }

    const componente = await createComponenteService(equipamentoId, {
      ...req.body,
      vidaUtilNominal: Number(vidaUtilNominal),
      horasOperacionais: req.body.horasOperacionais
        ? Number(req.body.horasOperacionais)
        : 0,
    });

    res.status(201).json(componente);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar componente.";
    const statusCode = message.includes("não encontrado")
      ? 404
      : message.includes("deve ser maior") || message.includes("não podem ser")
      ? 400
      : 500;
    res.status(statusCode).json({ error: message });
  }
}

/**
 * PUT /api/equipamentos/:equipamentoId/componentes/:id
 *
 * Atualiza um componente existente (parcial).
 * Restrito a ADMIN e GESTOR.
 *
 * Resposta 200: Componente atualizado com desgastePct
 * Resposta 400: Dados inválidos
 * Resposta 404: Componente não encontrado
 */
export async function updateComponenteController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const equipamentoId = req.params.equipamentoId as string;
    const id = req.params.id as string;

    /* Normaliza campos numéricos se fornecidos */
    const updateData = { ...req.body };
    if (updateData.vidaUtilNominal !== undefined) {
      updateData.vidaUtilNominal = Number(updateData.vidaUtilNominal);
    }
    if (updateData.horasOperacionais !== undefined) {
      updateData.horasOperacionais = Number(updateData.horasOperacionais);
    }

    const componente = await updateComponenteService(
      equipamentoId,
      id,
      updateData
    );
    res.status(200).json(componente);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar componente.";
    const statusCode = message.includes("não encontrado")
      ? 404
      : message.includes("deve ser maior") || message.includes("não podem ser")
      ? 400
      : 500;
    res.status(statusCode).json({ error: message });
  }
}

/**
 * DELETE /api/equipamentos/:equipamentoId/componentes/:id
 *
 * Remove um componente do sistema.
 * Restrito a ADMIN e GESTOR.
 *
 * Resposta 200: Mensagem de sucesso
 * Resposta 404: Componente não encontrado
 */
export async function deleteComponenteController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const equipamentoId = req.params.equipamentoId as string;
    const id = req.params.id as string;
    await deleteComponenteService(equipamentoId, id);
    res.status(200).json({ message: "Componente removido com sucesso." });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao remover componente.";
    const statusCode = message.includes("não encontrado") ? 404 : 500;
    res.status(statusCode).json({ error: message });
  }
}
