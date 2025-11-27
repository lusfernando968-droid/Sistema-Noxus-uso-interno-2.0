-- Create marcas (brands) table for brand management
-- This allows creating brands with name, description and linking them to campaigns

create table if not exists public.marcas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  descricao text,
  descricao_produto text, -- description of the product/service
  campanha_id uuid references public.campanhas(id) on delete set null, -- link to campaign
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create indexes for better query performance
create index if not exists idx_marcas_user_id on public.marcas(user_id);
create index if not exists idx_marcas_campanha_id on public.marcas(campanha_id);

-- Enable Row Level Security
alter table public.marcas enable row level security;

-- Create RLS policies
create policy marcas_select on public.marcas for select using (user_id = auth.uid());
create policy marcas_insert on public.marcas for insert with check (user_id = auth.uid());
create policy marcas_update on public.marcas for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy marcas_delete on public.marcas for delete using (user_id = auth.uid());

-- Create trigger for updated_at
drop trigger if exists trg_marcas_updated on public.marcas;
create trigger trg_marcas_updated before update on public.marcas
for each row execute function public.set_updated_at();
