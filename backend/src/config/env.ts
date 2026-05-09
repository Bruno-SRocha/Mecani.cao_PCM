/**
 * Configuração de Variáveis de Ambiente
 *
 * Carrega e valida as variáveis de ambiente a partir do arquivo .env.
 * Centraliza o acesso às configurações para evitar strings "mágicas"
 * espalhadas pelo código.
 *
 * Utiliza o pacote dotenv para carregar automaticamente o arquivo .env
 * na raiz do projeto backend.
 */

import dotenv from "dotenv";

/* Carrega as variáveis de ambiente do arquivo .env */
dotenv.config();

/**
 * Objeto centralizado de configuração do ambiente.
 *
 * Todas as variáveis são lidas uma única vez na inicialização
 * e ficam disponíveis como propriedades tipadas.
 */
export const env = {
  /* Ambiente de execução (development | production | test) */
  NODE_ENV: process.env.NODE_ENV ?? "development",

  /* Servidor Express */
  PORT: Number(process.env.PORT) || 3333,

  /* Banco de dados MySQL */
  DB_HOST: process.env.DB_HOST ?? "localhost",
  DB_PORT: Number(process.env.DB_PORT) || 3306,
  DB_USER: process.env.DB_USER ?? "root",
  DB_PASS: process.env.DB_PASS ?? "",
  DB_NAME: process.env.DB_NAME ?? "mecanicao_pcm",

  /* JWT — Autenticação */
  JWT_SECRET: process.env.JWT_SECRET ?? "dev_secret_inseguro",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "8h",

  /* CORS — Origem permitida */
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:3000",
};
