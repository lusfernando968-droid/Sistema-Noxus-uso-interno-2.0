## Perguntas de Esclarecimento
1. Disciplinas: devemos ter uma lista fixa (ex.: Matemática, Física) ou campo livre e/ou tabela `disciplinas`?
2. Modelos: existem modelos de aula já definidos no app ou criamos `aula_modelos` com exemplos (Teórica, Prática, Workshop)?
3. Controle de versões: precisamos versionar apenas campos-chave (status, prazo, responsável, estrutura) ou também o conteúdo completo (markdown/JSON)?
4. Permissões: qualquer usuário autenticado pode editar/mover aulas ou restringimos a quem for responsável/owner?
5. Integração com páginas: a seção deve ficar dentro de `Curso MVP` (tab "aulas") e também ter rota dedicada?
6. KPIs: precisamos métricas (por coluna, lead time, vencidos) visíveis no topo do Kanban?

## Visão Geral
- Adicionar uma seção de gestão de aulas com visão Kanban e lista alternativa
- Arrastar e soltar entre fases: Esboço inicial → Desenvolvimento → Revisão → Finalização → Pronta
- Copiar estruturas de modelos de aula e adaptar por aula
- Persistência automática (Supabase) e controle de versões
- Filtros por status/disciplinas/responsável e busca rápida
- Responsivo para desktop e mobile, com feedback visual durante DnD

## Referências Existentes no Código
- Página `CursoMVP` tem espaço para aulas: `src/pages/CursoMVP.tsx:1-49`
- Padrão Kanban e DnD simples já utilizados em `src/pages/Projetos.tsx:384-421` e cartões em `src/pages/Projetos.tsx:316-346`
- Controles de busca/filtro existentes em Metas e Agendamentos (reutilizar UI): `src/components/dashboard/MetasTab.tsx:165-207`, `src/pages/Agendamentos.tsx:950-976`

## Back-end (Supabase)
- Tabelas novas:
  - `public.aulas`: `id`, `user_id`, `titulo`, `descricao`, `status` (enum: esboco, desenvolvimento, revisao, finalizacao, pronta), `disciplina`, `responsavel_id` (FK `profiles`), `prazo` (date), `modelo_id` (FK), `estrutura` (JSON), `created_at`, `updated_at`
  - `public.aula_versions`: `id`, `aula_id` (FK), `user_id`, `version_number`, `diff` (JSON opcional), `snapshot` (JSON do registro completo), `created_at`
  - `public.aula_modelos`: `id`, `user_id`, `titulo`, `disciplina` (opcional), `estrutura_base` (JSON), `descricao`, `created_at`, `updated_at`
- RLS por `user_id`; policies de select/insert/update; índices em `status`, `prazo`, `responsavel_id`
- Migrations nomeadas e adicionadas ao diretório `supabase/migrations`

## Tipos e Hooks
- Atualizar tipos gerados em `src/integrations/supabase/types.ts` (após migrations)
- `hooks/useAulas.ts`:
  - Carregar aulas (React Query), filtros/busca, paginação opcional
  - `updateStatus(id, novoStatus)` com otimista + rollback
  - `updateAula(id, patch)` e geração de versão
  - `createAulaFromModelo(modeloId, overrides)`
- `hooks/useAulaModelos.ts`: listar/copiar modelos

## Componentes
- `components/aulas/AulaCard.tsx`: card com título, status, prazo, responsável; duplo clique abre edição
- `components/aulas/AulaEditDialog.tsx`: edição detalhada (campos + estrutura), aba "Versões" com lista e botão restaurar
- `components/aulas/KanbanAulas.tsx`: colunas por status, DnD nativo (consistente com Projetos), feedback visual “Soltar aqui”
- `components/aulas/AulasList.tsx`: tabela alternativa com colunas principais e ações
- Controles: busca (`Input`), filtros (`Select`), chips (`Badge`), toggle de visão (`Tabs`/`Segmented`)

## Integração de Página
- `src/pages/CursoMVP.tsx`: substituir conteúdo da tab "aulas" por os controles + toggle de visão e render de `KanbanAulas` ou `AulasList`
- Rotas: manter dentro de CursoMVP inicialmente; opcional criar rota dedicada `/curso/aulas`

## UX/Feedback
- Arrastar: highlight de coluna destino com borda tracejada e rótulo "Soltar aqui"
- Loading/erro: `sonner` para toasts; spinners nos cards quando persistindo
- Atalhos: duplo clique no card abre edição; click no responsável abre selector

## Responsividade
- Grid de colunas `grid-cols-1 md:grid-cols-3 lg:grid-cols-5`
- Scroll horizontal com `overflow-x-auto` e `snap-x` no mobile; cards compactos

## Persistência & Versões
- Mover coluna: update status + inserir em `aula_versions` com snapshot
- Editar conteúdo: salvar patch + nova versão; permitir comparar e restaurar

## Controle de Modelos
- Modal "Criar a partir de Modelo": seleciona um modelo, pré-preenche `estrutura` e campos; permite ajustes antes de salvar

## Segurança
- Respeitar RLS; validar `responsavel_id` contra `profiles`
- Sanitizar campos textuais; evitar expor segredos

## Entregáveis (Fases)
1. Migrations e tipos Supabase
2. Hooks `useAulas`/`useAulaModelos`
3. Componentes: Card, EditDialog, Kanban
4. Controles: filtros/busca/toggle
5. Integração em `CursoMVP`
6. Versões: visualização e restauração
7. Testes manuais + validação responsiva

## Próximas Melhorias
- Métricas por coluna (contagem, prazos vencidos, lead time)
- Assinaturas em tempo real (`supabase.channel`) para colaboração
- Exportar/importar aulas (JSON)
- Etiquetas e cores por disciplina
- Notificações quando prazo se aproxima