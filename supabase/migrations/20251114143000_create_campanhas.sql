create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titulo text not null,
  objetivo text,
  publico_alvo text,
  canal text not null check (canal in ('INSTAGRAM','FACEBOOK','TIKTOK','GOOGLE_ADS','ORGANICO','EMAIL')),
  orcamento numeric,
  data_inicio date,
  data_fim date,
  status text not null check (status in ('RASCUNHO','ATIVA','PAUSADA','ENCERRADA')),
  tags text[],
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_campanhas_user on public.campanhas(user_id);
create index if not exists idx_campanhas_status on public.campanhas(status);
create index if not exists idx_campanhas_canal on public.campanhas(canal);
create index if not exists idx_campanhas_periodo on public.campanhas(data_inicio, data_fim);

alter table public.campanhas enable row level security;

create policy campanhas_select on public.campanhas for select using (user_id = auth.uid());
create policy campanhas_insert on public.campanhas for insert with check (user_id = auth.uid());
create policy campanhas_update on public.campanhas for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy campanhas_delete on public.campanhas for delete using (user_id = auth.uid());

drop trigger if exists trg_campanhas_updated on public.campanhas;
create trigger trg_campanhas_updated before update on public.campanhas
for each row execute function public.set_updated_at();
