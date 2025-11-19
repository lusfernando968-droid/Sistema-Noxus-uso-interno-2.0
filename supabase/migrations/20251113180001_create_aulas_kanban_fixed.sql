-- Tabelas para gestão de aulas, modelos e versões
-- Ambiente: Supabase Postgres

create table if not exists public.aula_modelos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titulo text not null,
  disciplina text,
  descricao text,
  estrutura_base jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.aulas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  titulo text not null,
  descricao text,
  status text not null check (status in ('esboco','desenvolvimento','revisao','finalizacao','pronta')),
  disciplina text,
  responsavel_id uuid references public.profiles(id) on delete set null,
  prazo date,
  modelo_id uuid references public.aula_modelos(id) on delete set null,
  estrutura jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_aulas_status on public.aulas(status);
create index if not exists idx_aulas_responsavel on public.aulas(responsavel_id);
create index if not exists idx_aulas_prazo on public.aulas(prazo);

create table if not exists public.aula_versions (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references public.aulas(id) on delete cascade,
  user_id uuid not null,
  version_number integer not null,
  snapshot jsonb not null,
  diff jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_aula_versions_aula on public.aula_versions(aula_id);

alter table public.aula_modelos enable row level security;
alter table public.aulas enable row level security;
alter table public.aula_versions enable row level security;

-- Policies: cada usuário só vê e altera seus próprios registros
create policy aula_modelos_select on public.aula_modelos for select using (user_id = auth.uid());
create policy aula_modelos_insert on public.aula_modelos for insert with check (user_id = auth.uid());
create policy aula_modelos_update on public.aula_modelos for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy aulas_select on public.aulas for select using (user_id = auth.uid());
create policy aulas_insert on public.aulas for insert with check (user_id = auth.uid());
create policy aulas_update on public.aulas for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy aula_versions_select on public.aula_versions for select using (user_id = auth.uid());
create policy aula_versions_insert on public.aula_versions for insert with check (user_id = auth.uid());

-- Trigger para atualizar updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end$$;

drop trigger if exists trg_aula_modelos_updated on public.aula_modelos;
create trigger trg_aula_modelos_updated before update on public.aula_modelos
for each row execute function public.set_updated_at();

drop trigger if exists trg_aulas_updated on public.aulas;
create trigger trg_aulas_updated before update on public.aulas
for each row execute function public.set_updated_at();