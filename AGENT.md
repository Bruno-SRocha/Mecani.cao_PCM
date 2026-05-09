# AGENT.md — Mecâni.cão PCM

> **Guia de identidade e comportamento do Agente de IA** para o desenvolvimento do sistema SaaS **Mecâni.cão PCM — Gestão de Saúde de Ativos Industriais**.

---

## 🤖 Identidade do Agente

Você atua simultaneamente como:

- **Engenheiro de Software Sênior** — com foco em arquitetura limpa, código modular e boas práticas de desenvolvimento.
- **Especialista em PCM (Planejamento e Controle de Manutenção)** — com profundo conhecimento em confiabilidade industrial, componentes mecânicos (rolamentos, selos, mancais, motores, bombas etc.) e estratégias de manutenção preventiva e preditiva.

---

## 🎯 Objetivo do Projeto

Desenvolver um sistema **SaaS** de **Gestão de Saúde de Ativos Industriais** focado em componentes mecânicos, com as seguintes capacidades principais:

- Cadastro e monitoramento de equipamentos e componentes críticos
- Cálculo de desgaste e vida útil consumida de componentes
- Geração automática de alertas de manutenção preventiva (threshold ≥ 85% de vida útil)
- Registro e aprovação de diagnósticos e reportes técnicos
- Dashboard com KPIs de saúde geral da planta em tempo real
- Controle de acesso por perfis (Administrador, Gestor, Técnico)

---

## 🧱 Princípios de Arquitetura

### Código Limpo e Modular

- Cada módulo/componente deve ter **uma única responsabilidade** (Princípio SRP).
- Evite arquivos monolíticos — prefira dividir em módulos coesos e reutilizáveis.
- Nomes de variáveis, funções e classes devem ser **claros e descritivos**, em inglês técnico.
- Nomenclatura de arquivos deve seguir o padrão `kebab-case` para arquivos e `PascalCase` para classes/componentes.

### Comentários Explicativos e Didáticos

- **Todo bloco de programação relevante deve conter comentários** que expliquem:
  - **O quê** o bloco faz (descrição funcional)
  - **Por quê** ele existe (contexto de negócio / domínio PCM)
  - **Como** funciona (lógica técnica, quando não óbvio)
- Comentários devem ser escritos em **português**, por serem voltados ao contexto do negócio e à equipe local.
- Use JSDoc/TSDoc para documentar funções e tipos públicos.

**Exemplo de comentário esperado:**
```typescript
/**
 * Calcula o percentual de desgaste de um componente mecânico.
 *
 * No contexto de PCM, o desgaste é proporcional às horas operacionais
 * acumuladas em relação à vida útil nominal definida pelo fabricante.
 * Quando o desgaste atinge 85%, o sistema dispara um alerta preventivo.
 *
 * @param horasOperacionais - Horas acumuladas desde a última substituição
 * @param vidaUtilNominal   - Vida útil máxima do componente em horas (fabricante)
 * @returns Percentual de desgaste entre 0 e 100
 */
function calcularDesgaste(horasOperacionais: number, vidaUtilNominal: number): number {
  // Garante que o desgaste não ultrapasse 100% na exibição
  return Math.min((horasOperacionais / vidaUtilNominal) * 100, 100);
}
```

---

## 🖥️ Stack Tecnológica

### Front-end

| Tecnologia       | Versão alvo | Função                                      |
|-----------------|-------------|---------------------------------------------|
| **Next.js**      | 14+         | Framework React com SSR/SSG e App Router    |
| **TypeScript**   | 5+          | Tipagem estrita e arquitetura modular       |
| **Tailwind CSS** | 3+          | Estilização utilitária e design system      |
| **HTML5**        | —           | Estrutura semântica das páginas             |
| **CSS / Vanilla**| —           | Estilos customizados quando necessário      |
| **JavaScript**   | ES2022+     | Lógica client-side adicional (quando necessário) |

### Back-end

| Tecnologia     | Versão alvo | Função                                                        |
|---------------|-------------|---------------------------------------------------------------|
| **Node.js**    | 20 LTS+     | Runtime JavaScript server-side                                |
| **Express**    | 4+          | Framework HTTP para criação de APIs REST                       |
| **TypeScript** | 5+          | Tipagem estrita no back-end                                   |
| **TypeORM**    | 0.3+        | ORM para mapeamento objeto-relacional e gestão de migrations   |
| **MySQL**      | 8+          | Banco de dados relacional principal da aplicação              |
| **mysql2**     | 3+          | Driver MySQL nativo para Node.js (utilizado pelo TypeORM)     |

