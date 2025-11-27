-- Add estagio_funil (funnel stage) column to campanhas table
-- This allows categorizing campaigns by their position in the marketing funnel

alter table public.campanhas 
  add column if not exists estagio_funil text 
  check (estagio_funil in ('TOPO', 'MEIO', 'FUNDO'));

-- Add index for better query performance
create index if not exists idx_campanhas_estagio_funil on public.campanhas(estagio_funil);
