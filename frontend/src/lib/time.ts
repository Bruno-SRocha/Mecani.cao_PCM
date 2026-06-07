/**
 * Utilitários de Data e Hora sincronizados com o servidor e formatados no fuso de Brasília (UTC-3).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

let serverTimeOffset = 0;
let isOffsetLoaded = false;
let syncPromise: Promise<number> | null = null;

/**
 * Inicializa a sincronização do horário do servidor.
 * Calcula a diferença entre o relógio do servidor e o do cliente.
 */
export async function syncServerTime(): Promise<number> {
  if (isOffsetLoaded) return serverTimeOffset;
  if (syncPromise) return syncPromise;

  syncPromise = (async () => {
    try {
      const start = Date.now();
      const response = await fetch(`${API_BASE}/health`, { cache: "no-store" });
      if (!response.ok) throw new Error("Falha no healthcheck");
      const data = await response.json();
      const clientReceiveTime = Date.now();

      const rtt = clientReceiveTime - start;
      const serverTime = new Date(data.timestamp).getTime();

      // Ajusta o offset considerando o tempo de tráfego de rede (RTT / 2)
      serverTimeOffset = serverTime - clientReceiveTime + Math.floor(rtt / 2);
      isOffsetLoaded = true;
      return serverTimeOffset;
    } catch (error) {
      console.error("Erro ao sincronizar com relógio do servidor, utilizando fallback local:", error);
      // Fallback: sem offset (relógio do cliente)
      serverTimeOffset = 0;
      isOffsetLoaded = true;
      return serverTimeOffset;
    } finally {
      syncPromise = null;
    }
  })();

  return syncPromise;
}

/**
 * Retorna o objeto Date atual correspondente ao horário do servidor sincronizado.
 */
export function getSyncedDate(): Date {
  return new Date(Date.now() + serverTimeOffset);
}

/**
 * Formata um objeto Date ou string/number para data e hora no fuso de Brasília (America/Sao_Paulo / UTC-3).
 * Exemplo de output: "14:30 25/12/26"
 */
export function formatToBrasilia(
  d: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  if (!d) return "—";

  try {
    const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "—";

    return date.toLocaleString("pt-BR", {
      ...options,
      timeZone: "America/Sao_Paulo",
    });
  } catch (error) {
    console.error("Erro ao formatar data para fuso de Brasília:", error);
    return "—";
  }
}

/**
 * Formata apenas a data no fuso de Brasília.
 */
export function formatToBrasiliaDate(
  d: Date | string | number | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }
): string {
  if (!d) return "—";

  try {
    const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "—";

    return date.toLocaleDateString("pt-BR", {
      ...options,
      timeZone: "America/Sao_Paulo",
    });
  } catch (error) {
    console.error("Erro ao formatar data para fuso de Brasília:", error);
    return "—";
  }
}

/**
 * Retorna se o offset já foi carregado e sincronizado com o servidor.
 */
export function isSynced(): boolean {
  return isOffsetLoaded;
}

/**
 * Retorna uma string no formato YYYY-MM-DD correspondente ao fuso de Brasília.
 */
export function getBrasiliaDateString(d: Date = getSyncedDate()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = formatter.formatToParts(d);
    const year = parts.find(p => p.type === "year")?.value;
    const month = parts.find(p => p.type === "month")?.value;
    const day = parts.find(p => p.type === "day")?.value;
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Erro ao obter string de data Brasília:", error);
    return d.toISOString().split("T")[0];
  }
}
