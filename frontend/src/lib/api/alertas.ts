import { Componente } from "@/types/equipamento.types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

export interface ComponenteComEquipamento extends Componente {
  equipamento?: {
    id: string;
    nome: string;
    tag: string;
  };
}

export interface Alerta {
  id: string;
  mensagem: string;
  tipo: string;
  lido: boolean;
  componenteId: string;
  componente?: ComponenteComEquipamento;
  criadoEm: string;
}

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function listAlertasApi(apenasNaoLidos: boolean = false): Promise<Alerta[]> {
  const response = await fetch(`${API_BASE}/alertas?apenasNaoLidos=${apenasNaoLidos}`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao listar alertas (status ${response.status})`);
  }

  return response.json();
}

export async function countNaoLidosApi(): Promise<number> {
  const response = await fetch(`${API_BASE}/alertas/nao-lidos/count`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao contar alertas não lidos (status ${response.status})`);
  }

  const data = await response.json();
  return data.count;
}

export async function marcarLidoApi(id: string): Promise<Alerta> {
  const response = await fetch(`${API_BASE}/alertas/${id}/lido`, {
    method: "PUT",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao marcar alerta como lido (status ${response.status})`);
  }

  return response.json();
}

export async function marcarTodosLidosApi(): Promise<void> {
  const response = await fetch(`${API_BASE}/alertas/lido/todos`, {
    method: "PUT",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao marcar todos os alertas como lidos (status ${response.status})`);
  }
}
