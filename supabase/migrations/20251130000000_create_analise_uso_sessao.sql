-- Create analise_uso_sessao table
create table if not exists public.analise_uso_sessao (
  id uuid not null default gen_random_uuid(),
  analise_id uuid not null references public.analise_custo(id) on delete cascade,
  agendamento_id uuid not null references public.agendamentos(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  constraint analise_uso_sessao_pkey primary key (id)
);

-- Enable RLS
alter table public.analise_uso_sessao enable row level security;

-- Create policies
create policy "Users can view their own usage records" on public.analise_uso_sessao for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert their own usage records" on public.analise_uso_sessao for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can delete their own usage records" on public.analise_uso_sessao for delete to authenticated using (auth.uid() = user_id);
