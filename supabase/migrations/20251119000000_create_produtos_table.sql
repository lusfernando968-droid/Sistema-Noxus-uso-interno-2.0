create table public.produtos (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  nome text not null,
  marca text,
  tipo_material text not null,
  unidade text not null default 'un',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint produtos_pkey primary key (id),
  constraint produtos_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- RLS
alter table public.produtos enable row level security;

create policy "Users can view their own products"
on public.produtos for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own products"
on public.produtos for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own products"
on public.produtos for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can delete their own products"
on public.produtos for delete
to authenticated
using (auth.uid() = user_id);
