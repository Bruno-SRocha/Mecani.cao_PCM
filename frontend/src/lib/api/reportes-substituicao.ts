/**
 * Serviço de API — Reportes de Substituição de Componente
 *
 * Centraliza as chamadas HTTP ao back-end relacionadas ao módulo
 * de reportes de substituição de peças mecânicas.
 *
 * Fluxo:
 *   Técnico cria reporte → Status: AGUARDANDO_APROVACAO
 *   Gestor/Admin aprova → Status: APROVADO (componente atualizado)
 *   Gestor/Admin rejeita → Status: REJEITADO
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

/* ── Tipos ────────────────────────────────────────────────── */

export type StatusReporte =
  | "AGUARDANDO_APROVACAO"
  | "APROVADO"
  | "REJEITADO";

export interface ReporteSubstituicao {
  id: string;
  pecaInstalada: string;
  vidaUtilNovaPeca: number;
  dataSubstituicao: string;
  observacoes: string | null;
  status: StatusReporte;
  motivoRejeicao: string | null;
  componenteId: string;
  equipamentoId: string;
  tecnicoId: string | null;
  aprovadorId: string | null;
  decididoEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
  /** Relações eager do back-end */
  componente?: {
    id: string;
    nome: string;
    tipo: string;
    vidaUtilNominal: number;
    horasOperacionais: number;
  };
  equipamento?: {
    id: string;
    nome: string;
    tag: string;
    localizacao: string;
  };
  tecnico?: {
    id: string;
    nome: string;
    nomeUsuario: string;
    nivel: string;
  };
  aprovador?: {
    id: string;
    nome: string;
    nomeUsuario: string;
    nivel: string;
  } | null;
}

export interface CreateReporteRequest {
  pecaInstalada: string;
  vidaUtilNovaPeca: number;
  dataSubstituicao: string; // YYYY-MM-DD
  observacoes?: string;
}

/* ── Helpers ─────────────────────────────────────────────── */

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/* ── API Functions ───────────────────────────────────────── */

/**
 * Cria um reporte de substituição de componente.
 * Acessível por todos os perfis autenticados.
 *
 * POST /api/equipamentos/:equipamentoId/componentes/:componenteId/reportes
 */
export async function createReporteApi(
  equipamentoId: string,
  componenteId: string,
  data: CreateReporteRequest
): Promise<ReporteSubstituicao> {
  const response = await fetch(
    `${API_BASE}/equipamentos/${equipamentoId}/componentes/${componenteId}/reportes`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      err?.error ?? `Erro ao criar reporte (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Lista reportes de um componente específico.
 *
 * GET /api/equipamentos/:equipamentoId/componentes/:componenteId/reportes
 */
export async function listReportesByComponenteApi(
  equipamentoId: string,
  componenteId: string
): Promise<ReporteSubstituicao[]> {
  const response = await fetch(
    `${API_BASE}/equipamentos/${equipamentoId}/componentes/${componenteId}/reportes`,
    { method: "GET", headers: authHeaders() }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      err?.error ?? `Erro ao listar reportes (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Lista todos os reportes pendentes de aprovação.
 * Restrito a GESTOR/ADMIN.
 *
 * GET /api/reportes/pendentes
 */
export async function listPendentesApi(): Promise<ReporteSubstituicao[]> {
  const response = await fetch(`${API_BASE}/reportes/pendentes`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      err?.error ?? `Erro ao listar pendentes (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Conta reportes pendentes para o badge de notificação.
 *
 * GET /api/reportes/pendentes/count
 */
export async function countPendentesApi(): Promise<number> {
  const response = await fetch(`${API_BASE}/reportes/pendentes/count`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) return 0;

  const data = await response.json();
  return data.count ?? 0;
}

/**
 * Lista todos os reportes do sistema.
 * Restrito a GESTOR/ADMIN.
 *
 * GET /api/reportes
 */
export async function listAllReportesApi(): Promise<ReporteSubstituicao[]> {
  const response = await fetch(`${API_BASE}/reportes`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      err?.error ?? `Erro ao listar reportes (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Aprova um reporte. Atualiza automaticamente o componente no back-end.
 * Restrito a GESTOR/ADMIN.
 *
 * PATCH /api/reportes/:id/aprovar
 */
export async function aprovarReporteApi(
  id: string
): Promise<ReporteSubstituicao> {
  const response = await fetch(`${API_BASE}/reportes/${id}/aprovar`, {
    method: "PATCH",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      err?.error ?? `Erro ao aprovar reporte (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Rejeita um reporte. O componente NÃO é alterado.
 * Restrito a GESTOR/ADMIN.
 *
 * PATCH /api/reportes/:id/rejeitar
 */
export async function rejeitarReporteApi(
  id: string,
  motivoRejeicao: string
): Promise<ReporteSubstituicao> {
  const response = await fetch(`${API_BASE}/reportes/${id}/rejeitar`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ motivoRejeicao }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(
      err?.error ?? `Erro ao rejeitar reporte (status ${response.status})`
    );
  }

  return response.json();
}
