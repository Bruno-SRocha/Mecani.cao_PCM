/**
 * Entry Point — Servidor Express (Mecâni.cão PCM API)
 *
 * Arquivo principal que inicializa a aplicação:
 * 1. Carrega as variáveis de ambiente (.env)
 * 2. Importa reflect-metadata (obrigatório para TypeORM decorators)
 * 3. Conecta ao banco de dados MySQL via TypeORM DataSource
 * 4. Configura middlewares globais (CORS, JSON parser)
 * 5. Registra as rotas da API
 * 6. Cria um usuário admin padrão (se não existir)
 * 7. Inicia o servidor HTTP na porta configurada
 *
 * O servidor só aceita requisições APÓS a conexão com o banco
 * ser estabelecida com sucesso, garantindo que a API está pronta.
 */

import "reflect-metadata";
import express from "express";
import cors from "cors";

import { env } from "./config/env";
import { AppDataSource } from "./config/database";
import authRoutes from "./routes/auth.routes";
import equipamentoRoutes from "./routes/equipamento.routes";
import componenteRoutes from "./routes/componente.routes";
import { diagnosticoEquipamentoRoutes, diagnosticoRoutes } from "./routes/diagnostico.routes";
import ordemManutencaoRoutes, { usuariosRouter } from "./routes/ordemmanutencao.routes";
import { reporteComponenteRouter, reporteGlobalRouter } from "./routes/reporte-substituicao.routes";
import {
  solicitacaoModificacaoEquipamentoRouter,
  solicitacaoModificacaoGlobalRouter,
} from "./routes/solicitacao-modificacao.routes";
import { seedAdminUser } from "./config/seed";
import { seedEquipamentos } from "./config/seed-equipamentos";
import { seedReportes } from "./config/seed-reportes";

const app = express();

/* ---------------------------------------------------------------
   Middlewares Globais
   --------------------------------------------------------------- */

/**
 * CORS — Cross-Origin Resource Sharing
 * Permite que o front-end (Next.js em localhost:3000) faça
 * requisições para esta API (Express em localhost:3333).
 */
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

/**
 * Parser JSON — Interpreta o body das requisições como JSON.
 * Limite de 10mb para permitir payloads maiores (ex: uploads futuros).
 */
app.use(express.json({ limit: "10mb" }));

/* ---------------------------------------------------------------
   Rota de saúde (health check)
   Permite verificar se a API está online sem autenticação.
   --------------------------------------------------------------- */
app.get("/api/health", (_req, res) => {
  res.json({
    status: "online",
    sistema: "MECÂNI.CÃO PCM API",
    versao: "2.0",
    timestamp: new Date().toISOString(),
  });
});

/* ---------------------------------------------------------------
   Registro de Rotas da API
   Cada módulo tem seu arquivo de rotas em /routes/.
   --------------------------------------------------------------- */
app.use("/api/auth", authRoutes);
app.use("/api/equipamentos", equipamentoRoutes);
app.use("/api/equipamentos/:equipamentoId/componentes", componenteRoutes);
app.use("/api/equipamentos/:equipamentoId/diagnosticos", diagnosticoEquipamentoRoutes);
app.use("/api/diagnosticos", diagnosticoRoutes);
app.use("/api/ordens-manutencao", ordemManutencaoRoutes);
app.use("/api/usuarios", usuariosRouter);
app.use("/api/equipamentos/:equipamentoId/componentes/:componenteId/reportes", reporteComponenteRouter);
app.use("/api/reportes", reporteGlobalRouter);
app.use("/api/equipamentos/:equipamentoId/solicitacoes-modificacao", solicitacaoModificacaoEquipamentoRouter);
app.use("/api/solicitacoes-modificacao", solicitacaoModificacaoGlobalRouter);

/* ---------------------------------------------------------------
   Inicialização: Conexão com banco + Start do servidor
   --------------------------------------------------------------- */

/**
 * Inicializa a conexão com o banco de dados MySQL via TypeORM.
 * Somente após a conexão bem-sucedida o servidor HTTP é iniciado.
 *
 * Se a conexão falhar, o processo é encerrado com código de erro
 * para que o gerenciador de processos (PM2, Docker, etc.) possa
 * reiniciar automaticamente.
 */
AppDataSource.initialize()
  .then(async () => {
    console.log("✅ Banco de dados conectado (MySQL via TypeORM)");

    /* Cria o usuário administrador padrão se não existir */
    await seedAdminUser();

    /* Cria equipamentos de demonstração se não existirem */
    await seedEquipamentos();

    /* Cria usuários de teste e reportes de demonstração se não existirem */
    await seedReportes();

    /* Inicia o servidor HTTP */
    app.listen(env.PORT, () => {
      console.log(`🚀 MECÂNI.CÃO PCM API rodando em http://localhost:${env.PORT}`);
      console.log(`📋 Health check: http://localhost:${env.PORT}/api/health`);
      console.log(`🔑 Login: POST http://localhost:${env.PORT}/api/auth/login`);
    });
  })
  .catch((error) => {
    console.error("❌ Erro ao conectar com o banco de dados:", error);
    process.exit(1);
  }); // Reload triggered
