create table if not exists public.conteudo_producao (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titulo text not null,
  descricao text,
  tipo text not null check (tipo in ('POST','STORY','REEL','VIDEO','ARTIGO','EMAIL')),
  plataforma text not null check (plataforma in ('INSTAGRAM','FACEBOOK','TIKTOK','YOUTUBE','LINKEDIN','EMAIL','BLOG')),
  status text not null check (status in ('IDEIA','EM_PRODUCAO','REVISAO','AGENDADO','PUBLICADO','ARQUIVADO')),
  data_agendamento timestamptz,
  data_publicacao timestamptz,
  campanha_id uuid, -- referência opcional para campanhas
  visualizacoes integer default 0,
  engajamento integer default 0,
  cliques integer default 0,
  tags text[],
  notas text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_conteudo_user on public.conteudo_producao(user_id);
create index if not exists idx_conteudo_status on public.conteudo_producao(status);
create index if not exists idx_conteudo_plataforma on public.conteudo_producao(plataforma);
create index if not exists idx_conteudo_agendamento on public.conteudo_producao(data_agendamento);

alter table public.conteudo_producao enable row level security;

create policy conteudo_select on public.conteudo_producao for select using (user_id = auth.uid());
create policy conteudo_insert on public.conteudo_producao for insert with check (user_id = auth.uid());
create policy conteudo_update on public.conteudo_producao for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy conteudo_delete on public.conteudo_producao for delete using (user_id = auth.uid());

drop trigger if exists trg_conteudo_updated on public.conteudo_producao;
create trigger trg_conteudo_updated before update on public.conteudo_producao
for each row execute function public.set_updated_at();
