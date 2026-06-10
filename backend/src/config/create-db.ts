import mysql from "mysql2/promise";
import { env } from "./env";
import { URL } from "url";

/**
 * Script utilitário executado antes do início do servidor ou das migrations.
 * Ele conecta ao servidor MySQL e garante que o banco de dados configurado exista.
 * Isso evita falhas de "Unknown database 'mecanicao_pcm'" no primeiro deploy.
 */
async function ensureDatabaseExists() {
  let connectionConfig: any = {};
  let dbName = env.DB_NAME;

  try {
    if (env.DATABASE_URL) {
      const urlObj = new URL(env.DATABASE_URL);
      dbName = urlObj.pathname.substring(1) || env.DB_NAME;
      
      // Limpa a rota para conectar na raiz do MySQL
      urlObj.pathname = "/";
      
      console.log(`[Database Setup] Conectando via DATABASE_URL para garantir banco: "${dbName}"`);
      const connection = await mysql.createConnection(urlObj.toString());
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await connection.end();
      console.log(`[Database Setup] ✅ Banco de dados "${dbName}" verificado/criado com sucesso.`);
    } else {
      connectionConfig = {
        host: env.DB_HOST,
        port: env.DB_PORT,
        user: env.DB_USER,
        password: env.DB_PASS,
      };

      if (env.DB_SOCKET) {
        connectionConfig.socketPath = env.DB_SOCKET;
      }

      console.log(`[Database Setup] Conectando via credenciais para garantir banco: "${dbName}"`);
      const connection = await mysql.createConnection(connectionConfig);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
      await connection.end();
      console.log(`[Database Setup] ✅ Banco de dados "${dbName}" verificado/criado com sucesso.`);
    }
  } catch (error: any) {
    console.warn(`[Database Setup] ⚠️ Não foi possível criar ou verificar o banco de dados "${dbName}":`, error.message || error);
    console.warn("[Database Setup] Prosseguindo e esperando que o banco de dados já exista ou seja criado de outra forma...");
  }
}

ensureDatabaseExists();
