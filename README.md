# Sabrina Braids

Site público de tranças e painel de gestão do salão. O app web usa React Router 7,
React 18, Hono, Tailwind e Postgres/Neon. O app Expo permanece em `apps/mobile` e
não faz parte desta entrega web.

## Funcionalidades da versão web

- Site público com catálogo de serviços, fotos, vídeos e WhatsApp do salão.
- Até **8 fotos por serviço/produto**, seleção de capa e galeria com setas no site,
  admin e agendamento. Fotos anteriores são preservadas.
- Banner enviado pelo salão antes dos serviços, ícones de WhatsApp e Instagram
  clicáveis e botões adicionais para celular; cores oliva, creme e bronze.
- Botão **Voltar ao topo** nas páginas, respeitando a preferência por menos animações.
- Avisos persistentes em todo o admin quando o estoque chega a **3 unidades ou menos**,
  ou antes se houver um mínimo maior configurado. Reposição resolve o aviso.
- Seção **Produtos**, logo após os serviços, com fotos, categorias, preço opcional
  e consulta pelo WhatsApp. Catálogo gerenciado em `/admin/produtos`.
- Agendamento por serviço ou modelo personalizado, com imagem e descrição.
- Horários no fuso `America/Sao_Paulo`: domingo a quinta, 09h30–16h; sexta, 09h30–14h30;
  sábado fechado. Horários passados, bloqueados e sobrepostos são recusados.
  O serviço inteiro deve caber no expediente. Reservas antigas são preservadas.
- Pedidos ficam **pendentes** até confirmação da equipe. Após salvar, a cliente
  pode clicar em **Continuar no WhatsApp**; o sistema não envia mensagens sozinho.
- `/admin`: painel único com **Gestão e agenda**, **Site e serviços** e **Produtos**.
- `/admin/gestao`: resumo real do banco, agenda, clientes e histórico, financeiro,
  estoque, tarefas, metas mensais, rotina e ideias de conteúdo para Instagram.
- `/admin/servicos`: cadastro e edição de serviços, galeria e vídeos.
- `/admin/produtos`: cadastro, fotos, edição, disponibilidade e visibilidade de produtos.
- Links antigos `/gestao` e `/gestao/*` redirecionam para a nova área do admin.
  A mudança de endereço das páginas preserva as contas e os dados da gestão.
- Conclusão do atendimento e lançamento financeiro acontecem na mesma transação.
  A receita é registrada uma única vez, na data da conclusão, pelo valor recebido.
- Financeiro e dashboard contabilizam apenas lançamentos marcados como pagos.
- Autenticação de equipe por e-mail/senha, autorização no servidor e cadastro
  administrativo pelo terminal. Não há cadastro público de administradores.

## Atualizar a versão que você já testou

1. Pare o servidor antigo com `Ctrl+C` e mantenha uma cópia da pasta anterior.
2. Extraia o novo ZIP em **outra pasta**, para não misturar arquivos antigos.
3. Copie `apps/web/.env.local` e a pasta completa `apps/web/.data` da versão antiga
   para os mesmos locais na nova. Se usa `.env` ou outro arquivo de ambiente,
   copie-o também. Isso preserva seu e-mail, senha, sessão, clientes e agendamentos.
   Se `DATABASE_LOCAL_PATH` foi personalizado, preserve o banco indicado ali.
4. Na nova pasta `apps/web`, com o servidor parado, execute:

   ```powershell
   npm ci
   npm run db:migrate
   npm run doctor
   npm run dev
   ```

   **Esta versão inclui as migrações `005_catalog_photos.sql`,
   `006_stock_alerts.sql` e `007_request_limits.sql`.** O comando preserva as
   fotos antigas como capa, cria avisos de estoque e proteção contra excesso de
   tentativas. As migrações anteriores também são aplicadas se necessário. Não precisa criar outra conta nem
   executar `setup:local` novamente.

5. Abra o endereço exibido pelo servidor e entre em `/admin` com sua senha anterior.

