# Documentação do Projeto Pontual App

## Visão Geral
O **Pontual App** é um sistema web de gestão de tarefas e apontamento de horas (timesheet), desenvolvido para auxiliar no controle de produtividade e rastreamento de tempo gasto em atividades. O sistema conta com integração via WhatsApp, gestão de usuários e relatórios administrativos.

## Tecnologias Utilizadas

### Frontend
- **Framework**: React com TypeScript (Vite)
- **Estilização**: Tailwind CSS + Shadcn/ui (Radix UI)
- **Gerenciamento de Estado**: TanStack Query (React Query)
- **Roteamento**: wouter

### Backend
- **Servidor**: Node.js com Express
- **Banco de Dados**: PostgreSQL (Produção) / SQLite (Desenvolvimento/Local)
- **ORM**: Drizzle ORM
- **Autenticação**: Passport.js (JWT & Local Strategy)

### Integrações
- **Email**: SendGrid (Recuperação de senha, Boas-vindas)
- **Mensagem**: Integração com WhatsApp (Webhooks para recebimento e envio)

---

## Funcionalidades Principais

### 1. Autenticação e Perfis
- **Login Seguro**: Autenticação via usuário e senha.
- **Inicialização de Sistema**: Wizard para criação do primeiro administrador caso o banco esteja vazio.
- **Gestão de Sessão**: Tokens JWT para segurança.
- **Recuperação de Senha**: Fluxo de "Esqueci minha senha" com envio de token via e-mail.

### 2. Dashboard Interativo
Painel central que oferece uma visão rápida do desempenho do usuário:
- **Resumo de Tempo**: Total de horas hoje, na semana e no mês.
- **Tarefas Ativas**: Contagem de tarefas em andamento.
- **Alertas Inteligentes**:
  - Tarefas com prazo excedido.
  - Tarefas que estouraram o tempo estimado.
  - Tarefas vencendo hoje ou amanhã.
  - Tarefas próximas ao limite de tempo (70-85% utilizado).
- **Atividade Recente**: Lista dos últimos apontamentos realizados.

### 3. Gestão de Tarefas (`/tasks`)
- **CRUD Completo**: Criação, edição e exclusão de tarefas.
- **Organização**: Classificação por projetos ou categorias (visualização por cores).
- **Estimativas**: Definição de tempo estimado para cada tarefa.
- **Status**: Marcar como concluída ou reabrir tarefas.
- **Detalhes**: Visualização de itens e sub-tarefas.

### 4. Apontamento de Horas (`/timer`)
- **Cronômetro**: Início e pausa de contagem de tempo em tempo real.
- **Registro Manual**: Possibilidade de ajustar ou inserir apontamentos manualmente.
- **Vínculo**: Cada apontamento é estritamente ligado a uma tarefa existente.

### 5. Relatórios (`/reports`)
- **Filtros**: Seleção por período (data inicial e final).
- **Visão Administrativa**:
  - Relatório de atividade de todos os usuários.
  - Total de horas por utilizador.
  - Detalhamento de sessões de trabalho.

### 6. Histórico (`/history`)
- **Linha do Tempo**: Visualização cronológica de todas as atividades realizadas pelo usuário logado.
- **Correções**: Permite revisar apontamentos passados.

### 7. Integração WhatsApp (`/whatsapp`)
- **Conectividade**: Interface para conexão via QR Code.
- **Automação**:
  - Recebimento de comandos via Webhook.
  - Validação de números autorizados (bots/usuários).
  - Processamento de mensagens em grupos ou privadas.
- **Instâncias**: Suporte a identificação de instância para múltiplos conexões.

### 8. Administração (`/manager`)
- **Gestão de Usuários**:
  - Cadastro de novos usuários (apenas Admin).
  - Listagem de todos os membros do sistema.
  - Edição de perfis e inativação de contas.
  - Reset de senha administrativo.
- **Segurança**: Geração de API Keys para integrações externas.

---

## Estrutura de Rotas (API)

### Autenticação
- `POST /api/auth/login`: Autenticação de usuários.
- `POST /api/auth/initialize`: Criação do admin inicial.
- `POST /api/auth/users`: Criação de usuários (via Admin/API Key).

### Tarefas
- `GET /api/tasks`: Lista tarefas do usuário.
- `POST /api/tasks`: Cria nova tarefa.
- `PUT /api/tasks/:id`: Atualiza tarefa.
- `DELETE /api/tasks/:id`: Remove tarefa (se não houver apontamentos).

### Administrativo
- `GET /api/admin/users`: Lista todos usuários.
- `GET /api/admin/reports/activity`: Dados para relatórios de produtividade.

### Integrações
- `POST /api/whatsapp/webhook/:instanceName`: Recebimento de mensagens do WhatsApp.

---

## Fluxo de Trabalho Típico
1. **Admin** configura o sistema e cria usuários.
2. **Usuários** recebem credenciais e acessam o painel.
3. Usuários criam **Tarefas** e iniciam o **Timer** ao começar a trabalhar.
4. O sistema monitora o tempo e gera **Alertas** caso o prazo ou estimativa sejam excedidos.
5. Gestores acompanham o progresso através da page de **Relatórios**.
