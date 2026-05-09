/**
 * Tipos globais — Módulo de Usuários
 *
 * Define as interfaces TypeScript para o módulo de autenticação
 * e controle de acesso do sistema Mecâni.cão PCM.
 *
 * No contexto de PCM, existem 3 perfis com responsabilidades distintas:
 * - ADMIN: Administrador geral do sistema (acesso total)
 * - GESTOR: Gerente de manutenção (gerencia equipamentos, aprova reportes)
 * - TECNICO: Técnico de campo (registra diagnósticos e reportes)
 */

/**
 * Níveis de acesso do sistema.
 * Cada nível define quais funcionalidades o usuário pode acessar.
 */
export type NivelUsuario = "ADMIN" | "GESTOR" | "TECNICO";

/**
 * Interface que representa um usuário do sistema.
 * Espelha a entidade User do back-end (sem o campo senha).
 */
export interface Usuario {
  id: string;
  nomeUsuario: string; // Nome de login (único)
  nome: string; // Nome completo para exibição
  nivel: NivelUsuario; // Perfil de acesso
}

/**
 * Payload enviado na requisição de login.
 */
export interface LoginRequest {
  nomeUsuario: string;
  senha: string;
}

/**
 * Resposta da API após login bem-sucedido.
 * Contém o token JWT e os dados do usuário autenticado.
 */
export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

/**
 * Resposta padrão de erro da API.
 */
export interface ApiError {
  error: string;
  details?: unknown;
}
