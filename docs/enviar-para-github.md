# Enviar a entrega para o GitHub no Windows

O arquivo `Sabrina-Braids-publicacao.bundle` contém o histórico Git e todas as
melhorias entregues, incluindo fotos, banner, alertas, segurança e a configuração
do Render. Ele não inclui senhas, variáveis de ambiente, dependências instaladas
ou o banco local.

## Importar em uma pasta nova

1. Baixe o bundle para a pasta Downloads. Mantenha o nome do arquivo.
2. Abra o PowerShell em uma pasta onde você guarda seus projetos.
3. Execute cada comando abaixo e continue somente se o anterior terminar sem erro:

```powershell
git clone -b codex/finish-web-delivery "$env:USERPROFILE\Downloads\Sabrina-Braids-publicacao.bundle" Sabrina-Braids-publicacao
cd Sabrina-Braids-publicacao
git remote set-url origin https://github.com/jeanzinho509/Sabrina-Braids.git
git push origin HEAD:main
```

O Git poderá solicitar sua autenticação no GitHub. Use a conta com acesso ao
repositório. Não envie credenciais no chat.

Os comandos criam uma pasta nova e enviam o histórico por um push normal, sem
forçar a substituição do histórico remoto. Se a pasta já existir, escolha outro
nome no `git clone` e no `cd`. Se o push for rejeitado, pare e compartilhe somente
a mensagem de erro; não use `--force`.

## Preservar seus dados

Sua pasta de trabalho anterior continua sendo a fonte dos cadastros e fotos que
você adicionou localmente. Não apague essa pasta e não envie seu arquivo de
ambiente ou banco para o GitHub. Caso tenha alterado o código depois da última
entrega, compare essas mudanças antes de substituir sua versão de trabalho.

Esse envio atualiza o código. Os registros do banco local ainda precisam ser
transferidos separadamente para o Neon se forem dados reais que deseja publicar.

## Conferir

Abra o repositório e confirme que `render.yaml` aparece na raiz e que o histórico
inclui o commit `Prepare Render configuration and GitHub handoff`. Depois disso,
a publicação pode continuar usando a branch `main`.
