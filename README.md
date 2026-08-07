# Sabrina Braids — Plataforma de Gestão de Salão

Plataforma web (+ app mobile) para o salão de tranças da Sabrina: site público de
agendamento para clientes e painel de gestão interno para administrar clientes,
agenda, financeiro, estoque e rotina do salão.

## Estrutura do projeto

Monorepo com dois apps:

```
apps/
  web/      → React Router v7 + Postgres (Neon), site público + painel /gestao
  mobile/   → Expo (React Native), espelha parte das funcionalidades do web
sabrina-trancas-db/
  migration_001_gestao_tables.sql → schema das tabelas de gestão (clients, financeiro, estoque, tarefas)
  development.sql / production.sql → dumps do schema original (agendamentos, serviços, galeria, vídeos)
```

## Stack

- **Front-end:** React Router v7 (file-based routing), Tailwind
- **Back-end:** API routes dentro do próprio `apps/web` (`src/app/api/**/route.js`), sem servidor separado
- **Banco:** Postgres via Neon (`@neondatabase/serverless`)
- **Auth:** Auth.js (`@auth/core`), login por e-mail/senha, lista de admins fixa no código
- **Mobile:** Expo / React Native

## Estado do projeto 

### ✅ Funcional (site público)
- Agendamento de horários (com verificação de conflito)
- Catálogo de serviços, galeria e vídeos
- Login/autenticação

### ✅ Funcional (painel de gestão — `/gestao`)
- Protegido por login (apenas autorizados)
- **Clientes**: cadastro real, vinculado automaticamente a cada novo agendamento (por telefone)
- **Financeiro**: entradas/saídas reais no banco; entrada é lançada automaticamente quando um
  agendamento é marcado como "concluído"
- **Estoque**: itens reais no banco, com quantidade mínima configurável
- **Tarefas & Metas**: tarefas reais no banco (tabela única usada também na "Minha Rotina",
  diferenciadas pelo campo `category`)
- **Meta de faturamento mensal**: configurável por mês/ano (tabela `monthly_goals`)

### 🚧 Ainda mockado / não conectado ao banco
- Página **Instagram** (ideias de conteúdo) — hoje é lista estática, ok deixar assim por enquanto
  já que não é dado operacional do salão
- Front-end das páginas de gestão (Clientes, Financeiro, Estoque, Tarefas, Dashboard) ainda
  usam `useState` com dados fixos — **as APIs já existem, falta só trocar o mock pela chamada real**
  (próximo passo)

## Rotas de API novas (painel de gestão)

Todas exigem sessão de admin (mesmo padrão de `ALLOWED_ADMINS` já usado em `services/route.js`).

| Rota | Métodos | Descrição |
|---|---|---|
| `/api/clients` | GET, POST | Listar / criar clientes |
| `/api/clients/[id]` | GET, PUT, DELETE | Detalhe (com histórico) / editar / remover |
| `/api/financial-transactions` | GET, POST | Listar (com resumo de totais) / criar entrada ou saída |
| `/api/financial-transactions/[id]` | PUT, DELETE | Editar (ex: marcar como paga) / remover |
| `/api/stock-items` | GET, POST | Listar / criar item de estoque |
| `/api/stock-items/[id]` | PUT, DELETE | Editar quantidade / remover |
| `/api/tasks` | GET, POST | Listar (filtro por categoria/status) / criar tarefa |
| `/api/tasks/[id]` | PUT, DELETE | Editar (ex: marcar como feita) / remover |
| `/api/monthly-goals` | GET, POST | Buscar / definir meta de faturamento do mês |
| `/api/dashboard-summary` | GET | Resumo agregado pra alimentar o Dashboard em uma chamada só |

## Antes de rodar a migration

O arquivo `sabrina-trancas-db/migration_` precisa ser executado uma vez
contra o banco Neon (via SQL editor do Neon).
Ele cria as tabelas novas e adiciona a coluna `client_id` em `appointments` — não apaga nem
altera dados existentes.

## Próximos passos

1. Rodar a migration no banco
2. Conectar o front-end de cada página de gestão às APIs reais (mock → fetch)
3. Dashboard por último, consumindo `/api/dashboard-summary`
