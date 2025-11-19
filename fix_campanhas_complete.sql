-- Script completo para corrigir a tabela campanhas
-- Execute TODO este script de uma vez no Supabase SQL Editor

-- Passo 1: Remover políticas existentes (se existirem)
drop policy if exists "Usuários podem ver suas próprias campanhas" on public.campanhas;
drop policy if exists "Usuários podem criar suas próprias campanhas" on public.campanhas;
drop policy if exists "Usuários podem atualizar suas próprias campanhas" on public.campanhas;
drop policy if exists "Usuários podem deletar suas próprias campanhas" on public.campanhas;

-- Passo 2: Criar a tabela se não existir
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

-- Passo 3: Criar índice
create index if not exists idx_campanhas_user_id on public.campanhas(user_id);

-- Passo 4: Habilitar RLS
alter table public.campanhas enable row level security;

-- Passo 5: Criar políticas de acesso
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

-- Passo 6: Criar função para updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Passo 7: Criar trigger
drop trigger if exists set_updated_at on public.campanhas;
create trigger set_updated_at
  before update on public.campanhas
  for each row
  execute function public.handle_updated_at();