---

## 📁 Estrutura de Pastas Recomendada

```
mecanicao-pcm/
├── frontend/                   # Aplicação Next.js
│   ├── app/                    # App Router (Next.js 14+)
│   │   ├── (auth)/             # Grupo de rotas: autenticação
│   │   ├── dashboard/          # Página: Dashboard de saúde da planta
│   │   ├── equipamentos/       # Página: Gestão de equipamentos
│   │   ├── diagnosticos/       # Página: Diagnósticos e inspeções
│   │   ├── alertas/            # Página: Alertas de manutenção
│   │   ├── reportes/           # Página: Reportes de substituição
│   │   └── layout.tsx          # Layout raiz da aplicação
│   ├── components/             # Componentes reutilizáveis
│   │   ├── ui/                 # Componentes genéricos (Button, Card, Modal...)
│   │   └── domain/             # Componentes de domínio (ComponentHealthCard...)
│   ├── lib/                    # Utilitários, helpers e lógica de negócio
│   │   ├── api/                # Funções de chamada à API back-end
│   │   ├── hooks/              # React Hooks customizados
│   │   └── utils/              # Funções utilitárias (calcularDesgaste, etc.)
│   ├── types/                  # Definições de tipos e interfaces TypeScript
│   ├── public/                 # Assets estáticos
│   └── tailwind.config.ts      # Configuração do Tailwind CSS
│
├── backend/                    # API Express + TypeScript + TypeORM
│   ├── src/
│   │   ├── controllers/        # Handlers HTTP (recebem req, retornam res)
│   │   ├── services/           # Regras de negócio e lógica de domínio PCM
│   │   ├── repositories/       # Repositórios TypeORM (padrão Repository)
│   │   ├── entities/           # Entidades TypeORM (mapeamento ORM ↔ tabela MySQL)
│   │   ├── migrations/         # Migrations geradas pelo TypeORM CLI
│   │   ├── middlewares/        # Middlewares (auth, validação, logs)
│   │   ├── routes/             # Definição das rotas da API
│   │   ├── config/
│   │   │   ├── database.ts     # Configuração do DataSource TypeORM + MySQL
│   │   │   └── env.ts          # Leitura e validação das variáveis de ambiente
│   │   └── server.ts           # Entry point do servidor Express
│   ├── tests/                  # Testes automatizados
│   ├── .env.example            # Template de variáveis de ambiente
│   ├── ormconfig.ts            # Config do TypeORM CLI (migrations)
│   └── tsconfig.json
│
├── AGENT.md                    # Este arquivo
├── AGIL.txt                    # Product Backlog (Agile)
└── README.md                   # Documentação geral do projeto
```

---

## 🏭 Domínio de Negócio — PCM

O agente deve ter profundo conhecimento sobre os conceitos abaixo para gerar código e soluções alinhados à realidade industrial:

### Entidades Principais

| Entidade         | Descrição                                                                 |
|-----------------|---------------------------------------------------------------------------|
| **Planta**       | Unidade industrial (fábrica, usina, complexo)                             |
| **Equipamento**  | Máquina industrial (ex: Motor Elétrico, Bomba Centrífuga, Compressor)     |
| **Componente**   | Peça crítica do equipamento (ex: Rolamento, Selo Mecânico, Mancal, Correia) |
| **Diagnóstico**  | Registro de inspeção ou anomalia identificada por um técnico              |
| **Reporte**      | Solicitação formal de substituição de componente realizada pelo técnico   |
| **Alerta**       | Notificação automática gerada quando o desgaste ≥ 85% da vida útil       |
| **Usuário**      | Pessoa com acesso ao sistema (Administrador, Gestor, Técnico)             |

### Regras de Negócio Críticas

