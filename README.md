# Sabrina Braids

Site público de tranças e painel de gestão do salão. O app web usa React Router 7,
React 18, Hono, Tailwind e Postgres/Neon. O app Expo permanece em `apps/mobile` e
não faz parte desta entrega web.

## Funcionalidades da versão web

- Site público com catálogo, fotos, vídeos e WhatsApp do salão.
- Agendamento por serviço ou modelo personalizado, com imagem e descrição.
- Horários no fuso `America/Sao_Paulo`: domingo a quinta, 07h–19h; sexta, 08h–17h;
  sábado fechado. Horários passados, bloqueados e sobrepostos são recusados.
- Pedidos ficam **pendentes** até confirmação da equipe. Após salvar, a cliente
  pode clicar em **Continuar no WhatsApp**; o sistema não envia mensagens sozinho.
- `/gestao`: resumo real do banco, agenda, clientes e histórico, financeiro,
  estoque, tarefas, metas mensais, rotina e ideias de conteúdo para Instagram.
- `/admin`: cadastro e edição de serviços, galeria e vídeos.
- Conclusão do atendimento e lançamento financeiro acontecem na mesma transação.
  A receita é registrada uma única vez, na data da conclusão, pelo valor recebido.
- Financeiro e dashboard contabilizam apenas lançamentos marcados como pagos.
- Autenticação de equipe por e-mail/senha, autorização no servidor e cadastro
  administrativo pelo terminal. Não há cadastro público de administradores.

## Rodar localmente

Requisitos: Node.js 22 ou superior e um banco Neon/Postgres compatível com o driver
Neon. Este projeto usa **npm**; o lockfile oficial é `apps/web/package-lock.json`.

```bash
cd apps/web
npm ci
cp .env.example .env
```

No PowerShell, use `Copy-Item .env.example .env` no lugar de `cp`.
Preencha o `.env` local:

| Variável       | Uso                                                               |
| -------------- | ----------------------------------------------------------------- |
| `DATABASE_URL` | String de conexão fornecida pelo Neon                             |
| `AUTH_SECRET`  | Segredo aleatório e estável usado nas sessões                     |
| `AUTH_URL`     | `http://localhost:4000` localmente; origem HTTPS real em produção |
| `ADMIN_EMAILS` | E-mails da equipe, separados por vírgula                          |
| `PORT`         | Porta do servidor, normalmente definida também pela hospedagem    |

Gere o segredo uma única vez:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Não publique `.env`, senhas ou a string de conexão no GitHub.

```bash
npm run db:migrate
npm run admin:create
npm run dev
```

O comando `admin:create` pede e-mail autorizado e senha de pelo menos 12 caracteres.
A senha não é exibida. Ele não altera contas que já existem. Contas por senha
existentes continuam válidas. Acesse `/account/signin` para entrar.

## Banco e migrações

As migrações versionadas estão em `apps/web/migrations`:

1. `001_schema.sql`: tabelas públicas, gestão e autenticação; adiciona os campos
   necessários sem apagar registros nem cadastrar dados fictícios.
2. `002_booking_integrity.sql`: índices únicos, proteção contra sobreposição e
   proteção entre bloqueios e agendamentos. Usa a extensão Postgres `btree_gist`.
3. `003_link_existing_clients.sql`: vincula agendamentos antigos aos clientes por
   telefone, preservando os dados existentes.

O runner registra checksum e executa cada arquivo em transação, uma única vez.
O schema original não estava no repositório: a base foi reconstruída a partir das
consultas existentes. **Valide primeiro numa cópia/branch do banco Neon existente**.
Duplicidades de telefone, receitas repetidas ou agendamentos sobrepostos podem
impedir a migração 002; nesse caso ela é revertida, e os registros precisam ser
conciliados antes de tentar novamente. Nenhum dado é excluído automaticamente.
Não edite migrações já aplicadas; crie uma migração nova.

## Imagens e conteúdo

O site utiliza os dados reais cadastrados em `/admin`; nenhuma foto, preço ou
serviço é inserido automaticamente. Uploads JPG, PNG e WebP até 2 MB são gravados
como data URL junto ao registro no Postgres, sem depender do endpoint privado da
Anything. Também é possível usar uma URL HTTPS de imagem. Para galerias grandes,
recomenda-se posteriormente migrar os arquivos para um serviço de objetos/CDN.

Dados de contato foram mantidos a partir do código existente: WhatsApp
`+55 21 99366-2669`, Instagram `@sabrin_braids`, Rua Gâmbia, 17. Confirme esses dados
com o salão antes da divulgação. Ideias de Instagram ficam no banco, sem publicar
nem integrar automaticamente com a rede social.

## Validar e publicar

```bash
cd apps/web
npm ci
npm test
npm run typecheck
npm run build
npm start
```

`npm start` executa o servidor de produção real, incluindo as rotas `/api`.
Não publique apenas a pasta estática `build/client`: o site precisa de servidor Node.
O `npm start` usa variáveis fornecidas pelo ambiente. Para testar a versão de
produção com seu `.env` local, use `node --env-file=.env build/server/index.js`.

Na hospedagem Node:

- Diretório raiz: `apps/web`.
- Build: `npm ci && npm run build`.
- Start: `npm start`.
- Health check: `/health` (verifica o processo, não a conexão com o banco).
- Variáveis: `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `ADMIN_EMAILS` e a `PORT`
  fornecida pela hospedagem. Use `NODE_ENV=production` no servidor.
- Rode as migrações no banco configurado antes de receber clientes. Num ambiente
  que injeta variáveis, use `node scripts/migrate.mjs`, sem depender de `.env`.

Os 12 testes automatizados executam as migrações e as consultas reais usando Postgres
em memória (PGlite), com autenticação simulada apenas nos testes. Verificam
sobreposições, limites de horários, acesso negado, CRUD, isolamento de categorias,
receitas pagas e rollback da conclusão de atendimento. Não substituem a validação
final da conexão Neon e das credenciais na hospedagem.

Antes de abrir ao público: testar login real, cadastrar um serviço e foto reais,
fazer um agendamento, confirmar/concluir, verificar o financeiro e abrir no celular.
Não há deploy automático neste repositório; o workflow valida o código em PRs.

Validação desta entrega: build, typecheck e 12 testes passaram. No servidor de
produção local, foram verificados health check, 404, bloqueio de APIs sem login e
redirecionamento para login. Os fluxos de cadastro, estoque, tarefas, serviços e
agendamento/WhatsApp também passaram no Chromium com respostas de API simuladas;
11 páginas foram conferidas em 390 px, sem rolagem horizontal. Não houve conexão
com o Neon de produção nem publicação em hospedagem nesta etapa.
