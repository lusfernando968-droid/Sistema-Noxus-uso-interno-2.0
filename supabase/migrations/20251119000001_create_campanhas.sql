-- Criar tabela campanhas para o módulo Marketing
create table if not exists public.campanhas (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  objetivo text,
  publico_alvo text,
  canal text not null check (canal in ('INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'GOOGLE_ADS', 'ORGANICO', 'EMAIL')),
  orcamento numeric,
  data_inicio date,
  data_fim date,
  status text not null default 'RASCUNHO' check (status in ('RASCUNHO', 'ATIVA', 'PAUSADA', 'ENCERRADA')),
  tags text[],
  notas text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar índice em user_id para otimizar queries
create index if not exists idx_campanhas_user_id on public.campanhas(user_id);

-- Habilitar Row Level Security (RLS)
alter table public.campanhas enable row level security;

-- Remover políticas existentes se já existirem (para permitir reexecução do script)
drop policy if exists "Usuários podem ver suas próprias campanhas" on public.campanhas;
drop policy if exists "Usuários podem criar suas próprias campanhas" on public.campanhas;
drop policy if exists "Usuários podem atualizar suas próprias campanhas" on public.campanhas;
drop policy if exists "Usuários podem deletar suas próprias campanhas" on public.campanhas;

-- Criar políticas de acesso (usuários autenticados podem gerenciar apenas suas próprias campanhas)
create policy "Usuários podem ver suas próprias campanhas"
  on public.campanhas
  for select
  using (auth.uid() = user_id);

create policy "Usuários podem criar suas próprias campanhas"
  on public.campanhas
  for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas próprias campanhas"
  on public.campanhas
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Usuários podem deletar suas próprias campanhas"
  on public.campanhas
  for delete
  using (auth.uid() = user_id);

-- Criar função para atualizar updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Criar trigger para atualizar updated_at
create trigger set_updated_at
  before update on public.campanhas
  for each row
  execute function public.handle_updated_at();
