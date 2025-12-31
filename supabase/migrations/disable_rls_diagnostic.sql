-- DIAGNOSTIC: DISABLE RLS
-- Run this to check if data exists but is hidden by policies.

ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_cidades DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_referencias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_anexos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_sessoes DISABLE ROW LEVEL SECURITY;

-- Returns a count of clients to verify data presence in SQL Editor
SELECT count(*) as total_clientes FROM public.clientes;
