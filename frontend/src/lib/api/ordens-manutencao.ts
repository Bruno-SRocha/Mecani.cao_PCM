/**
 * Serviço de API — Ordens de Manutenção (OM)
 *
 * Centraliza as chamadas HTTP ao back-end relacionadas ao módulo de OMs.
 * Utiliza fetch nativo do browser com autenticação JWT via Bearer token.
 */

import type {
  OrdemManutencao,
  CreateOMRequest,
  UpdateOMRequest,
  StatusOM,
  PrioridadeOM,
} from "@/types/om.types";
import type { Usuario } from "@/types/usuario.types";

/** URL base da API back-end */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

/**
 * Gera os headers padrão para requisições autenticadas.
 */
function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Lista todas as OMs. Suporta filtros opcionais via query string.
 *
 * GET /api/ordens-manutencao
 */
export async function listOrdensManutencaoApi(filtros?: {
  status?: StatusOM;
  prioridade?: PrioridadeOM;
  equipamentoId?: string;
}): Promise<OrdemManutencao[]> {
  const params = new URLSearchParams();
  if (filtros?.status) params.append("status", filtros.status);
  if (filtros?.prioridade) params.append("prioridade", filtros.prioridade);
  if (filtros?.equipamentoId) params.append("equipamentoId", filtros.equipamentoId);

  const url = `${API_BASE}/ordens-manutencao${params.toString() ? `?${params}` : ""}`;
  const response = await fetch(url, { headers: authHeaders() });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao listar OMs (${response.status})`);
  }

  return response.json();
}

/**
 * Busca uma OM específica pelo ID.
 *
 * GET /api/ordens-manutencao/:id
 */
export async function getOrdemManutencaoApi(id: string): Promise<OrdemManutencao> {
  const response = await fetch(`${API_BASE}/ordens-manutencao/${id}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao buscar OM (${response.status})`);
  }

  return response.json();
}

/**
 * Cria uma nova OM.
 *
 * POST /api/ordens-manutencao
 * Restrito a ADMIN e GESTOR.
 */
export async function createOrdemManutencaoApi(
  data: CreateOMRequest
): Promise<OrdemManutencao> {
  const response = await fetch(`${API_BASE}/ordens-manutencao`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao criar OM (${response.status})`);
  }

  return response.json();
}

/**
 * Atualiza uma OM existente.
 *
 * PUT /api/ordens-manutencao/:id
 */
export async function updateOrdemManutencaoApi(
  id: string,
  data: UpdateOMRequest
): Promise<OrdemManutencao> {
  const response = await fetch(`${API_BASE}/ordens-manutencao/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao atualizar OM (${response.status})`);
  }

  return response.json();
}

/**
 * Remove uma OM.
 *
 * DELETE /api/ordens-manutencao/:id
 */
export async function deleteOrdemManutencaoApi(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/ordens-manutencao/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao deletar OM (${response.status})`);
  }
}

/**
 * Lista todos os usuários com perfil TECNICO.
 * Usado para popular o dropdown de designação no formulário de criação de OM.
 *
 * GET /api/usuarios/tecnicos
 */
export async function listTecnicosApi(): Promise<Usuario[]> {
  const response = await fetch(`${API_BASE}/usuarios/tecnicos`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao listar técnicos (${response.status})`);
  }

  return response.json();
}
