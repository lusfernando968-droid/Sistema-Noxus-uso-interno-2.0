-- Tabela de estoque de materiais
create table if not exists public.estoque_materiais (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  data_aquisicao date not null,
  tipo_material text not null,
  nome text not null,
  marca text,
  fornecedor text,
  quantidade numeric(12,2) not null,
  unidade text not null,
  custo_unitario numeric(12,2) not null,
  valor_total numeric(14,2) generated always as (quantidade * custo_unitario) stored,
  lote text,
  validade date,
  local_armazenamento text,
  observacoes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices
create index if not exists estoque_materiais_user_id_idx on public.estoque_materiais(user_id);
create index if not exists estoque_materiais_data_idx on public.estoque_materiais(data_aquisicao);

-- RLS
alter table public.estoque_materiais enable row level security;

-- Políticas: apenas o dono (auth.uid()) pode ver e manipular
create policy if not exists "Usuários podem ver seus próprios materiais"
  on public.estoque_materiais for select
  using (auth.uid() = user_id);

create policy if not exists "Usuários podem inserir seus próprios materiais"
  on public.estoque_materiais for insert
  with check (auth.uid() = user_id);

create policy if not exists "Usuários podem atualizar seus próprios materiais"
  on public.estoque_materiais for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Usuários podem excluir seus próprios materiais"
  on public.estoque_materiais for delete
  using (auth.uid() = user_id);

-- Trigger de updated_at
create trigger set_estoque_materiais_updated_at
before update on public.estoque_materiais
for each row execute function public.set_updated_at();

