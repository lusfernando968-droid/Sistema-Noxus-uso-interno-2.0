## Perguntas de Clarificação
1. Quais setores você quer no lançamento inicial além de "tattoo" e "financeiro geral"? (ex.: saúde, estudos, trabalho, casa, projetos pessoais)
2. O financeiro será global com visão por setor, ou cada setor terá um financeiro próprio com regras específicas?
3. Haverá controle de acesso/roles? (usuário único, convidados, perfis com permissões por setor)
4. Mantemos Supabase como backend único? Deseja separar dados por setor via coluna `setor`/`domain` ou por schemas (ex.: `tattoo.*`, `financeiro.*`)?
5. Preferências de navegação: uma sidebar fixa com setores + subitens, ou navegação contextual por setor com um dock global?
6. Sobre migrações: consolidamos `transacoes` como fonte canônica com coluna `setor`, ou migramos para `financeiro_geral` como tabela principal?

## Visão Geral
- Objetivo: evoluir de app focado em estúdio de tatuagem para um gerenciador de vida com “setores” independentes e interoperáveis.
- Estratégia: introduzir uma arquitetura por setor com boundaries claros, rotas moduladas, camada de dados padronizada, e navegação escalável.

## Arquitetura por Setor
- Criar `src/sectors/<setor>/{pages,components,hooks,routes.ts}`.
- Cada setor possui:
  - `routes.ts` expondo suas rotas e guards
  - Hooks de dados padronizados (React Query + Supabase)
  - Componentes UI e páginas próprias
- Core compartilhado:
  - `src/contexts` (Auth/Theme/Navigation)
  - `src/integrations/supabase` (client/types)
  - `src/components/ui` (design system)

## Roteamento
- Centralizar composição das rotas em `src/routes.tsx` e montar setores dinamicamente.
- Padrão de URLs: `/<setor>` e submódulos `/<setor>/<feature>`.
- `ProtectedRoute` permanece como guard; adicionar guard por setor (ex.: `SectorGuard`).

## Camada de Dados
- Padronizar hooks com React Query para cache/invalidação por chave: `['setor', '<nome>', params]`.
- Supabase como fonte única; definir convenção de dados:
  - Opção A (recomendada): manter `public.transacoes` como canônico e adicionar coluna `setor` + índices.
  - Opção B: unificar em `public.financeiro_geral` e migrar hooks para essa tabela.
- Criar DTOs/adapters por setor quando necessário para mapear schema → view-model.

## Permissões
- Estender `AuthContext` com `roles` e `allowedSectors`.
- Implementar `SectorGuard` que verifica permissão do usuário para acessar um setor.
- Preparar estrutura para multiusuário futuro (mesmo que agora seja usuário único).

## Navegação & UX
- Sidebar global: lista de setores + atalhos; itens contextuais por setor.
- Dock global minimalista com ações rápidas (agenda, financeiro, clientes, projetos).
- Breadcrumbs por setor e destaque visual de contexto atual.

## Migrações de Banco
- Se Opção A:
  - Adicionar coluna `setor` em `transacoes` + índices (ex.: `idx_transacoes_setor_tipo_data`).
  - Backfill dos registros existentes (setor = 'tattoo' onde aplicável).
- Se Opção B:
  - Migrar dados de `transacoes` → `financeiro_geral` mantendo compatibilidade.
  - Atualizar hooks e componentes para nova fonte.

## Observabilidade
- Padronizar logs de ação por setor (ex.: criação/edição de transações, agendamentos).
- Métricas por setor (contadores, totais, alertas) e widgets reutilizáveis.

## Fases de Implementação
1. Esqueleto de setores: criar estrutura `src/sectors` e mover páginas existentes (`Tattoo`, `TattooFinanceiro`, `Financeiro`).
2. Rotas modulares: introduzir `routes.tsx` central + `routes.ts` em cada setor; manter comportamentos atuais.
3. Padronização de hooks: migrar `useFinanceiroGeral` para React Query, chavear por setor.
4. Permissões básicas: `allowedSectors` no `AuthContext` + `SectorGuard`.
5. Navegação: Sidebar/Dock ajustados para setores; breadcrumbs.
6. Migração de dados: escolher Opção A ou B, aplicar migrations e backfill.
7. Observabilidade e métricas: widgets por setor e logs.
8. Testes de regressão: navegação, CRUD financeiro, realtime, proteção de rotas.

## Ideias de Melhoria
- Materializar visões por setor para relatórios rápidos (views em Postgres).
- Integrar agenda transversal por setor com `FinancialCalendar` + filtros por setor.
- Configurações por setor (cores, metas, limites) persistidas em tabela `setores_config`.
- Automatizar conciliação bancária com tags e regras por setor.
- Exportações/integrações (CSV/Sheets) segmentadas por setor.

## Resumo para Notion
- Reorg para multi-setor com `src/sectors/<setor>` + rotas moduladas.
- Padronização de hooks com React Query e Supabase.
- Permissões e navegação orientadas a setor.
- Migração: consolidar dados por coluna `setor` (recomendado) ou unificar em `financeiro_geral`.
- Fases claras: esqueleto, rotas, hooks, permissões, navegação, migrações, observabilidade, testes.

Solicito sua confirmação e respostas às perguntas de clarificação para ajustar o plano e iniciar a implementação.