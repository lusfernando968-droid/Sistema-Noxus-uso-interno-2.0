## Perguntas de confirmação
1. Qual projeto Supabase devemos usar? Sugiro `Noxus Dashboard (fplfjqttuvawzachfnob)` porque já tem `financeiro_geral` e `transacoes`.
2. Mantemos o nome da tabela da Carteira como `public.financeiro_tattoo` (compatível com o código atual) ou prefere `public.financeiro_geral`?
3. Ativamos RLS por `user_id = auth.uid()` para segurança (select/insert/update/delete)?
4. Ligamos `conta_id` à `public.contas_bancarias(id)` com `ON DELETE SET NULL`?
5. Precisamos sincronizar Carteira → `financeiro_geral` via trigger (opcional) ou Carteira é independente?
6. Aplicar em ambiente nuvem apenas, ou também no local (CLI)?

## Plano
### 1) Criar tabela `public.financeiro_tattoo`
- DDL:
  - `id uuid pk default gen_random_uuid()`
  - `user_id uuid not null`
  - `tipo text not null check (tipo in ('RECEITA','DESPESA'))`
  - `categoria text not null`
  - `valor numeric(14,2) not null`
  - `data_vencimento date not null`
  - `data_liquidacao date null`
  - `descricao text not null`
  - `agendamento_id uuid null`
  - `conta_id uuid null`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- Índices: `(user_id)`, `(data_vencimento)`, `(conta_id)`
- FKs: `conta_id → public.contas_bancarias(id)` (opcional), `agendamento_id → public.agendamentos(id)` (se existir)
- Trigger `updated_at` on update

### 2) RLS e Policies
- `enable row level security` na tabela
- Policies:
  - `SELECT`: `user_id = auth.uid()`
  - `INSERT`: `user_id = auth.uid()`
  - `UPDATE`: `user_id = auth.uid()`
  - `DELETE`: `user_id = auth.uid()`

### 3) Ajustes no backend/app
- O hook `useCarteira` já usa `.from('financeiro_tattoo')`; sem mudanças adicionais.
- Manter `carteiraSchema` (Zod) alinhado aos campos; `conta_id`/`data_liquidacao`/`agendamento_id` tratados como `null` quando vazios.

### 4) Aplicação
- Executar a migration no projeto `fplfjqttuvawzachfnob`.
- Recarregar schema do PostgREST: `select pg_notify('pgrst','reload schema');`.

### 5) Validação
- Tentar salvar uma transação pela UI da Carteira; verificar inserção e atualização da tabela.
- Query de sanity: `select * from public.financeiro_tattoo where user_id = auth.uid() order by created_at desc limit 1;`

### 6) Fallback (se necessário)
- Caso prefira não criar `financeiro_tattoo`, posso alternar o hook para usar `public.transacoes` ou `public.financeiro_geral` até concluir a migração.

## Entregáveis
- Migration aplicada com tabela `financeiro_tattoo` criada e policies ativas
- UI salvando normalmente no backend

## Próximos passos após aprovação
1. Aplicar migration no projeto escolhido
2. Recarregar schema
3. Validar inserção via UI e SQL
4. Reportar status e sugerir próximos passos (triggers, views, métricas)