## Objetivo
- Dois CRUDs independentes.
- Registros sincronizados de "Financeiro Tattoo" aparecem em "Financeiro Geral" somente leitura.
- Um botão "Editar no Tattoo" leva direto ao registro na página Tattoo para edição.

## Perguntas de Clarificação
- Confirmar rota do Tattoo para deep-link: ex.: `/tattoo-financeiro?id=<uuid>`.
- Deseja também um botão "Ver detalhes" além de "Editar no Tattoo"?
- O Geral deve ocultar o botão de exclusão para linhas sincronizadas de Tattoo, correto?
- Confirmar que exclusão deve ser feita exclusivamente no Tattoo.
- Precisamos de permissão/guard para evitar acessar registros de outros usuários via deep-link (RLS já cobre; na UI adicionamos checagem)?

## Banco de Dados
- Renomear `public.transacoes` → `public.financeiro_tattoo`.
- Em `public.financeiro_geral` adicionar:
  - `origem TEXT`, `origem_id UUID`, `setor TEXT` (valor: `'Tattoo'`), índice único em `("origem","origem_id")`.
- Triggers em `financeiro_tattoo`:
  - `AFTER INSERT` → inserir espelho em `financeiro_geral`.
  - `AFTER UPDATE` → atualizar espelho (envolve "dar baixa").
  - `AFTER DELETE` → remover espelho.

## Integração/Tipos
- Atualizar tipos para refletir `financeiro_tattoo` e novas colunas em `financeiro_geral`.

## Hooks/Serviços
- `useFinanceiroTattoo`: CRUD completo.
- `useFinanceiroGeral`: CRUD apenas para linhas sem `origem`; para linhas com `origem`:
  - Retornar flag `readOnly: true` e `editLink: '/tattoo-financeiro?id=<origem_id>'`.

## UI
- "Financeiro Geral":
  - Renderizar linhas sincronizadas com estado de leitura (campos desabilitados, sem ações de editar/excluir);
  - Adicionar botão "Editar no Tattoo" que redireciona com `origem_id`.
  - Adicionar badge "Sincronizado de Tattoo".
- "TattooFinanceiro":
  - Suportar deep-link por `id` (selecionar o registro e abrir modal de edição).

## Validação
- Testar insert/update/delete no Tattoo e refletir no Geral.
- Testar leitura em Geral e navegação de atalho para edição no Tattoo.
- Validar RLS e acessos por deep-link.

## Entregáveis
- Migration de rename + novas colunas/índices em `financeiro_geral`.
- Funções/Triggers de sincronização.
- Atualização de tipos e hooks.
- Ajustes de UI para leitura e link "Editar no Tattoo".

## Ideias de Melhoria
- Toast/notification ao voltar do Tattoo indicando que a atualização refletiu no Geral.
- Filtros em Geral para "Somente sincronizados" / "Somente nativos".
- Breadcrumb entre páginas para fluxo mais claro.
- Logs de auditoria por `origem`.
- Cache por registro via `origem_id`.

## Resumo p/ Notion
- Linhas sincronizadas de Tattoo em "Financeiro Geral" são somente leitura e oferecem botão "Editar no Tattoo" com deep-link por `origem_id`.

Posso iniciar conforme este plano (somente leitura no Geral e atalho de edição no Tattoo)?