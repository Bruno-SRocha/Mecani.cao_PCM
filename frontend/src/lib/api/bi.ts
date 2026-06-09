const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

function authHeaders(): Record<string, string> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface DisponibilidadeMensal {
  mes: string;
  disponibilidade: number;
  meta: number;
}

export interface MtbfAtivo {
  id: string;
  nome: string;
  tag: string;
  tipo: string;
  mtbf: number;
}

export interface MixManutencao {
  tipo: string;
  quantidade: number;
  percentual: number;
}

export interface BacklogPrioridade {
  prioridade: string;
  horas: number;
}

export interface RulComponente {
  id: string;
  nome: string;
  tipo: string;
  tagEquipamento: string;
  nomeEquipamento: string;
  vidaRemanescenteHoras: number;
  previsaoTrocaDias: number;
  desgastePct: number;
}

export interface ConsumoPeca {
  peca: string;
  quantidade: number;
}

export interface BiMetrics {
  uptimeGeral: number;
  metaUptime: number;
  mtbfGeral: number;
  mttrHours: number;
  pmcAderencia: number;
  backlogDias: number;
  backlogHoras: number;
  tcoTotal: number;
  taxaMortalidadeInfantil: number;
  disponibilidadeGrafico: DisponibilidadeMensal[];
  mtbfPorAtivo: MtbfAtivo[];
  mixData: MixManutencao[];
  backlogGrafico: BacklogPrioridade[];
  rulComponentes: RulComponente[];
  consumoLotes: ConsumoPeca[];
}

export async function getBiMetricsApi(): Promise<BiMetrics> {
  const response = await fetch(`${API_BASE}/bi/metrics`, {
    method: "GET",
    headers: authHeaders(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => null);
    throw new Error(err?.error ?? `Erro ao obter métricas de BI (status ${response.status})`);
  }

  return response.json();
}
