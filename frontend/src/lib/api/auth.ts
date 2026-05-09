/**
 * Serviço de API — Autenticação
 *
 * Centraliza as chamadas HTTP ao back-end relacionadas ao módulo
 * de autenticação (login/logout). Utiliza fetch nativo do browser.
 *
 * A URL base da API é configurada via variável de ambiente
 * NEXT_PUBLIC_API_URL para facilitar a troca entre ambientes
 * (desenvolvimento, staging, produção).
 */

import type { LoginRequest, LoginResponse } from "@/types/usuario.types";

/** URL base da API back-end */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

/**
 * Realiza a autenticação do usuário no back-end.
 *
 * Envia as credenciais (nomeUsuario + senha) para a rota POST /auth/login
 * e retorna o token JWT + dados do usuário em caso de sucesso.
 *
 * @param credentials - Objeto com nomeUsuario e senha
 * @returns Promise com o token JWT e dados do usuário autenticado
 * @throws Error com mensagem descritiva em caso de falha
 */
export async function loginApi(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  /* Se a resposta não for OK, extrai a mensagem de erro da API */
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error ?? `Erro ao fazer login (status ${response.status})`
    );
  }

  return response.json();
}
