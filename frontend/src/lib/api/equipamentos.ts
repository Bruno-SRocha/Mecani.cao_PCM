/**
 * Serviço de API — Equipamentos
 *
 * Centraliza as chamadas HTTP ao back-end relacionadas ao módulo
 * de gestão de equipamentos industriais. Utiliza fetch nativo do browser.
 *
 * Todas as requisições incluem o token JWT no header Authorization
 * para autenticação. O token é obtido do localStorage.
 *
 * O helper `authHeaders()` encapsula a lógica de incluir o token
 * em todas as chamadas autenticadas.
 */

import type {
  Equipamento,
  CreateEquipamentoRequest,
  UpdateEquipamentoRequest,
  StatusEquipamento,
} from "@/types/equipamento.types";

/** URL base da API back-end */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

/**
 * Gera os headers padrão para requisições autenticadas.
 * Inclui o token JWT do localStorage no formato Bearer.
 *
 * @returns Headers com Content-Type e Authorization
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
 * Lista todos os equipamentos cadastrados no sistema.
 *
 * GET /api/equipamentos
 * Acessível por todos os perfis autenticados.
 *
 * @returns Array de equipamentos com seus componentes
 * @throws Error com mensagem descritiva em caso de falha
 */
export async function listEquipamentosApi(): Promise<Equipamento[]> {
  const response = await fetch(`${API_BASE}/equipamentos`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error ?? `Erro ao listar equipamentos (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Busca um equipamento específico pelo ID com seus componentes.
 *
 * GET /api/equipamentos/:id
 * Acessível por todos os perfis autenticados.
 *
 * @param id - UUID do equipamento
 * @returns Equipamento com lista de componentes
 * @throws Error com mensagem descritiva em caso de falha
 */
export async function getEquipamentoApi(id: string): Promise<Equipamento> {
  const response = await fetch(`${API_BASE}/equipamentos/${id}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error ?? `Erro ao buscar equipamento (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Cria um novo equipamento no sistema.
 *
 * POST /api/equipamentos
 * Restrito a ADMIN e GESTOR.
 *
 * @param data - Dados do novo equipamento
 * @returns O equipamento criado
 * @throws Error com mensagem descritiva em caso de falha
 */
export async function createEquipamentoApi(
  data: CreateEquipamentoRequest
): Promise<Equipamento> {
  const response = await fetch(`${API_BASE}/equipamentos`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error ?? `Erro ao criar equipamento (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Atualiza um equipamento existente.
 *
 * PUT /api/equipamentos/:id
 * Restrito a ADMIN e GESTOR.
 *
 * @param id - UUID do equipamento
 * @param data - Campos a serem atualizados
 * @returns O equipamento atualizado
 * @throws Error com mensagem descritiva em caso de falha
 */
export async function updateEquipamentoApi(
  id: string,
  data: UpdateEquipamentoRequest
): Promise<Equipamento> {
  const response = await fetch(`${API_BASE}/equipamentos/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error ?? `Erro ao atualizar equipamento (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Remove um equipamento do sistema.
 *
 * DELETE /api/equipamentos/:id
 * Restrito a ADMIN e GESTOR.
 *
 * @param id - UUID do equipamento
 * @throws Error com mensagem descritiva em caso de falha
 */
export async function deleteEquipamentoApi(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/equipamentos/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error ?? `Erro ao remover equipamento (status ${response.status})`
    );
  }
}

export interface BulkStatusUpdateResponse {
  sucesso: string[];
  falhas: {
    id: string;
    nome: string;
    tag: string;
    motivo: string;
  }[];
}

export interface EquipamentoAuditoria {
  id: string;
  equipamentoId: string;
  usuarioId: string | null;
  usuario: {
    id: string;
    nome: string;
    nomeUsuario: string;
  } | null;
  statusAnterior: StatusEquipamento;
  statusNovo: StatusEquipamento;
  detalhes: string | null;
  criadoEm: string;
}

/**
 * Altera o status de múltiplos equipamentos em lote.
 *
 * POST /api/equipamentos/bulk-status
 * Restrito a ADMIN e GESTOR.
 */
export async function bulkUpdateEquipamentosStatusApi(
  ids: string[],
  status: StatusEquipamento
): Promise<BulkStatusUpdateResponse> {
  const response = await fetch(`${API_BASE}/equipamentos/bulk-status`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ids, status }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error ?? `Erro ao atualizar status dos equipamentos em lote (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Busca o histórico de auditoria de alterações de status de um equipamento.
 *
 * GET /api/equipamentos/:id/auditoria
 * Acessível por todos os perfis autenticados.
 */
export async function getEquipamentoAuditoriaApi(
  id: string
): Promise<EquipamentoAuditoria[]> {
  const response = await fetch(`${API_BASE}/equipamentos/${id}/auditoria`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error ?? `Erro ao buscar histórico de auditoria (status ${response.status})`
    );
  }

  return response.json();
}
