create table if not exists public.anuncios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  nome text not null,
  objetivo text,
  plataforma text not null check (plataforma in ('INSTAGRAM','FACEBOOK','TIKTOK','GOOGLE_ADS','LINKEDIN','YOUTUBE')),
  formato text not null check (formato in ('IMAGEM','VIDEO','CARROSSEL','COLECAO','STORIES')),
  orcamento numeric not null default 0,
  data_inicio date,
  data_fim date,
  status text not null check (status in ('RASCUNHO','ATIVO','PAUSADO','ENCERRADO')),
  publico_alvo text,
  url_criativo text,
  impressoes integer default 0,
  cliques integer default 0,
  conversoes integer default 0,
  custo_total numeric default 0,
  tags text[],
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_anuncios_user on public.anuncios(user_id);
create index if not exists idx_anuncios_status on public.anuncios(status);
create index if not exists idx_anuncios_plataforma on public.anuncios(plataforma);
create index if not exists idx_anuncios_periodo on public.anuncios(data_inicio, data_fim);

alter table public.anuncios enable row level security;

create policy anuncios_select on public.anuncios for select using (user_id = auth.uid());
create policy anuncios_insert on public.anuncios for insert with check (user_id = auth.uid());
create policy anuncios_update on public.anuncios for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy anuncios_delete on public.anuncios for delete using (user_id = auth.uid());

drop trigger if exists trg_anuncios_updated on public.anuncios;
create trigger trg_anuncios_updated before update on public.anuncios
for each row execute function public.set_updated_at();