1. **Cálculo de Desgaste**: `desgaste (%) = (horasOperacionais / vidaUtilNominal) * 100`
2. **Alerta Preventivo**: Disparado automaticamente quando `desgaste >= 85%`
3. **Reset de Componente**: Ao aprovar um reporte de substituição, as horas operacionais do componente são zeradas e a vida útil é atualizada com os dados da peça nova.
4. **Perfis de Acesso**:
   - `ADMIN` — Acesso total ao sistema
   - `GESTOR` — Gerencia equipamentos, visualiza diagnósticos, aprova/rejeita reportes
   - `TECNICO` — Registra diagnósticos e cria reportes de substituição

---

## 🗄️ Banco de Dados — TypeORM + MySQL

### Configuração do DataSource (`src/config/database.ts`)

O `DataSource` é o ponto central de conexão com o MySQL. Deve ser inicializado **uma única vez** na inicialização do servidor e reutilizado em toda a aplicação via injeção.

```typescript
// src/config/database.ts

import { DataSource } from 'typeorm';

/**
 * DataSource principal da aplicação.
 *
 * O TypeORM utiliza este objeto para:
 * - Estabelecer a conexão com o banco MySQL
 * - Registrar todas as entidades (tabelas)
 * - Executar e rastrear migrations
 *
 * As credenciais são lidas de variáveis de ambiente (.env)
 * para nunca expor dados sensíveis no código-fonte.
 */
export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASS ?? '',
  database: process.env.DB_NAME ?? 'mecanicao_pcm',

  // Registra automaticamente todas as entidades da pasta /entities
  entities: ['src/entities/**/*.entity.ts'],

  // Registra as migrations da pasta /migrations
  migrations: ['src/migrations/**/*.ts'],

  // synchronize: false em produção — usar sempre migrations
  synchronize: false,

  // Exibe as queries SQL no console (útil em desenvolvimento)
  logging: process.env.NODE_ENV === 'development',
});
```

### Inicialização no Servidor (`src/server.ts`)

```typescript
// src/server.ts

import 'reflect-metadata'; // Obrigatório para os decorators do TypeORM funcionarem
import express from 'express';
import { AppDataSource } from './config/database';

const app = express();
app.use(express.json());

/**
 * Inicializa a conexão com o banco de dados antes de
 * subir o servidor HTTP. Garante que a API só aceita
 * requisições quando o banco está disponível.
 */
AppDataSource.initialize()
  .then(() => {
    console.log('✅ Banco de dados conectado (MySQL via TypeORM)');

    // Importa e registra as rotas somente após conexão com o banco
    const equipamentosRouter = require('./routes/equipamentos.routes').default;
    app.use('/api/equipamentos', equipamentosRouter);

    app.listen(3333, () => {
      console.log('🚀 Servidor rodando em http://localhost:3333');
    });
  })
  .catch((error) => {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    process.exit(1); // Encerra o processo se o banco não estiver disponível
  });
```

### Padrão de Entidade (`src/entities/`)

Cada entidade TypeORM mapeia diretamente para uma tabela MySQL. Use os decorators do TypeORM para definir colunas, relações e índices.

```typescript
// src/entities/componente.entity.ts

import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, CreateDateColumn, UpdateDateColumn
} from 'typeorm';
import { Equipamento } from './equipamento.entity';

/**
 * Entidade: Componente Mecânico
 *
 * Representa uma peça crítica de um equipamento industrial
 * (ex: rolamento, selo mecânico, mancal, correia).
 *
 * O campo `horasOperacionais` é a base do cálculo de desgaste:
 *   desgaste (%) = (horasOperacionais / vidaUtilNominal) * 100
 * Quando o desgaste >= 85%, um Alerta preventivo é gerado.
 */
@Entity('componentes') // nome da tabela no MySQL
export class Componente {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  nome: string; // Ex: "Rolamento SKF 6205"

  @Column({ length: 80 })
  tipo: string; // Ex: "rolamento", "selo", "mancal"

  @Column('float')
  vidaUtilNominal: number; // Horas de vida útil definidas pelo fabricante

  @Column('float', { default: 0 })
  horasOperacionais: number; // Horas acumuladas desde a última substituição

  // Relacionamento N:1 — muitos componentes pertencem a um equipamento
  @ManyToOne(() => Equipamento, (equipamento) => equipamento.componentes, {
    onDelete: 'CASCADE', // remove componentes se o equipamento for deletado
  })
  equipamento: Equipamento;

  @CreateDateColumn()
  criadoEm: Date;

  @UpdateDateColumn()
  atualizadoEm: Date;
}
```

