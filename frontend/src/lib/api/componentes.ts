/**
 * Serviço de API — Componentes
 *
 * Centraliza as chamadas HTTP ao back-end relacionadas ao módulo
 * de gestão de componentes mecânicos. As rotas são aninhadas sob
 * equipamentos: /api/equipamentos/:equipamentoId/componentes
 *
 * Cada componente retornado inclui o campo `desgastePct` calculado
 * pelo back-end, pronto para exibição nas barras de progresso.
 */

import type { Componente } from "@/types/equipamento.types";

/** URL base da API back-end */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

/**
 * Componente enriquecido com o percentual de desgaste calculado pelo back-end.
 */
export interface ComponenteComDesgaste extends Componente {
  desgastePct: number;
}

/**
 * Payload para criação de um novo componente.
 */
export interface CreateComponenteRequest {
  nome: string;
  tipo: string;
  vidaUtilNominal: number; // Obrigatório — vida útil em horas
  horasOperacionais?: number; // Opcional — padrão 0
}

/**
 * Payload para atualização parcial de um componente.
 */
export interface UpdateComponenteRequest {
  nome?: string;
  tipo?: string;
  vidaUtilNominal?: number;
  horasOperacionais?: number;
}

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
 * Lista todos os componentes de um equipamento.
 * Os componentes são ordenados por desgaste decrescente (mais críticos primeiro).
 *
 * GET /api/equipamentos/:equipamentoId/componentes
 *
 * @param equipamentoId - UUID do equipamento pai
 * @returns Array de componentes com desgastePct
 */
export async function listComponentesApi(
  equipamentoId: string
): Promise<ComponenteComDesgaste[]> {
  const response = await fetch(
    `${API_BASE}/equipamentos/${equipamentoId}/componentes`,
    { method: "GET", headers: authHeaders() }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      err?.error ?? `Erro ao listar componentes (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Cria um novo componente vinculado a um equipamento.
 *
 * POST /api/equipamentos/:equipamentoId/componentes
 *
 * @param equipamentoId - UUID do equipamento pai
 * @param data - Dados do novo componente
 * @returns O componente criado com desgastePct
 */
export async function createComponenteApi(
  equipamentoId: string,
  data: CreateComponenteRequest
): Promise<ComponenteComDesgaste> {
  const response = await fetch(
    `${API_BASE}/equipamentos/${equipamentoId}/componentes`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      err?.error ?? `Erro ao criar componente (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Atualiza um componente existente.
 *
 * PUT /api/equipamentos/:equipamentoId/componentes/:id
 *
 * @param equipamentoId - UUID do equipamento pai
 * @param id - UUID do componente
 * @param data - Campos a atualizar
 * @returns O componente atualizado com desgastePct
 */
export async function updateComponenteApi(
  equipamentoId: string,
  id: string,
  data: UpdateComponenteRequest
): Promise<ComponenteComDesgaste> {
  const response = await fetch(
    `${API_BASE}/equipamentos/${equipamentoId}/componentes/${id}`,
    {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      err?.error ?? `Erro ao atualizar componente (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Remove um componente do sistema.
 *
 * DELETE /api/equipamentos/:equipamentoId/componentes/:id
 *
 * @param equipamentoId - UUID do equipamento pai
 * @param id - UUID do componente
 */
export async function deleteComponenteApi(
  equipamentoId: string,
  id: string
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/equipamentos/${equipamentoId}/componentes/${id}`,
    { method: "DELETE", headers: authHeaders() }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      err?.error ?? `Erro ao remover componente (status ${response.status})`
    );
  }
}
