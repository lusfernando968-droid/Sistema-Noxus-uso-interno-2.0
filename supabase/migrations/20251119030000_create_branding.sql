create table if not exists public.ativos_marca (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nome text not null,
  descricao text,
  tipo text not null check (tipo in ('LOGO','PALETA_CORES','TIPOGRAFIA','DIRETRIZ','TEMPLATE')),
  arquivo_url text,
  dados_json jsonb, -- para armazenar cores, fontes, etc
  tags text[],
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ativos_marca_user on public.ativos_marca(user_id);
create index if not exists idx_ativos_marca_tipo on public.ativos_marca(tipo);

alter table public.ativos_marca enable row level security;

create policy ativos_marca_select on public.ativos_marca for select using (user_id = auth.uid());
create policy ativos_marca_insert on public.ativos_marca for insert with check (user_id = auth.uid());
create policy ativos_marca_update on public.ativos_marca for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ativos_marca_delete on public.ativos_marca for delete using (user_id = auth.uid());

drop trigger if exists trg_ativos_marca_updated on public.ativos_marca;
create trigger trg_ativos_marca_updated before update on public.ativos_marca
for each row execute function public.set_updated_at();