O acesso local funciona com `localhost` e `127.0.0.1`, inclusive se a porta do
servidor mudou e `AUTH_URL` ainda está em `http://localhost:4000`. Use o mesmo
endereço durante uma sessão: cookies de `localhost` e `127.0.0.1` são separados
pelo navegador, então mudar de endereço pode pedir login novamente.
Em produção, `AUTH_URL` deve continuar sendo a origem HTTPS exata do site.
Requisições de outros sites continuam bloqueadas.

## Testar agora, sem configurar Neon

Requisito: **Node.js 22.12 ou superior**. No terminal, dentro do projeto:

```powershell
cd apps/web
npm ci
npm run setup:local
npm run dev
```

O `setup:local` pede seu e-mail e uma senha de pelo menos 12 caracteres, aplica as
migrações e cadastra três serviços **de demonstração**. Não há senha padrão. Abra
`http://localhost:4000` e use esse mesmo e-mail/senha em `http://localhost:4000/admin`.
`/admin` reúne a gestão, a agenda, os serviços, os produtos, as fotos e os vídeos.

Esse modo usa Postgres embarcado (PGlite), com dados persistidos em
`apps/web/.data/local`, e só escuta no computador local. É possível cadastrar um
serviço, agendar e conferir a reserva na gestão de verdade. As reservas e alterações
continuam lá após reiniciar. Preços e durações dos exemplos são fictícios; nenhuma
foto real do salão foi incluída. Os três exemplos têm imagens geradas e identificadas
como **ilustrativas**. Cadastre o conteúdo real em `/admin/servicos`.

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

| Sintoma                                      | Verificação                                                                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Catálogo vazio                               | `doctor` distingue falha no banco de catálogo sem serviços. Em `/admin/servicos`, cadastre ao menos um serviço e marque-o como ativo.           |
| Erro ao consultar horários                   | Confira a conexão/migrações. A tela agora exibe erro com botão para tentar novamente; não diz que a agenda está cheia. Sábado continua fechado. |
| “Origem não autorizada” ou endereço inválido | Use esta versão atualizada e reinicie o servidor. `AUTH_URL` deve conter `http://` ou `https://`; execute `doctor` se o erro persistir.         |
| Login indisponível                           | `doctor` confere segredo, URL, migrações e conta autorizada. Execute `setup:local` para testar ou complete a configuração Neon abaixo.          |

Os comandos `dev`, `start`, `doctor`, `db:migrate` e `admin:create` carregam os
arquivos `.env`/`.env.local` no servidor; arquivos específicos do modo também são
respeitados. Variáveis da hospedagem têm prioridade. Reinicie o servidor após
alterar a configuração. Segredos não são enviados para o navegador.

## Usar seu banco Neon e dados reais

Requisitos: Node.js 22.12 ou superior e um banco Neon/Postgres compatível com o driver
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

| Variável          | Uso                                                               |
| ----------------- | ----------------------------------------------------------------- |
| `DATABASE_DRIVER` | `neon` para o banco real; `local` é exclusivo dos testes locais   |
| `DATABASE_URL`    | String de conexão fornecida pelo Neon                             |
| `AUTH_SECRET`     | Segredo aleatório e estável usado nas sessões                     |
| `AUTH_URL`        | `http://localhost:4000` localmente; origem HTTPS real em produção |
| `ADMIN_EMAILS`    | E-mails da equipe, separados por vírgula                          |
| `PORT`            | Porta do servidor, normalmente definida também pela hospedagem    |

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
4. `004_products.sql`: cria o catálogo de produtos, sem alterar estoque interno,
   clientes, serviços, reservas ou contas. Não insere produtos fictícios.
5. `005_catalog_photos.sql`: galerias ordenadas e armazenamento de novas fotos;
   preserva as capas existentes.
6. `006_stock_alerts.sql`: avisos persistentes e gatilho de estoque; inclui os
   produtos que já estavam com pouca quantidade antes da atualização.
7. `007_request_limits.sql`: contadores compartilhados para limitar tentativas de
   login e agendamento, inclusive depois de reiniciar o servidor.