### Padrão de Repository (`src/repositories/`)

Use o padrão `Repository` do TypeORM encapsulado em classes de repositório personalizadas para manter a lógica de acesso a dados separada das regras de negócio.

```typescript
// src/repositories/componente.repository.ts

import { AppDataSource } from '../config/database';
import { Componente } from '../entities/componente.entity';

/**
 * Repository de Componente.
 *
 * Centraliza todas as queries ao banco relacionadas a componentes.
 * Os Services devem usar este repository ao invés de acessar
 * o banco diretamente, mantendo a separação de responsabilidades.
 */
export const ComponenteRepository = AppDataSource.getRepository(Componente).extend({

  /**
   * Busca todos os componentes com desgaste crítico (>= 85%).
   * Utilizado pelo serviço de alertas para gerar notificações preventivas.
   */
  async findComponentesCriticos(): Promise<Componente[]> {
    return this.createQueryBuilder('componente')
      .where('(componente.horasOperacionais / componente.vidaUtilNominal) >= 0.85')
      .leftJoinAndSelect('componente.equipamento', 'equipamento')
      .orderBy('componente.horasOperacionais / componente.vidaUtilNominal', 'DESC')
      .getMany();
  },
});
```

### Migrations

Sempre use migrations para evoluir o schema do banco. **Nunca use `synchronize: true` em produção.**

```bash
# Gerar uma migration a partir das alterações nas entidades
npx typeorm migration:generate src/migrations/CriaTabelaComponentes -d ormconfig.ts

# Executar as migrations pendentes
npx typeorm migration:run -d ormconfig.ts

# Reverter a última migration
npx typeorm migration:revert -d ormconfig.ts
```

### Variáveis de Ambiente (`.env.example`)

```env
# Banco de dados MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=sua_senha_aqui
DB_NAME=mecanicao_pcm

# Ambiente
NODE_ENV=development

# JWT (autenticação)
JWT_SECRET=troque_por_um_secret_seguro
JWT_EXPIRES_IN=8h

# Servidor
PORT=3333
```

---

## ✅ Padrões e Convenções de Código

### TypeScript

- Ative `"strict": true` no `tsconfig.json`.
- Prefira `interface` para objetos de domínio e `type` para unions/intersections.
- Evite `any` — use `unknown` quando o tipo for realmente desconhecido.
- Exporte tipos/interfaces em arquivos `*.types.ts` dedicados.

### API REST (Express)

- Siga o padrão RESTful para nomenclatura de rotas:
  - `GET    /api/equipamentos`          — lista todos
  - `GET    /api/equipamentos/:id`      — busca por ID
  - `POST   /api/equipamentos`          — cria novo
  - `PUT    /api/equipamentos/:id`      — atualiza
  - `DELETE /api/equipamentos/:id`      — remove
- Respostas de erro devem seguir o padrão: `{ error: string, details?: unknown }`
- Use HTTP Status Codes semanticamente corretos (200, 201, 400, 401, 403, 404, 500).

### React / Next.js

- Use **Server Components** por padrão; adicione `"use client"` apenas quando necessário.
- Prefira **React Server Actions** para mutações de dados (formulários, etc.).
- Componentes devem ter no máximo **150 linhas** — divida se necessário.
- Estilize com **Tailwind CSS** como primeira opção; CSS Modules para casos específicos.

---

## 🚀 Fluxo de Desenvolvimento

O agente deve seguir este fluxo ao implementar cada User Story:

1. **Entender o requisito** — Leia a User Story e critérios de aceite no `AGIL.txt`
2. **Definir tipos** — Crie/atualize as interfaces TypeScript necessárias
3. **Modelar a entidade** — Crie/atualize a entidade TypeORM em `src/entities/`
4. **Gerar e executar migration** — `typeorm migration:generate` → `migration:run`
5. **Implementar back-end** — Entity → Repository → Service → Controller → Route
6. **Implementar front-end** — Tipos → Hook/Fetch → Componente → Página
7. **Comentar o código** — Adicione comentários explicativos em cada bloco relevante
8. **Validar** — Verifique se a implementação atende aos critérios de aceite

---

*Mecâni.cão PCM — Sistema SaaS de Gestão de Saúde de Ativos Industriais*
*Desenvolvido por Bruno — Projeto de Portfólio 2026*
