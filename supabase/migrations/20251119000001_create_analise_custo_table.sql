-- Create analise_custo table
create table if not exists public.analise_custo (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  nome_produto text not null,
  custo_produto numeric not null,
  data_inicio timestamp with time zone not null default now(),
  data_fim timestamp with time zone,
  qtd_sessoes integer not null default 0,
  status text not null default 'ativo', -- 'ativo', 'concluido'
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint analise_custo_pkey primary key (id),
  constraint analise_custo_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- Enable RLS
alter table public.analise_custo enable row level security;

-- Create policies
create policy "Users can view their own analysis" on public.analise_custo for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own analysis" on public.analise_custo for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update their own analysis" on public.analise_custo for update to authenticated using (auth.uid() = user_id);
create policy "Users can delete their own analysis" on public.analise_custo for delete to authenticated using (auth.uid() = user_id);
