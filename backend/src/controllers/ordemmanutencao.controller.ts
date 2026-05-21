/**
 * Controller: Ordem de Manutenção
 *
 * Handlers HTTP para o módulo de OMs.
 * Recebe as requisições validadas pelas rotas e delega para o service.
 *
 * Endpoints:
 *   GET    /api/ordens-manutencao              — Lista OMs (com filtros)
 *   GET    /api/ordens-manutencao/:id          — Detalhe de uma OM
 *   POST   /api/ordens-manutencao              — Cria nova OM (GESTOR/ADMIN)
 *   PUT    /api/ordens-manutencao/:id          — Atualiza OM (GESTOR/ADMIN/TECNICO)
 *   DELETE /api/ordens-manutencao/:id          — Remove OM (GESTOR/ADMIN)
 *   GET    /api/ordens-manutencao/meu-backlog  — OMs do técnico logado
 *   GET    /api/usuarios/tecnicos              — Lista técnicos (para o form de criação)
 */

import { Request, Response } from "express";
import {
  criarOM,
  listarOMs,
  buscarOM,
  atualizarOM,
  deletarOM,
  listarTecnicos,
  CreateOMDto,
} from "../services/ordemmanutencao.service";
import { StatusOM, PrioridadeOM } from "../entities/ordemmanutencao.entity";

/**
 * GET /api/ordens-manutencao
 * Lista todas as OMs com filtros opcionais via query string.
 * TECNICO: recebe apenas suas OMs (filtro automático por tecnicoId).
 * GESTOR/ADMIN: vê todas.
 */
export async function listOrdens(req: Request, res: Response): Promise<void> {
  try {
    const { status, prioridade, equipamentoId, tecnicoId } = req.query;

    // Técnicos só veem suas próprias OMs
    const tecnicoIdFiltro =
      req.userNivel === "TECNICO"
        ? req.userId
        : (tecnicoId as string | undefined);

    const oms = await listarOMs({
      status: status as StatusOM | undefined,
      prioridade: prioridade as PrioridadeOM | undefined,
      equipamentoId: equipamentoId as string | undefined,
      tecnicoId: tecnicoIdFiltro,
    });

    res.json(oms);
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro ao listar Ordens de Manutenção.";
    res.status(500).json({ error: mensagem });
  }
}

/**
 * GET /api/ordens-manutencao/meu-backlog
 * Retorna as OMs designadas ao técnico logado, ordenadas por prioridade.
 * Exclusivo para usuários com perfil TECNICO.
 */
export async function meuBacklog(req: Request, res: Response): Promise<void> {
  try {
    const oms = await listarOMs({ tecnicoId: req.userId });
    res.json(oms);
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro ao buscar backlog.";
    res.status(500).json({ error: mensagem });
  }
}

/**
 * GET /api/ordens-manutencao/:id
 * Retorna uma OM específica com todos os dados relacionados.
 */
export async function getOrdem(req: Request, res: Response): Promise<void> {
  try {
    const om = await buscarOM(req.params.id as string);
    res.json(om);
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro ao buscar Ordem de Manutenção.";
    const statusCode = mensagem.includes("não encontrada") ? 404 : 500;
    res.status(statusCode).json({ error: mensagem });
  }
}

/**
 * POST /api/ordens-manutencao
 * Cria uma nova OM. Restrito a ADMIN e GESTOR (AC1).
 */
export async function createOrdem(req: Request, res: Response): Promise<void> {
  try {
    const dto: CreateOMDto = {
      equipamentoId: req.body.equipamentoId,
      descricao: req.body.descricao,
      tipo: req.body.tipo,
      prioridade: req.body.prioridade,
      dataInicioPrevisto: req.body.dataInicioPrevisto,
      tecnicoIds: req.body.tecnicoIds,
      materiaisNecessarios: req.body.materiaisNecessarios,
      observacoes: req.body.observacoes,
    };

    // Validações básicas de campos obrigatórios
    if (!dto.equipamentoId) {
      res.status(400).json({ error: "O campo 'equipamentoId' é obrigatório." });
      return;
    }
    if (!dto.descricao?.trim()) {
      res.status(400).json({ error: "O campo 'descricao' é obrigatório." });
      return;
    }
    if (!dto.tipo) {
      res.status(400).json({ error: "O campo 'tipo' (tipo de manutenção) é obrigatório." });
      return;
    }
    if (!dto.tecnicoIds || dto.tecnicoIds.length === 0) {
      res.status(400).json({ error: "Pelo menos um técnico deve ser designado ('tecnicoIds')." });
      return;
    }

    const om = await criarOM(req.userId!, dto);
    res.status(201).json(om);
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro ao criar Ordem de Manutenção.";
    const statusCode = mensagem.includes("não encontrado") ? 404 : 400;
    res.status(statusCode).json({ error: mensagem });
  }
}

/**
 * PUT /api/ordens-manutencao/:id
 * Atualiza uma OM existente.
 * GESTOR/ADMIN: podem alterar qualquer campo.
 * TECNICO: pode apenas atualizar o status.
 */
export async function updateOrdem(req: Request, res: Response): Promise<void> {
  try {
    const isTecnico = req.userNivel === "TECNICO";

    // Técnico só pode alterar o status
    const dto = isTecnico
      ? { status: req.body.status }
      : {
          descricao: req.body.descricao,
          tipo: req.body.tipo,
          prioridade: req.body.prioridade,
          status: req.body.status,
          dataInicioPrevisto: req.body.dataInicioPrevisto,
          tecnicoIds: req.body.tecnicoIds,
          materiaisNecessarios: req.body.materiaisNecessarios,
          observacoes: req.body.observacoes,
        };

    const om = await atualizarOM(req.params.id as string, dto);
    res.json(om);
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro ao atualizar Ordem de Manutenção.";
    const statusCode = mensagem.includes("não encontrada") ? 404 : 400;
    res.status(statusCode).json({ error: mensagem });
  }
}

/**
 * DELETE /api/ordens-manutencao/:id
 * Remove uma OM. Restrito a ADMIN e GESTOR.
 */
export async function deleteOrdem(req: Request, res: Response): Promise<void> {
  try {
    await deletarOM(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro ao remover Ordem de Manutenção.";
    const statusCode = mensagem.includes("não encontrada") ? 404 : 500;
    res.status(statusCode).json({ error: mensagem });
  }
}

/**
 * GET /api/usuarios/tecnicos
 * Lista todos os usuários com perfil TECNICO.
 * Usado para popular o dropdown de designação no formulário de criação de OM.
 * Acessível por GESTOR e ADMIN.
 */
export async function listTecnicos(req: Request, res: Response): Promise<void> {
  try {
    const tecnicos = await listarTecnicos();
    res.json(tecnicos);
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Erro ao listar técnicos.";
    res.status(500).json({ error: mensagem });
  }
}
