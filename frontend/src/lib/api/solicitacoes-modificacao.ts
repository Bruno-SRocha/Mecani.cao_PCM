/**
 * Serviço de API — Solicitações de Modificação
 *
 * Centraliza as chamadas HTTP ao back-end relacionadas ao módulo
 * de solicitação de modificação de equipamentos e BOM.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

export type TipoModificacao = "ADICAO" | "SUBSTITUICAO_TECNOLOGIA" | "REMOCAO";
export type StatusModificacao = "PENDENTE" | "EM_IMPLEMENTACAO" | "CONCLUIDO";

export interface ComponenteRef {
  id: string;
  nome: string;
  tipo: string;
  vidaUtilNominal: number;
  horasOperacionais: number;
  modificado: boolean;
}

export interface SolicitacaoModificacao {
  id: string;
  equipamentoId: string;
  tipoModificacao: TipoModificacao;
  justificativa: string;
  componenteSaidaId: string | null;
  componenteSaida: ComponenteRef | null;
  componenteEntradaId: string | null;
  componenteEntrada: ComponenteRef | null;
  novoComponenteNome: string | null;
  novoComponenteTipo: string | null;
  novoComponenteVidaUtilNominal: number | null;
  parecerEngenharia: string | null;
  status: StatusModificacao;
  dataImplementacao: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateModificacaoRequest {
  tipoModificacao: TipoModificacao;
  justificativa: string;
  componenteSaidaId?: string;
  novoComponenteNome?: string;
  novoComponenteTipo?: string;
  novoComponenteVidaUtilNominal?: number;
}

export interface FinalizarModificacaoRequest {
  parecerEngenharia?: string;
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Cria uma solicitação de modificação para um equipamento.
 */
export async function createModificacaoApi(
  equipamentoId: string,
  data: CreateModificacaoRequest
): Promise<SolicitacaoModificacao> {
  const response = await fetch(
    `${API_BASE}/equipamentos/${equipamentoId}/solicitacoes-modificacao`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao criar solicitação (status ${response.status})`);
  }

  return response.json();
}

/**
 * Lista as solicitações de modificação de um equipamento.
 */
export async function listModificacoesByEquipamentoApi(
  equipamentoId: string
): Promise<SolicitacaoModificacao[]> {
  const response = await fetch(
    `${API_BASE}/equipamentos/${equipamentoId}/solicitacoes-modificacao`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao listar solicitações (status ${response.status})`);
  }

  return response.json();
}

/**
 * Lista todas as solicitações de modificação do sistema (apenas Admin/Gestor).
 */
export async function listAllModificacoesApi(): Promise<SolicitacaoModificacao[]> {
  const response = await fetch(`${API_BASE}/solicitacoes-modificacao`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao listar todas as solicitações (status ${response.status})`);
  }

  return response.json();
}

/**
 * Obtém detalhes de uma solicitação específica.
 */
export async function getModificacaoApi(id: string): Promise<SolicitacaoModificacao> {
  const response = await fetch(`${API_BASE}/solicitacoes-modificacao/${id}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao obter solicitação (status ${response.status})`);
  }

  return response.json();
}

/**
 * Inicia a implementação de uma modificação.
 */
export async function iniciarImplementacaoModificacaoApi(
  id: string
): Promise<SolicitacaoModificacao> {
  const response = await fetch(`${API_BASE}/solicitacoes-modificacao/${id}/iniciar`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao iniciar modificação (status ${response.status})`);
  }

  return response.json();
}

/**
 * Finaliza e aprova uma modificação, aplicando as alterações na BOM.
 */
export async function finalizarModificacaoApi(
  id: string,
  data: FinalizarModificacaoRequest
): Promise<SolicitacaoModificacao> {
  const response = await fetch(`${API_BASE}/solicitacoes-modificacao/${id}/finalizar`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao finalizar modificação (status ${response.status})`);
  }

  return response.json();
}
