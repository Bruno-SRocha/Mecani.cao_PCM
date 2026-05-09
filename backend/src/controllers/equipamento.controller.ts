/**
 * Controller: Equipamento
 *
 * Handlers HTTP para as rotas de gestão de equipamentos industriais.
 * Responsável por receber as requisições, validar os inputs,
 * chamar os services adequados e retornar as respostas HTTP.
 *
 * Segue o padrão:
 *   Route → Controller → Service → Repository → Banco
 *
 * Controle de acesso:
 * - Leitura (GET): Todos os perfis autenticados (ADMIN, GESTOR, TECNICO)
 * - Escrita (POST, PUT, DELETE): Apenas ADMIN e GESTOR
 */

import { Request, Response } from "express";
import {
  listEquipamentosService,
  getEquipamentoService,
  createEquipamentoService,
  updateEquipamentoService,
  deleteEquipamentoService,
} from "../services/equipamento.service";

/**
 * GET /api/equipamentos
 *
 * Lista todos os equipamentos cadastrados no sistema.
 * Acessível por todos os perfis autenticados.
 *
 * Resposta 200: Array de equipamentos com componentes
 */
export async function listEquipamentosController(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const equipamentos = await listEquipamentosService();
    res.status(200).json(equipamentos);
  } catch (error) {
    res.status(500).json({
      error: "Erro ao listar equipamentos.",
      details: error instanceof Error ? error.message : undefined,
    });
  }
}

/**
 * GET /api/equipamentos/:id
 *
 * Busca um equipamento específico pelo ID com seus componentes.
 * Acessível por todos os perfis autenticados.
 *
 * Resposta 200: Equipamento com componentes
 * Resposta 404: Equipamento não encontrado
 */
export async function getEquipamentoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;
    const equipamento = await getEquipamentoService(id);
    res.status(200).json(equipamento);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao buscar equipamento.";
    const statusCode = message.includes("não encontrado") ? 404 : 500;
    res.status(statusCode).json({ error: message });
  }
}

/**
 * POST /api/equipamentos
 *
 * Cria um novo equipamento no sistema.
 * Restrito a ADMIN e GESTOR.
 *
 * Body esperado: { nome, tag, tipo, fabricante, modelo, localizacao, ... }
 * Resposta 201: Equipamento criado
 * Resposta 400: Validação falhou
 * Resposta 409: TAG já em uso
 */
export async function createEquipamentoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { nome, tag, tipo, fabricante, modelo, localizacao } = req.body;

    /* Validação de campos obrigatórios */
    if (!nome || !tag || !tipo || !fabricante || !modelo || !localizacao) {
      res.status(400).json({
        error:
          "Campos obrigatórios: nome, tag, tipo, fabricante, modelo, localizacao.",
      });
      return;
    }

    const equipamento = await createEquipamentoService(req.body);

    res.status(201).json(equipamento);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao criar equipamento.";
    const statusCode = message.includes("TAG") ? 409 : 500;
    res.status(statusCode).json({ error: message });
  }
}

/**
 * PUT /api/equipamentos/:id
 *
 * Atualiza um equipamento existente.
 * Restrito a ADMIN e GESTOR.
 *
 * Body esperado: Campos a atualizar (parcial)
 * Resposta 200: Equipamento atualizado
 * Resposta 404: Equipamento não encontrado
 * Resposta 409: TAG já em uso
 */
export async function updateEquipamentoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;
    const equipamento = await updateEquipamentoService(id, req.body);
    res.status(200).json(equipamento);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao atualizar equipamento.";
    const statusCode = message.includes("não encontrado")
      ? 404
      : message.includes("TAG")
      ? 409
      : 500;
    res.status(statusCode).json({ error: message });
  }
}

/**
 * DELETE /api/equipamentos/:id
 *
 * Remove um equipamento do sistema e todos os seus componentes.
 * Restrito a ADMIN e GESTOR.
 *
 * Resposta 200: Mensagem de sucesso
 * Resposta 404: Equipamento não encontrado
 */
export async function deleteEquipamentoController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const id = req.params.id as string;
    await deleteEquipamentoService(id);
    res
      .status(200)
      .json({ message: "Equipamento removido com sucesso." });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao remover equipamento.";
    const statusCode = message.includes("não encontrado") ? 404 : 500;
    res.status(statusCode).json({ error: message });
  }
}
