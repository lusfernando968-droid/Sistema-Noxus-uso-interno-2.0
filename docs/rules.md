# Regras de Commit e Push

Estas regras visam manter o fluxo contínuo de versionamento e sincronização com o repositório remoto.

## Remoto
- Remoto configurado: `origin` -> `https://github.com/lusfernando968-droid/Noxus-dashboard-1.0.2.git`

## Política
- Sempre realizar `git add -A` após mudanças relevantes.
- Sempre realizar `git commit -m "<mensagem>"` com descrição objetiva.
- Push automático: configurado via hook `post-commit` para enviar o commit imediatamente após cada commit.

## Como funciona o push automático
- Um hook local em `.git/hooks/post-commit` detecta a branch atual e executa `git push -u origin <branch>`.
- Na primeira vez, define o upstream; nas próximas, mantém a sincronização automática.

## Observações
- Hooks locais não são versionados; cada ambiente/clonagem precisa configurar o hook.
- Em ambientes Windows, o Git utiliza shell para hooks; é recomendado ter Git Bash instalado.
- Caso deseje desativar temporariamente, renomeie o arquivo `post-commit`.

## Dica de mensagens
- Use prefixos como `feat:`, `fix:`, `chore:`, `docs:`, `refactor:` para clareza.