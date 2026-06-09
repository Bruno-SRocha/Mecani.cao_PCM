# Mecâni.cão PCM 🐾 — Industrial Asset Health Management

Choose your language / Escolha seu idioma:
*   [🇺🇸 English Version](#-english-version)
*   [🇧🇷 Versão em Português](#-versão-em-português)

---

## 🇺🇸 English Version

This project is a key piece of my professional portfolio, demonstrating my ability to build a robust, production-ready, full-stack application that solves real-world industrial engineering challenges. 

**Mecâni.cão PCM** (Maintenance Planning and Control) is a comprehensive system designed to track industrial asset health, manage maintenance work orders, schedule repairs, and compute critical Reliability Engineering metrics (such as MTBF and MTTR) in real-time.

### 🎯 Methodology & Development Process
The planning, architectural design, and software execution of this project were guided by the **"AI Agile Software Engineering"** methodology, created by **Prof. Dr. Leandro Guarino de Vasconcelos**. 
The project was structured around a strict sprint schedule managed via **Trello**, showcasing agile collaboration, dynamic requirement mapping, and highly efficient implementation cycles powered by generative AI assistants.

---

### 🌟 Key Features Showcase

#### 1. 📊 Business Intelligence (BI) Dashboard & Industrial Metrics
*   **What it does:** Computes and displays critical KPIs for maintenance operations.
*   **Under the Hood:** 
    *   **MTBF (Mean Time Between Failures):** Tracks the reliability of each machine by calculating the average operational time between breakdown events.
    *   **MTTR (Mean Time To Repair):** Measures maintainability by calculating the average time technicians take to resolve failures.
    *   **Financial Insights:** Generates real-time charts illustrating maintenance costs distributed by type (Preventive, Corrective, Predictive) and asset.
    *   **Asset Availability:** Visual gauge representing the overall uptime of the factory assets.

#### 2. 📅 Interactive Maintenance Calendar (PCM Scheduler)
*   **What it does:** A unified view for managers to organize schedules.
*   **Under the Hood:** 
    *   Interactive grid built using modern React states that integrates directly with database schedules.
    *   Auto color-coding system mapping colors to maintenance severity/type: **Corrective (Red)**, **Preventive (Blue)**, and **Predictive (Yellow)**.
    *   Real-time scheduling: adding or changing scheduled dates dynamically updates the calendar UI.

#### 3. ⚙️ Asset Management & Audit Trail
*   **What it does:** Complete inventory management of machinery and parts.
*   **Under the Hood:** 
    *   State transition engine: restricts when an asset can change its status (e.g., preventing a machine with open critical corrective work orders from going back to "OPERATING" state without validation).
    *   **Audit Logging:** Database-level tracking of every single status change, storing who changed it, when, and the reason, rendering an audit history tab for compliance.

#### 4. 🔄 Component Wear & Replacement Workflow
*   **What it does:** Simulates predictive maintenance workflows.
*   **Under the Hood:** 
    *   **Technician Role:** Logs wear and tear percentages on machine parts and requests component replacements.
    *   **Manager Role:** Accesses a specialized approvals screen where they can review, approve, or reject replacement requests, triggering automated history logging and asset update hooks.

#### 5. 🔒 Advanced Security & Role-Based Access Control (RBAC)
*   **What it does:** Implements strict security standards and access policies.
*   **Under the Hood:**
    *   Granular RBAC distinguishing permissions between `ADMIN` (system configuration, user creation, audits), `GESTOR` (approvals, costs, and reports), and `TECNICO` (reporting wear, updating work orders).
    *   **First-Access Password Enforcement:** Users with temporary passwords are automatically intercepted and forced to set up a new secure password before accessing any other page.
    *   **Password Policy:** Regex-based requirements verifying uppercase letters, numbers, and special characters, combined with secure hashing (`bcryptjs`) on the backend.

---

### 🛠️ Architecture & Tech Stack

This project was built following clean code principles, separating concerns between a RESTful API and a Server-Side Rendered (SSR) client.

*   **Frontend:**
    *   **Next.js (v16.2.4)** with **React (v19.2.4)** & **TypeScript**.
    *   **Tailwind CSS (v4)** for modern, high-fidelity, and responsive layouts.
    *   Dynamic modals, state management, and optimized asset loading.
*   **Backend:**
    *   **Node.js** with **Express** & **TypeScript**.
    *   **TypeORM** (Object-Relational Mapping) to structure entities and run database migrations.
    *   **JWT (JSON Web Tokens)** for secure, stateless user authentication.
*   **Database & Infra:**
    *   **MySQL (v8.0)** hosted inside **Docker Compose** for easy, reproducible database instantiation.
    *   Custom database seed scripts to automatically populate complex relational data for test drives.

---

### 📂 Directory Map

```text
├── backend/                       # REST API (NodeJS + Express + TypeORM)
│   ├── src/
│   │   ├── config/                # Database and JWT secrets configuration
│   │   ├── controllers/           # HTTP Request Handlers
│   │   ├── entities/              # DB schemas (Equipments, Orders, Users, Logs)
│   │   ├── middlewares/           # RBAC permissions and session checkers
│   │   ├── services/              # Business rules and metrics computation
│   │   └── seed-*.ts              # Mock data populate scripts
│
├── frontend/                      # Web Client (Next.js App Router)
│   ├── src/
│   │   ├── app/                   # App Router pages (Dashboard, Calendar, etc.)
│   │   ├── components/            # Shared UI elements and modal flows
│   │   └── lib/                   # API connection clients and helpers
│
└── docker-compose.yml             # Single-command local MySQL setup
```

---

### 🚀 Setup & Local Execution

#### Prerequisites
*   **Node.js** (v18.x or higher)
*   **Docker & Docker Compose**

#### 1. Setup the Database
Spin up the MySQL container from the root directory:
```bash
docker compose up -d
```

#### 2. Start the Backend API
1. Navigate to the backend folder, install dependencies, and setup variables:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
2. Run database migrations and seed default values:
   ```bash
   npm run migration:run
   npx ts-node -r reflect-metadata src/seed-aprovacoes.ts
   npx ts-node -r reflect-metadata src/seed-diagnosticos.ts
   npx ts-node -r reflect-metadata src/seed-ordens-manutencao.ts
   ```
3. Boot up the server:
   ```bash
   npm run dev
   ```
   > The API will be active at `http://localhost:3333`

#### 3. Start the Next.js Frontend
1. Open a new terminal instance and enter the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
2. Launch the developer environment:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your web browser.

---

### 🔑 Development & Testing Credentials

Use these preset accounts to test the Role-Based Access Control (RBAC):

| Username | Active Password | Role | Target Dashboard |
| :--- | :--- | :--- | :--- |
| **`admin`** | `Admin@Mecanicao2026` | **ADMIN** | User Management & Auditing |
| **`gestor`** | `Gestor@2026!` | **GESTOR** | BI Metrics & Replacement Approvals |
| **`tecnico`** | `Tecnico@2026!` | **TECNICO** | Maintenance Orders & Component Reports |

---

## 🇧🇷 Versão em Português

Este projeto é uma peça fundamental do meu portfólio profissional, demonstrando a minha capacidade de construir uma aplicação full-stack robusta, pronta para produção, que resolve desafios reais de engenharia e planejamento industrial.

O **Mecâni.cão PCM** (Planejamento e Controle de Manutenção) é um sistema completo para monitorar a saúde de ativos industriais, gerenciar ordens de serviço, agendar manutenções e calcular métricas críticas de Engenharia de Confiabilidade (como MTBF e MTTR) em tempo real.

### 🎯 Metodologia e Processo de Desenvolvimento
Todo o planejamento, definição de arquitetura e execução do software deste projeto foram guiados pela metodologia **"AI Agile Software Engineering"**, criada pelo **Prof. Dr. Leandro Guarino de Vasconcelos**.
O desenvolvimento seguiu um cronograma de sprints estruturado e gerenciado por meio do **Trello**, demonstrando práticas ágeis de colaboração, mapeamento contínuo de requisitos e ciclos rápidos de entrega impulsionados por assistentes de IA generativa.

---

### 🌟 Destaques de Funcionalidades

#### 1. 📊 Dashboard de Business Intelligence (BI) e Métricas Industriais
*   **O que faz:** Calcula e exibe indicadores-chave (KPIs) para operações de manutenção.
*   **Por trás dos panos:**
    *   **MTBF (Tempo Médio Entre Falhas):** Monitora a confiabilidade de cada máquina calculando o tempo médio que ela opera sem quebras.
    *   **MTTR (Tempo Médio de Reparo):** Mede a manutenibilidade calculando o tempo médio que os técnicos levam para resolver as falhas.
    *   **Visão de Custos:** Gráficos interativos mostram a distribuição de custos por tipo (Preventiva, Corretiva, Preditiva) e ativo.
    *   **Disponibilidade:** Indicador visual que mostra a porcentagem geral de uptime da frota de ativos.

#### 2. 📅 Calendário Interativo de Planejamento (PCM)
*   **O que faz:** Oferece uma visão unificada para gestores organizarem os agendamentos de manutenção.
*   **Por trás dos panos:**
    *   Grid interativo desenvolvido com estados modernos em React, conectado diretamente ao banco de dados.
    *   Identificação visual (color-coding) por tipo de manutenção: **Corretiva (Vermelho)**, **Preventiva (Azul)** e **Preditiva (Amarelo)**.
    *   Sincronização em tempo real: a criação ou edição de datas de ordens reflete instantaneamente no calendário.

#### 3. ⚙️ Gestão de Equipamentos e Trilha de Auditoria
*   **O que faz:** Controle completo do ciclo de vida e status das máquinas e peças.
*   **Por trás dos panos:**
    *   Regras rígidas de transição de estado (ex: impede que um equipamento com uma ordem corretiva pendente volte ao status "OPERANDO" sem validações prévias).
    *   **Trilha de Auditoria (Logs):** Registro detalhado a nível de banco de dados para cada mudança de status, incluindo o autor, data, hora e motivo da mudança.

#### 4. 🔄 Fluxo de Desgaste e Substituição de Componentes
*   **O que faz:** Simula manutenções preditivas baseadas na vida útil das peças.
*   **Por trás dos panos:**
    *   **Visão do Técnico:** Lança o desgaste percentual das peças e solicita a substituição de um componente.
    *   **Visão do Gestor:** Tela de aprovação dedicada para revisar o pedido, aprovar ou rejeitar, atualizando automaticamente o status da máquina.

#### 5. 🔒 Controle de Acesso Baseado em Perfis (RBAC) e Segurança
*   **O que faz:** Garante a proteção dos dados e a hierarquia dentro da plataforma.
*   **Por trás dos panos:**
    *   Perfis de acesso granulares: `ADMIN` (cadastro de usuários e auditoria), `GESTOR` (aprovações de custos e relatórios de BI) e `TECNICO` (reporte de ordens e substituições).
    *   **Política de Primeiro Acesso:** Se um usuário logar com uma senha temporária, o sistema intercepta o fluxo e exige a criação de uma senha forte antes de liberar o acesso às telas operacionais.
    *   **Critérios de Senha Forte:** Validação robusta com regex (letras maiúsculas, caracteres especiais e números) e criptografia com `bcryptjs` no backend.

---

### 🛠️ Arquitetura e Tecnologias

O projeto segue padrões de código limpo (Clean Code), separando as responsabilidades de negócio da interface visual.

*   **Frontend:**
    *   **Next.js (v16.2.4)** com **React (v19.2.4)** e **TypeScript**.
    *   **Tailwind CSS (v4)** para layouts responsivos e de alto padrão visual.
    *   Modais dinâmicos e gerenciamento de estado otimizado.
*   **Backend:**
    *   **Node.js** com **Express** e **TypeScript**.
    *   **TypeORM** para estruturação e versionamento do banco de dados (migrations).
    *   **JWT (JSON Web Tokens)** para autenticação segura e stateless.
*   **Banco de Dados & Infra:**
    *   **MySQL (v8.0)** executando via **Docker Compose** para inicialização rápida do ambiente local.
    *   Scripts de seeds automatizados para popular o banco de dados com massa de dados de teste realística.

---

### 📂 Mapa de Diretórios

```text
├── backend/                       # API REST (NodeJS + Express + TypeORM)
│   ├── src/
│   │   ├── config/                # Chaves de banco de dados e segredos JWT
│   │   ├── controllers/           # Controladores de rotas HTTP
│   │   ├── entities/              # Schemas do banco (Equipamentos, Ordens, Logs)
│   │   ├── middlewares/           # Verificação de sessões e níveis RBAC
│   │   ├── services/              # Regras de negócio e cálculo de indicadores
│   │   └── seed-*.ts              # Scripts de carga inicial de testes
│
├── frontend/                      # Cliente Web (Next.js App Router)
│   ├── src/
│   │   ├── app/                   # Roteamento de telas (Dashboard, Calendário, etc.)
│   │   ├── components/            # Componentes visuais e modais interativos
│   │   └── lib/                   # Clientes de comunicação HTTP/API
│
└── docker-compose.yml             # Configuração do MySQL local em Docker
```

---

### 🚀 Instalação e Inicialização Local

Siga as instruções descritas na seção **[Setup & Local Execution](#-setup--local-execution)** acima para clonar, instalar dependências e iniciar o banco de dados, a API e o cliente web do projeto em sua máquina de desenvolvimento.

As credenciais rápidas para validação e testes dos fluxos encontram-se na tabela **[Development & Testing Credentials](#-development--testing-credentials)**.
