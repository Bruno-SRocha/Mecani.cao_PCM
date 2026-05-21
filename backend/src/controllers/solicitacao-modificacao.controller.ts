import { Request, Response } from "express";
import {
  createModificacaoService,
  listModificacoesByEquipamentoService,
  listAllModificacoesService,
  getModificacaoService,
  iniciarImplementacaoModificacaoService,
  finalizarModificacaoService,
} from "../services/solicitacao-modificacao.service";

/**
 * POST /api/equipamentos/:equipamentoId/solicitacoes-modificacao
 * Cria uma solicitação de modificação.
 */
export async function createModificacaoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const equipamentoId = req.params.equipamentoId as string;
    const {
      tipoModificacao,
      justificativa,
      componenteSaidaId,
      novoComponenteNome,
      novoComponenteTipo,
      novoComponenteVidaUtilNominal,
    } = req.body;

    const solicitacao = await createModificacaoService(equipamentoId, {
      tipoModificacao,
      justificativa,
      componenteSaidaId,
      novoComponenteNome,
      novoComponenteTipo,
      novoComponenteVidaUtilNominal: novoComponenteVidaUtilNominal ? Number(novoComponenteVidaUtilNominal) : undefined,
    });

    res.status(201).json(solicitacao);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar solicitação.";
    res.status(400).json({ error: message });
  }
}

/**
 * GET /api/equipamentos/:equipamentoId/solicitacoes-modificacao
 * Lista as solicitações de um equipamento específico.
 */
export async function listModificacoesByEquipamentoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const equipamentoId = req.params.equipamentoId as string;
    const solicitacoes = await listModificacoesByEquipamentoService(equipamentoId);
    res.status(200).json(solicitacoes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar solicitações.";
    res.status(400).json({ error: message });
  }
}

/**
 * GET /api/solicitacoes-modificacao
 * Lista todas as solicitações do sistema.
 */
export async function listAllModificacoesController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const solicitacoes = await listAllModificacoesService();
    res.status(200).json(solicitacoes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar todas as solicitações.";
    res.status(400).json({ error: message });
  }
}

/**
 * GET /api/solicitacoes-modificacao/:id
 * Obtém os detalhes de uma solicitação específica.
 */
export async function getModificacaoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;
    const solicitacao = await getModificacaoService(id);
    res.status(200).json(solicitacao);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao obter solicitação.";
    res.status(404).json({ error: message });
  }
}

/**
 * PATCH /api/solicitacoes-modificacao/:id/iniciar
 * Inicia a implementação de uma solicitação de modificação.
 */
export async function iniciarImplementacaoModificacaoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;
    const solicitacao = await iniciarImplementacaoModificacaoService(id);
    res.status(200).json(solicitacao);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao iniciar modificação.";
    res.status(400).json({ error: message });
  }
}

/**
 * PATCH /api/solicitacoes-modificacao/:id/finalizar
 * Conclui uma solicitação de modificação, atualizando a BOM do equipamento.
 */
export async function finalizarModificacaoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { parecerEngenharia } = req.body;

    const solicitacao = await finalizarModificacaoService(id, { parecerEngenharia });
    res.status(200).json(solicitacao);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao finalizar modificação.";
    res.status(400).json({ error: message });
  }
}
