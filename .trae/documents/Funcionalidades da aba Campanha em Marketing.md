## Objetivo
Implementar a aba "Campanha" em Marketing com CRUD completo, filtros e visão resumida, seguindo padrões existentes (RHF + Zod, hooks com Supabase e toasts).

## Perguntas de Esclarecimento
1. Campos obrigatórios da campanha: posso usar título, objetivo, público-alvo, canal, orçamento, período (início/fim), status, tags e notas?
2. Status desejados: rascunho, ativa, pausada e encerrada atendem?
3. Canais: Instagram, Facebook, TikTok, Google Ads, Orgânico, Email — algum outro necessário?
4. Deseja anexar mídia/arquivo (briefing, criativos) já nesta fase ou deixamos para depois?
5. Precisamos de metas/KPIs (ex.: leads, alcance, CPL) já no cadastro ou apenas texto livre por enquanto?
6. Deseja permissões por papel (quem pode criar/editar/encerrar) ou seguimos padrão do ProtectedRoute?

## Escopo Funcional
- Listagem de campanhas com filtros por status, canal e período + busca por texto.
- Ações: criar, editar, duplicar, encerrar/pausar/ativar, excluir.
- Resumo: contadores por status, total de orçamento no período filtrado.
- Feedback: toasts de sucesso/erro; loading e empty states.

## Modelagem de Dados (Supabase)
Tabela `campanhas`:
- `id` (uuid), `titulo` (text), `objetivo` (text), `publico_alvo` (text), `canal` (text/enum), `orcamento` (numeric), `data_inicio` (date), `data_fim` (date), `status` (text/enum), `tags` (text[] ou jsonb), `notas` (text), `owner_id` (uuid), `created_at`, `updated_at`.

## Implementação Técnica
### Hooks e Schema
- `src/hooks/useCampanhas.ts`
  - `campanhaSchema` (Zod) e tipos TS.
  - CRUD: `list({status, canal, periodo, q})`, `create`, `update`, `duplicate`, `delete`, `setStatus`.
  - Realtime (opcional nesta fase): canal para `campanhas`.
- Toasts e erros padronizados (seguindo `useCarteira`/`useLinhasCredito`).

### Componentes
- `src/components/marketing/campanha/CampanhaFormModal.tsx`
  - `react-hook-form` + `zodResolver(campanhaSchema)`; campos com validação.
- `src/components/marketing/campanha/CampanhaTable.tsx`
  - Tabela com colunas: Título, Canal, Período, Orçamento, Status, Ações.
  - Filtros: Status, Canal, Período, Busca.
- `src/components/marketing/campanha/CampanhaStats.tsx`
  - Cards com contadores por status e total de orçamento do filtro.

### Integração na Página
- `src/pages/Marketing.tsx`
  - Dentro de `TabsContent value="campanha"`: renderizar `CampanhaStats`, barra de filtros e `CampanhaTable`.
  - Botão "Nova Campanha" abre `CampanhaFormModal`.

## Fases
1. Criar schema Zod, tipos e hook `useCampanhas` (list/create/update/delete/duplicate/setStatus).
2. Implementar `CampanhaFormModal` com RHF + Zod e toasts.
3. Criar `CampanhaTable` com filtros e ações.
4. Adicionar `CampanhaStats` e integrar todos na aba da página `Marketing`.
5. Validação: fluxo completo (criar/editar/duplicar/pausar/encerrar/excluir), filtros e métricas; revisão de UX.

## Validação e Testes
- Testar CRUD manualmente e estados de loading/empty.
- Validar filtros combinados (status+canal+período+busca).
- Medir orçamentos somados do conjunto filtrado.

## Reflexão de Escalabilidade e Manutenibilidade
- Separar por módulos (hook + componentes) e usar Zod garante consistência e facilita evolução (ex.: adicionar KPIs e anexos). Hooks isolam Supabase e permitem futura troca ou cache com React Query. Componentes pequenos reduzem complexidade e mantêm o arquivo de página leve.
- Próximos passos podem incluir: enums de canal/status em arquivo único, lazy loading por aba, permissões por papel e logs de auditoria.

## Ideias de Melhorias
- Duplicar com opção de deslocar período automaticamente.
- Persistir filtros e aba ativa em query string.
- Exportar campanhas filtradas em CSV.
- Indicadores de desempenho básicos por campanha (KPI placeholders).
- Templates de campanha para agilizar cadastro.

## Solicitação
Aprova este plano? Confirmando, implemento todas as fases e entrego a aba "Campanha" funcional com CRUD e filtros.