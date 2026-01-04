# Documentação do Projeto TimeFlow

## Visão Geral
O **TimeFlow** é um sistema web para gestão de tempo e produtividade pessoal ou corporativa. Ele permite que usuários cadastrem atividades, cronometrem o tempo gasto em cada uma delas e visualizem relatórios detalhados de desempenho. O sistema também possui módulos de integração com WhatsApp e configurações de notificações.

## Funcionalidades Principais

### 1. Gestão de Usuários
*   **Autenticação**: Login seguro com usuário e senha.
*   **Controle de Acesso**: Diferenciação entre usuários comuns e administradores.
*   **API Key**: Geração de chave de acesso p/ integrações externas.

### 2. Gestão de Atividades (Tasks)
*   **Cadastro Completo**: Criação de atividades com nome, descrição, cor de identificação, prazo (deadline) e estimativa de horas.
*   **Checklist**: Possibilidade de adicionar sub-tarefas (itens) dentro de uma atividade principal para controle granular do progresso.
*   **Ciclo de Vida**: Atividades podem ser marcadas como ativas, concluídas ou reabertas.
*   **Filtros**: Busca por nome, status (ativa/inativa) e cor.

### 3. Apontamento de Horas (Time Tracking)
*   **Timer em Tempo Real**: O usuário pode iniciar ("Start") e parar ("Stop") um cronômetro para uma atividade específica.
*   **Registro Manual**: Inserção de lançamentos de tempo passados, informando início, fim ou duração.
*   **Sessões Ativas**: O sistema rastreia qual atividade está sendo executada no momento.

### 4. Relatórios e Dashboards
*   **Dashboard Inicial**:
    *   Resumo do tempo trabalhado hoje, na semana e no mês.
    *   Tarefas atrasadas, tarefas prestes a vencer e tarefas que excederam o tempo estimado.
*   **Tela de Relatórios**:
    *   Gráficos e listas de tempo por atividade.
    *   Resumo diário de horas trabalhadas.
    *   Filtros por período (semana, mês, personalizado).
*   **Exportação**:
    *   **CSV**: Exportação dados brutos para planilhas.
    *   **PDF**: Relatório formatado pronto para impressão/envio.

### 5. Integração WhatsApp
*   **Bot de Controle**: Permite interagir com o sistema via WhatsApp.
*   **Webhook**: Recebe mensagens para comandos rápidos (ex: iniciar timer enviando o nome da tarefa).
*   **Segurança**: Restrição de interações apenas para números de telefone autorizados.

## Regras de Negócio do Sistema

### Usuários e Privacidade
1.  **Isolamento de Dados**: Em ambientes multi-usuário, um usuário comum deve visualizar apenas suas próprias tarefas e apontamentos. O Administrador tem acesso a visões gerenciais.
2.  **Imutabilidade de Histórico**: Um usuário não pode excluir uma atividade que já possui apontamentos de tempo registrados, garantindo a integridade dos relatórios.

### Controle de Tempo
1.  **Timer Único**: O sistema (idealmente) gerencia uma sessão ativa por vez por usuário para evitar contagem duplicada de tempo (concorrência).
2.  **Cálculo de Duração**: O tempo é calculado em segundos e armazenado no banco de dados. Na visualização, é convertido para horas e minutos.
3.  **Vencimento**: Tarefas são consideradas "atrasadas" se o prazo (deadline) for menor que a data/hora atual e a tarefa ainda não estiver concluída.

### Integrações
1.  **Restrição de Origem**: A integração com WhatsApp verifica se o número remetente está na lista de "Números Autorizados". Mensagens de números desconhecidos são ignoradas.
2.  **Criação Automática**: Ao enviar um comando de início para uma tarefa inexistente via integração rápida, o sistema pode criar a tarefa automaticamente (Rápida Entrada).

## Aspectos Técnicos (Resumo)
*   **Frontend**: React, TailwindCSS, ShadcnUI (Interface moderna e responsiva).
*   **Backend**: Node.js/Express.
*   **Banco de Dados**: PostgreSQL (Armazenamento robusto e relacional).
*   **Validação**: Schemas rigorosos garantem que dados obrigatórios (como nome da tarefa e IDs de usuário) sejam sempre fornecidos.
