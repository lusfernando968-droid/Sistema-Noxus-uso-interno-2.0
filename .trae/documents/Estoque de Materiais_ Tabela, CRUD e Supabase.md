## Perguntas de Esclarecimento
1. Campos adicionais além de data de aquisição e tipo: confirmar se devemos incluir nome do material, marca, fornecedor, quantidade, unidade (ex.: un, ml, g), custo unitário, lote, validade, local de armazenamento e observações.
2. Multiusuário: vinculamos cada registro ao `user_id` (padrão do projeto), com RLS permitindo CRUD apenas ao dono? Há necessidade de papel de admin (via `has_role`) com permissões ampliadas?
3. Tipo e unidade: prefere enum fixo (com tabela de referência) ou texto livre inicialmente? Mantendo simples, posso começar com texto livre e evoluir para enum/tabela depois.
4. Valor total: deseja coluna gerada automaticamente (`quantidade * custo_unitario`) armazenada no banco (generated stored) ou cálculo apenas no frontend?
5. Tabela: quais colunas são obrigatórias na visualização e quais filtros precisamos (por tipo, intervalo de datas, busca por nome/marca)?
6. Análise de custo: quais métricas iniciais deseja (ex.: gasto total, custo médio por tipo, gasto por mês) e se quer um gráfico de barras por tipo ou linhas por mês.

## Visão Geral
Implementar a aba "Materiais" em `Estoque` com uma tabela de estoque, formulário de cadastro/edição em diálogo, e CRUD completo via Supabase com RLS. Criar migração da tabela no Supabase. Preparar a aba "Análise de custo" com métricas agregadas e um gráfico simples, reutilizando padrões do projeto.

## Back-end (Supabase)
- Criar migração `supabase/migrations/<timestamp>_create_estoque_materiais.sql` contendo:
  - Tabela `public.estoque_materiais` com:
    - `id uuid primary key default gen_random_uuid()`
    - `user_id uuid not null` (owner) e índice
    - `data_aquisicao date not null`
    - `tipo_material text not null`
    - `nome text not null`
    - `marca text`
    - `fornecedor text`
    - `quantidade numeric(12,2) not null`
    - `unidade text not null`
    - `custo_unitario numeric(12,2) not null`
    - `valor_total numeric(14,2) generated always as (quantidade * custo_unitario) stored`
    - `lote text`, `validade date`, `local_armazenamento text`, `observacoes text`
    - `created_at timestamptz default now()`, `updated_at timestamptz default now()`
  - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
  - Policies: SELECT/INSERT/UPDATE/DELETE com `USING/WITH CHECK (auth.uid() = user_id)`
  - Trigger: `updated_at` usando `public.set_updated_at()` (`for each row execute function public.set_updated_at();`)
  - Índices: `user_id`, `data_aquisicao`

## Data Layer
- Criar um hook `src/hooks/useMateriaisEstoque.ts` com `@tanstack/react-query`:
  - `useMateriaisList()` → `supabase.from('estoque_materiais').select('*').order('data_aquisicao', { ascending: false })`
  - `useCreateMaterial()` → `insert` com `user_id = auth.uid()`
  - `useUpdateMaterial()` → `update` por `id`
  - `useDeleteMaterial()` → `delete` por `id`
  - Query keys: `["estoqueMateriais"]` e invalidação após mutações.
- Esquema Zod `materialSchema` para validação dos campos e tipagens.

## UI: Materiais (Tabela + Form)
- Criar `src/components/estoque/MateriaisTable.tsx`:
  - Usa `Table` (`components/ui/table`) para listar colunas: Data aqu., Tipo, Nome, Marca, Quantidade, Unidade, Custo (R$), Total (R$), Ações.
  - Ações: Editar (abre modal com dados) e Excluir (confirmação).
  - Filtros básicos: por tipo e intervalo de datas (inicialmente selecionar via inputs simples).
- Criar `src/components/estoque/MaterialFormDialog.tsx`:
  - `Dialog` (`components/ui/dialog`) + `react-hook-form` com `zodResolver(materialSchema)`.
  - Campos: data aquisição (date), tipo (text/select), nome, marca, fornecedor, quantidade (number), unidade (text/select), custo unitário (number), lote, validade (date), local, observações.
  - Botão "Adicionar material" na aba abre o diálogo em modo create; no modo edit, abre com valores existentes.
- Integrar na página `Estoque.tsx` (aba "Materiais"): render da tabela e botão "Adicionar".

## UI: Análise de Custo
- Criar `src/components/estoque/AnaliseCusto.tsx` (ou inline inicialmente):
  - Métricas: Total gasto (soma de `valor_total`), custo médio por material, distribuição por `tipo_material`.
  - Gráfico: barras por tipo com valores totais, usando o estilo do projeto (podemos construir simples sem lib externa, ou evoluir usando o padrão de `AdvancedCharts`).

## Segurança e RLS
- Respeitar RLS vinculando `user_id` ao `auth.uid()` em inserts e filtrando selects.
- Sem alterar `.env`; reutilizar o cliente Supabase existente.

## Testes e Verificação
- Fluxo manual: criar, editar, excluir e listar materiais; validar RLS logado.
- Verificar cálculo de `valor_total` (se for coluna gerada) e consistência na tabela.

## Entregáveis
- Migração Supabase para `estoque_materiais` com RLS + trigger.
- Hook de dados com queries e mutações.
- Tabela de Materiais com formulário em modal e ações.
- Aba de Análise de Custo com métricas e gráfico simples.

## Próximas Evoluções (após MVP)
- Tabelas de referência para `tipo_material` e `unidade` (enum/lookup) com selects.
- Controle de estoque por consumo (saídas) e histórico de movimentações.
- Importação CSV para materiais.
- Relatórios por período e exportação.

Confirma a abordagem e os campos? Com sua validação, implemento a migração, hooks e UI conforme descrito.