O runner registra checksum e executa cada arquivo em transação, uma única vez.
O schema original não estava no repositório: a base foi reconstruída a partir das
consultas existentes. **Valide primeiro numa cópia/branch do banco Neon existente**.
Duplicidades de telefone, receitas repetidas ou agendamentos sobrepostos podem
impedir a migração 002; nesse caso ela é revertida, e os registros precisam ser
conciliados antes de tentar novamente. Nenhum dado é excluído automaticamente.
Não edite migrações já aplicadas; crie uma migração nova.

## Imagens e conteúdo

O site usa os dados cadastrados em `/admin/servicos`. Apenas `setup:local`
insere serviços de demonstração, quando o catálogo está vazio. Os três exemplos
recebem imagens ilustrativas incluídas no projeto; instalações locais anteriores
com esses exemplos sem imagem também as exibem, sem apagar ou recriar registros.
Veja os arquivos, a origem e os prompts em [docs/imagens-demo.md](docs/imagens-demo.md).
Fotos reais enviadas no admin têm prioridade sobre as imagens de demonstração.
Serviços e produtos aceitam até 8 fotos JPG, PNG ou WebP de até 2 MB cada, ou links
HTTPS. Em **Adicionar fotos**, selecione vários arquivos; use **Usar como capa**
para destacar uma foto e **Remover** para retirá-la. A primeira foto é a capa.
As novas imagens são enviadas individualmente ao servidor e gravadas no Postgres,
com URLs próprias e cache. O catálogo não baixa todas as novas fotos em JSON.
Fotos antigas continuam válidas. A galeria geral e o modelo personalizado de
agendamento mantêm o upload anterior de uma foto. Arquivos retirados de um item
permanecem no banco; limpeza de arquivos órfãos e CDN podem ser adotadas depois.

O logo fornecido foi aplicado no site, no agendamento, no acesso e no admin.
O arquivo está em `apps/web/public/brand/sabrina-braids.svg`; a arte foi preservada,
com ajuste apenas da área visível do SVG para retirar as margens vazias.
O logo e o ícone da aba acompanham o tema do dispositivo: no modo escuro, os
traços ficam claros e o fundo escuro. A troca usa CSS, preserva a arte original
e funciona sem JavaScript. O restante da interface mantém sua paleta atual.

Endereço: **Rua Carlos Palut, 230, Galeria da Merck, Box 10, CEP 22710-310**.
Endereço e expediente ficam em `apps/web/src/utils/salon.js`; a agenda usa a mesma
configuração de horários apresentada no site, no fuso `America/Sao_Paulo`.
WhatsApp `+55 21 99366-2669` e Instagram `@sabrin_braids` foram mantidos.

## Cadastrar os produtos da loja

1. Entre em `/admin` e abra **Produtos** (`/admin/produtos`).
2. Clique em **Adicionar produto** e informe nome, categoria, descrição e preço.
   O preço é opcional: em branco, o site mostra **Preço sob consulta**.
3. Envie até 8 fotos reais em JPG, PNG ou WebP de até 2 MB cada, ou adicione links HTTPS.
   A primeira foto é a capa; use **Usar como capa** para trocar.
4. Marque **Exibir no site** e salve. Uma foto é obrigatória para publicar;
   desmarque essa opção se quiser guardar um rascunho sem foto.
5. Use **Editar** para atualizar o item, **Ocultar** para tirá-lo do catálogo e
   **Exibir no site** para republicar. A ordem de exibição menor aparece primeiro.

O catálogo começa vazio, pronto para as fotos, marcas e preços reais: gel, cera,
gelatina, touca de cetim, mousse, durag, wig cap, presilhas, perfume de cabelo,
finalizador, tônico capilar e outros itens. Nenhum preço ou foto de produto foi
inventado. Produtos sem disponibilidade podem continuar visíveis com a indicação
**Indisponível no momento** e o botão **Consultar reposição**.

