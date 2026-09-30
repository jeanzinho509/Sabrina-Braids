# Publicar Sabrina Braids

A entrega está preparada para Node.js com banco Neon. Não é um site puramente
estático: login, agenda, estoque e fotos precisam do servidor e do banco.
Nenhuma hospedagem foi criada nesta revisão. Render e Neon são opções compatíveis;
as contas e o ambiente de produção precisam ser conectados antes do deploy.

## Configuração versionada do Render

O arquivo `render.yaml`, na raiz, configura um único Web Service Node em
`apps/web`, com o banco externo no Neon. Usa o plano gratuito para não contratar
recursos pagos automaticamente. Esse plano suspende o serviço após inatividade;
a primeira visita pode demorar a responder. Avaliar um plano sem suspensão antes
de depender do site para atendimento contínuo.

A região inicial é Virginia. Conferir a região do projeto Neon antes de criar o
serviço. O Blueprint gera `AUTH_SECRET`; `DATABASE_URL` e `ADMIN_EMAILS` são
preenchidos no painel, sem valores secretos no repositório. `AUTH_URL` referencia
`RENDER_EXTERNAL_URL` do próprio serviço, recebendo o endereço HTTPS real atribuído
pelo Render. Ao adotar um domínio próprio, substituir essa referência pela origem
HTTPS do domínio no Blueprint e na configuração do serviço.

Os deploys automáticos e as prévias ficam desativados durante a preparação.
O primeiro Apply do Blueprint ainda inicia uma implantação; preparar o banco e
a conta de administração antes dele. Executar as migrações como etapa separada,
usando a conexão direta do Neon (sem `-pooler`); o runtime pode usar a conexão
pooled. Validar também `TRUST_PROXY_HOPS` antes de divulgar o site.

O YAML foi validado localmente contra o JSON Schema oficial do Render. A criação
real, as permissões da conta e os limites do plano só serão confirmados no deploy.
Se houver CLI Render autenticado, executar na raiz `render blueprints validate`
antes do Apply. O CLI não estava disponível neste ambiente de entrega.

Antes de usar o Blueprint, enviar a versão completa para o GitHub. O guia
`docs/enviar-para-github.md` mostra como importar o pacote Git no Windows.

## Configuração do serviço

| Campo                               | Valor                                                      |
| ----------------------------------- | ---------------------------------------------------------- |
| Repositório                         | `jeanzinho509/Sabrina-Braids`, atualizado com esta entrega |
| Tipo                                | Web Service Node                                           |
| Diretório raiz                      | `apps/web`                                                 |
| Node                                | 22.12 ou superior; Docker usa Node 24                      |
| Build                               | `npm ci --include=dev && npm run build`                    |
| Start                               | `npm start`                                                |
| Health check do processo            | `/health`                                                  |
| Diagnóstico de configuração e banco | `npm run check:production`                                 |

Antes da primeira publicação, atualizar o repositório com o pacote entregue. As
alterações desta sessão estão em commits locais; não há push ou PR remoto desta
revisão. O acesso de escrita do GitHub havia retornado 403 na sessão anterior.

## Variáveis no painel da hospedagem

| Variável           | Conteúdo                                                                                              |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| `NODE_ENV`         | `production`                                                                                          |
| `DATABASE_DRIVER`  | `neon`                                                                                                |
| `DATABASE_URL`     | String de conexão fornecida pelo projeto Neon                                                         |
| `AUTH_SECRET`      | Segredo aleatório estável de pelo menos 32 caracteres                                                 |
| `AUTH_URL`         | Origem HTTPS real, sem caminho; usar o domínio temporário do host se ainda não houver domínio próprio |
| `ADMIN_EMAILS`     | E-mails autorizados da equipe, separados por vírgula                                                  |
| `PORT`             | Porta fornecida pela hospedagem                                                                       |
| `TRUST_PROXY_HOPS` | Número validado de proxies entre o cliente e o servidor; manter 0 até confirmar                       |

Cadastre segredos no painel do host. Não envie senha ou string de conexão pelo
chat nem pelo GitHub. Se existir mais de um proxy, validar o endereço efetivo antes
de mudar `TRUST_PROXY_HOPS`; uma configuração errada pode agrupar clientes no mesmo
limite ou permitir falsificação de endereço.

## Banco e entrada em operação

1. Escolher o projeto/branch Neon de produção e manter backup ou branch de restauração
   se já houver dados. Validar as migrações primeiro numa cópia do banco existente.
2. Com as variáveis desse ambiente disponíveis, executar uma vez:

   ```bash
   npm run db:migrate
   npm run admin:create
   npm run check:production
   ```

   Se a conta de equipe já existe, não é necessário recriá-la. O runner de migrações
   é transacional e preserva o histórico. Não executar `setup:local` na hospedagem.

3. Publicar o build e abrir o endereço HTTPS. Verificar login, catálogo com fotos
   reais, agendamento, confirmação/conclusão, financeiro e estoque em um celular.
4. Conferir o IP efetivo atrás do proxy e os limites de tentativas. Testar também
   sessão, HTTPS e diagnóstico de banco após reiniciar a instância.
5. Somente então configurar domínio próprio, atualizar `AUTH_URL` e divulgar o site.

Os registros que estão no PGlite do computador não são copiados automaticamente
para o Neon. Caso sejam dados reais, é preciso planejar e validar essa transferência
antes da publicação. A pasta `.data` não deve ser enviada à hospedagem. Fotos novas
ficam no banco, portanto não dependem de disco persistente na aplicação.

## Docker (alternativa ao runtime Node do provedor)

O contexto de build é `apps/web`. O container executa com usuário `node`, sem
segredos embutidos. Não foi possível validar um build Docker neste ambiente; os
mesmos comandos de build/start foram validados diretamente em Node.

```bash
docker build -t sabrina-braids ./apps/web
docker run --rm --env-file caminho/seguro/producao.env sabrina-braids node scripts/check-production.mjs
docker run --rm --env-file caminho/seguro/producao.env -p 4000:4000 sabrina-braids
```

HTTPS e domínio são fornecidos pelo proxy/host. Migrações devem rodar uma vez como
etapa de release, antes de subir réplicas; não são disparadas automaticamente em
cada inicialização. `/health` verifica somente o processo, não a prontidão do banco.

## Rollback

Manter uma versão anterior do código e backup do banco antes do release. As
migrações 005–007 são aditivas; não apagar tabelas novas durante um rollback.
Não restaurar backup sobre reservas novas sem conciliação prévia. Após rollback,
verificar novamente login, agenda e financeiro.

Referências: [Render — Node](https://render.com/docs/deploy-node-express-app),
[Render — monorepos](https://render.com/docs/monorepo-support),
[Render — Blueprint](https://render.com/docs/blueprint-spec),
[Render — plano gratuito](https://render.com/docs/free),
[React Router — CSP](https://reactrouter.com/how-to/security).
