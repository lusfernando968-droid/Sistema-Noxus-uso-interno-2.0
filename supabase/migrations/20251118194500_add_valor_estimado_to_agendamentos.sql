-- Adiciona coluna de valor estimado aos agendamentos
ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS valor_estimado NUMERIC(10,2);

-- Atualiza cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';