A cliente escolhe o produto e abre uma conversa no WhatsApp com o nome do item.
O site não envia mensagens sozinho. Este catálogo não realiza cobrança, checkout
ou baixa automática do estoque interno de materiais da gestão.

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
único e persistência depois de reiniciar. Repete login, agendamento e saída com
`127.0.0.1` e `localhost`, mantendo `AUTH_URL=http://localhost:4000` e iniciando o
servidor em outra porta. Verifica origem externa bloqueada, imagens do catálogo,
rotas novas, logo e redirecionamentos antigos. Testa também CRUD de produtos, fotos, rascunhos, preço opcional, persistência e limites de upload, incluindo requisições em stream. Também verifica a resposta sem `AUTH_SECRET`. Usa conta e senha temporárias e não depende do Neon. O banco de teste
é removido ao terminar; `.env`, `.env.local` e dados do usuário ficam intactos.

Antes de abrir ao público: testar login real, cadastrar um serviço e foto reais,
fazer um agendamento, confirmar/concluir, verificar o financeiro e abrir no celular.
Não há deploy automático neste repositório; o workflow valida o código em PRs.

Validação desta revisão: **34 testes**, build, typecheck, auditoria das dependências
sem vulnerabilidades reportadas e teste HTTP com servidor de produção e banco
persistido. O Chromium verificou o **build de produção**, com CSP ativa: login,
banner e links, botão de topo, upload de várias fotos, capa/remoção, galerias,
agendamento e avisos de estoque (3 → 2 → 8 → 0), leitura e persistência.
Catálogo e admin foram conferidos em 390 px, sem rolagem horizontal, exceções ou
violações de CSP. Não foi executado deploy nem acesso ao banco Neon real.

## Avisos de estoque

O painel **Avisos de estoque** aparece em todas as páginas administrativas e se
atualiza a cada 30 segundos, ao voltar à janela e após salvar alterações. Também
exibe um aviso temporário para novos alertas. Os alertas são **dentro do admin**;
não são mensagens automáticas no WhatsApp, e-mail ou notificações push com o
navegador fechado.

O limite é `max(3, quantidade mínima configurada)`. Uma nova quantidade abaixo
ou igual ao limite renova o aviso; repor acima dele resolve a pendência. Marcar
como lido é compartilhado com a equipe e não esconde o item que ainda precisa de
reposição. O catálogo de venda e o estoque interno continuam separados.

## Segurança e produção

- Dependências vulneráveis atualizadas e integração PDF não utilizada removida.
- Rotas antigas de exportação de tokens (`/api/auth/token` e
  `/api/auth/expo-web-success`) removidas da entrega web; autenticação fica em
  cookie HttpOnly, com Secure em HTTPS e sessão de 8 horas.
- CSP com nonce por resposta em produção; bloqueio de iframe, scripts injetados,
  formulários externos e tipos de upload não permitidos.
- Origem verificada nas mutações, JSON exigido fora das rotas de autenticação,
  limite de 4 MB por requisição e imagens de até 2 MB com assinatura verificada.
- Login: até 20 tentativas por IP em 15 minutos. Agendamento: até 8 tentativas
  por IP em 15 minutos. Resposta 429 inclui `Retry-After`. Contadores ficam no
  Postgres, com HMAC do endereço; não armazenam IP em texto e não zeram no restart.
- `TRUST_PROXY_HOPS=0` localmente. Na hospedagem, configurar somente depois de
  verificar a cadeia de proxies; cabeçalhos de origem encaminhada não são aceitos
  por padrão. A proteção da borda da hospedagem complementa os limites do app.
- Servidor de desenvolvimento limitado a loopback e nomes locais. Produção
  recusa banco local, URL sem HTTPS, segredo curto ou equipe sem configuração.

Para a publicação, consulte [docs/publicacao.md](docs/publicacao.md).
O código inclui `Dockerfile`, diagnóstico `npm run check:production` e CI com
verificação de dependências. Conexão real ao Neon, proxy, domínio, backup e teste
externo continuam dependendo do ambiente de hospedagem. Isso não representa uma
auditoria de segurança completa nem certificação do sistema.
