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

## Testar agora, sem configurar Neon

Requisito: **Node.js 22 ou superior**. No terminal, dentro do projeto:

```powershell
cd apps/web
npm ci
npm run setup:local
npm run dev
```

O `setup:local` pede seu e-mail e uma senha de pelo menos 12 caracteres, aplica as
migrações e cadastra três serviços **de demonstração**. Não há senha padrão. Abra
`http://localhost:4000` e use esse mesmo e-mail/senha em `http://localhost:4000/admin`.
`/admin` gerencia serviços, fotos e vídeos; `/gestao` mostra a agenda e a operação.

Esse modo usa Postgres embarcado (PGlite), com dados persistidos em
`apps/web/.data/local`, e só escuta no computador local. É possível cadastrar um
serviço, agendar e conferir a reserva na gestão de verdade. As reservas e alterações
continuam lá após reiniciar. Preços e durações dos exemplos são fictícios; nenhuma
foto real do salão foi incluída. Cadastre o conteúdo real em `/admin`.

O comando cria `.env.local`, mantém um segredo de sessão estável e **preserva seu
`.env` existente**. Não acessa o Neon nem altera dados da produção. Executá-lo de
novo preserva a conta, a senha e os serviços existentes. Pare `npm run dev` com
`Ctrl+C` antes de executar novamente o setup, migrações ou diagnóstico: somente um
processo pode abrir o banco local de cada vez. Não apague `.data` se quiser guardar
os testes. Não copie esse banco para a hospedagem.

Para diagnosticar uma instalação, com o servidor parado:

```powershell
npm run doctor
```

| Sintoma | Verificação |
| --- | --- |
| Catálogo vazio | `doctor` distingue falha no banco de catálogo sem serviços. Em `/admin`, cadastre ao menos um serviço e marque-o como ativo. |
| Erro ao consultar horários | Confira a conexão/migrações. A tela agora exibe erro com botão para tentar novamente; não diz que a agenda está cheia. Sábado continua fechado. |
| Login indisponível | `doctor` confere segredo, URL, migrações e conta autorizada. Execute `setup:local` para testar ou complete a configuração Neon abaixo. |

Os comandos `dev`, `start`, `doctor`, `db:migrate` e `admin:create` carregam os
arquivos `.env`/`.env.local` no servidor; arquivos específicos do modo também são
respeitados. Variáveis da hospedagem têm prioridade. Reinicie o servidor após
alterar a configuração. Segredos não são enviados para o navegador.

## Usar seu banco Neon e dados reais

Requisitos: Node.js 22 ou superior e um banco Neon/Postgres compatível com o driver
Neon. Este projeto usa **npm**; o lockfile oficial é `apps/web/package-lock.json`.

Se você já usou `setup:local`, pare o servidor e renomeie `.env.local` para
`.env.local.saved` antes de usar Neon (no PowerShell:
`Rename-Item .env.local .env.local.saved`). Assim ele deixa de substituir o `.env`.
Os dados do ambiente local não são transferidos automaticamente para o Neon.

```bash
cd apps/web
npm ci
cp .env.example .env
```

No PowerShell, use `Copy-Item .env.example .env` no lugar de `cp`.
Preencha o `.env` local:

| Variável       | Uso                                                               |
| -------------- | ----------------------------------------------------------------- |
| `DATABASE_DRIVER` | `neon` para o banco real; `local` é exclusivo dos testes locais |
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
npm run doctor
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
npm run test:flows
npm start
```

`npm start` executa o servidor de produção real, incluindo as rotas `/api`.
Não publique apenas a pasta estática `build/client`: o site precisa de servidor Node.
O `npm start` carrega `.env`/`.env.local` antes de importar o servidor e respeita
as variáveis fornecidas pela hospedagem. Também permite testar o build com o banco
local; nesse caso continue acessando `http://localhost:4000`.

Na hospedagem Node:

- Diretório raiz: `apps/web`.
- Build: `npm ci && npm run build`.
- Start: `npm start`.
- Health check: `/health` (verifica o processo, não a conexão com o banco).
- Variáveis: `DATABASE_DRIVER=neon`, `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `ADMIN_EMAILS` e a `PORT`
  fornecida pela hospedagem. Use `NODE_ENV=production` no servidor.
- Rode as migrações no banco configurado antes de receber clientes. Num ambiente
  que injeta variáveis, use `node scripts/migrate.mjs`, sem depender de `.env`.

Os testes automatizados executam as migrações e as consultas reais usando Postgres
em memória (PGlite), com autenticação simulada nos testes unitários de API. Verificam
sobreposições, limites de horários, acesso negado, CRUD, isolamento de categorias,
receitas pagas e rollback da conclusão de atendimento. Não substituem a validação
final da conexão Neon e das credenciais na hospedagem. Incluem regressões de tela
para falha de disponibilidade, sábado fechado e erro na galeria sem ocultar serviços.

`npm run test:flows` inicia o **servidor de produção completo** com banco temporário
em disco e autenticação real. Testa senha incorreta, login, autorização, cadastro de
serviço ativo/inativo, disponibilidade, agendamento, conflito, lançamento financeiro
único e persistência depois de reiniciar. Também verifica a resposta sem
`AUTH_SECRET`. Usa conta e senha temporárias e não depende do Neon. O banco de teste
é removido ao terminar; `.env`, `.env.local` e dados do usuário ficam intactos.

Antes de abrir ao público: testar login real, cadastrar um serviço e foto reais,
fazer um agendamento, confirmar/concluir, verificar o financeiro e abrir no celular.
Não há deploy automático neste repositório; o workflow valida o código em PRs.

Validação desta revisão: 15 testes, build, typecheck e o teste integrado do servidor
passaram. A autenticação e as reservas foram validadas com dados persistidos em
Postgres local. No Chromium, o servidor de desenvolvimento também passou pelo
login, criação de serviço no admin, exibição no catálogo, escolha de horário e
reserva visível na agenda, sem simular APIs. Catálogo, agendamento, admin e agenda
foram verificados em 390 px, sem rolagem horizontal; o login sem segredo mostrou
orientações na tela em vez de JSON. Não houve conexão com o Neon de produção nem
publicação em hospedagem nesta etapa.
