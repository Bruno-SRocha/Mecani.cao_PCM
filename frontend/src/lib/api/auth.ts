/**
 * Serviço de API — Autenticação e Gestão de Usuários
 *
 * Centraliza as chamadas HTTP ao back-end relacionadas ao módulo
 * de autenticação e gerenciamento de usuários.
 */

import type { LoginRequest, LoginResponse, Usuario, NivelUsuario } from "@/types/usuario.types";

/** URL base da API back-end */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333/api";

/**
 * Realiza a autenticação do usuário no back-end.
 */
export async function loginApi(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error ?? `Erro ao fazer login (status ${response.status})`
    );
  }

  return response.json();
}

/**
 * Retorna todos os usuários cadastrados.
 * Requer token JWT de ADMIN.
 */
export async function listUsersApi(token: string): Promise<Usuario[]> {
  const response = await fetch(`${API_BASE}/auth/users`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error ?? "Erro ao carregar usuários.");
  }

  return response.json();
}

/**
 * Cria um novo usuário no sistema.
 * Requer token JWT de ADMIN.
 */
export async function createUserApi(
  token: string,
  data: { nomeUsuario: string; nome: string; email: string; nivel: NivelUsuario }
): Promise<Usuario & { senhaGerada: string }> {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error ?? "Erro ao criar usuário.");
  }

  return response.json();
}

/**
 * Atualiza um usuário existente.
 * Requer token JWT de ADMIN.
 */
export async function updateUserApi(
  token: string,
  id: string,
  data: { nome: string; email: string; nivel: NivelUsuario }
): Promise<Usuario> {
  const response = await fetch(`${API_BASE}/auth/users/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error ?? "Erro ao atualizar usuário.");
  }

  return response.json();
}

/**
 * Exclui um usuário.
 * Requer token JWT de ADMIN.
 */
export async function deleteUserApi(token: string, id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/users/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error ?? "Erro ao excluir usuário.");
  }
}

/**
 * Altera a senha do próprio usuário logado.
 * Requer token JWT.
 */
export async function changePasswordApi(
  token: string,
  data: { senhaAtual: string; novaSenha: string }
): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/change-password`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error ?? "Erro ao alterar senha.");
  }
}

/**
 * Solicita o e-mail de recuperação de senha.
 */
export async function requestPasswordResetApi(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/auth/request-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error ?? "Erro ao processar solicitação de recuperação.");
  }

  return response.json();
}

/**
 * Efetivamente redefine a senha utilizando o token de segurança.
 */
export async function resetPasswordApi(
  token: string,
  novaSenha: string
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, novaSenha }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error ?? "Erro ao redefinir a senha.");
  }

  return response.json();
}
