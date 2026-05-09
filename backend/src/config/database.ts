/**
 * Configuração do DataSource — TypeORM + MySQL
 *
 * Este arquivo define a conexão central com o banco de dados MySQL
 * usando o TypeORM DataSource. É inicializado uma única vez no
 * boot do servidor e reutilizado em toda a aplicação.
 *
 * O TypeORM utiliza este DataSource para:
 * - Estabelecer e gerenciar a conexão com o MySQL
 * - Registrar todas as entidades (mapeamento tabela ↔ classe)
 * - Executar e rastrear migrations de schema
 *
 * As credenciais são lidas das variáveis de ambiente (.env)
 * para nunca expor dados sensíveis no código-fonte.
 */

import "reflect-metadata";
import { DataSource } from "typeorm";
import { env } from "./env";

/**
 * DataSource principal da aplicação Mecâni.cão PCM.
 *
 * Configuração para MySQL 8+ usando o driver mysql2.
 * Em desenvolvimento, o logging SQL fica ativo para facilitar debugging.
 */
export const AppDataSource = new DataSource({
  type: "mysql",
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,

  /**
   * Registra automaticamente todas as entidades TypeORM.
   * Cada arquivo .entity.ts na pasta /entities será escaneado.
   */
  entities: [__dirname + "/../entities/**/*.entity.{ts,js}"],

  /**
   * Registra as migrations para controle de versionamento do schema.
   * Cada arquivo na pasta /migrations será escaneado.
   */
  migrations: [__dirname + "/../migrations/**/*.{ts,js}"],

  /**
   * synchronize: false — NUNCA usar true em produção!
   * Em produção, use sempre migrations para evoluir o schema.
   * Em desenvolvimento, pode ser true para agilizar prototipagem.
   */
  synchronize: env.NODE_ENV === "development",

  /**
   * Exibe as queries SQL no console em modo desenvolvimento.
   * Útil para debugging e otimização de consultas.
   */
  logging: env.NODE_ENV === "development",

  /**
   * Charset utf8mb4 para suporte completo a caracteres especiais
   * (acentos, emojis, caracteres técnicos).
   */
  charset: "utf8mb4",
});
