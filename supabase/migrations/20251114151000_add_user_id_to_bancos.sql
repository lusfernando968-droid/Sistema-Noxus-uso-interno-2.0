alter table public.bancos add column if not exists user_id uuid;
create index if not exists idx_bancos_user_id on public.bancos(user_id);
