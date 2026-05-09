const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface Diagnostico {
  id: string;
  data: string;
  severidade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  texto: string;
  criadoEm: string;
  atualizadoEm: string;
  autor: {
    id: string;
    nome: string;
    nomeUsuario: string;
    nivel: string;
  };
}

export interface DiagnosticoHistorico {
  id: string;
  dataEdicao: string;
  severidadeAnterior: string;
  textoAnterior: string;
  editor: {
    id: string;
    nome: string;
  };
}

export async function listarDiagnosticos(equipamentoId: string): Promise<Diagnostico[]> {
  const res = await fetch(`${API_BASE}/equipamentos/${equipamentoId}/diagnosticos`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erro ao listar diagnósticos");
  return res.json();
}

export async function criarDiagnostico(
  equipamentoId: string,
  dados: { data: string; severidade: string; texto: string }
): Promise<Diagnostico> {
  const res = await fetch(`${API_BASE}/equipamentos/${equipamentoId}/diagnosticos`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.erro || "Erro ao criar diagnóstico");
  }
  return res.json();
}

export async function editarDiagnostico(
  id: string,
  dados: { data?: string; severidade?: string; texto?: string }
): Promise<Diagnostico> {
  const res = await fetch(`${API_BASE}/diagnosticos/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.erro || "Erro ao editar diagnóstico");
  }
  return res.json();
}

export async function obterAuditoriaDiagnostico(id: string): Promise<DiagnosticoHistorico[]> {
  const res = await fetch(`${API_BASE}/diagnosticos/${id}/auditoria`, {
    headers: authHeaders(),
  });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.erro || "Erro ao carregar auditoria");
  }
  return res.json();
}
