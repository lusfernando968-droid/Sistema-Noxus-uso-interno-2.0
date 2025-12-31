-- Enable RLS on all relevant tables
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes_cidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_referencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_anexos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_sessoes ENABLE ROW LEVEL SECURITY;

-- ADD MISSING COLUMNS (Fix for "column does not exist" error)
-- We need user_id on child tables to easily enforce RLS ownership
DO $$
BEGIN
    -- projeto_referencias
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projeto_referencias' AND column_name = 'user_id') THEN
        ALTER TABLE public.projeto_referencias ADD COLUMN user_id uuid REFERENCES auth.users(id);
    END IF;

    -- projeto_anexos
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projeto_anexos' AND column_name = 'user_id') THEN
        ALTER TABLE public.projeto_anexos ADD COLUMN user_id uuid REFERENCES auth.users(id);
    END IF;

    -- projeto_sessoes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projeto_sessoes' AND column_name = 'user_id') THEN
        ALTER TABLE public.projeto_sessoes ADD COLUMN user_id uuid REFERENCES auth.users(id);
    END IF;

    -- clientes_cidades
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clientes_cidades' AND column_name = 'user_id') THEN
        ALTER TABLE public.clientes_cidades ADD COLUMN user_id uuid REFERENCES auth.users(id);
    END IF;

    -- transacoes (check just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transacoes' AND column_name = 'user_id') THEN
        ALTER TABLE public.transacoes ADD COLUMN user_id uuid REFERENCES auth.users(id);
    END IF;
END $$;

-- BACKFILL user_id FOR EXISTING DATA
-- This ensures old data remains visible under the new RLS policies
UPDATE public.projeto_referencias pr SET user_id = p.user_id FROM public.projetos p WHERE pr.projeto_id = p.id AND pr.user_id IS NULL;
UPDATE public.projeto_anexos pa SET user_id = p.user_id FROM public.projetos p WHERE pa.projeto_id = p.id AND pa.user_id IS NULL;
UPDATE public.projeto_sessoes ps SET user_id = p.user_id FROM public.projetos p WHERE ps.projeto_id = p.id AND ps.user_id IS NULL;
UPDATE public.clientes_cidades cc SET user_id = c.user_id FROM public.clientes c WHERE cc.cliente_id = c.id AND cc.user_id IS NULL;
-- transacoes usually has user_id, but if linked to agendamento:
UPDATE public.transacoes t SET user_id = a.user_id FROM public.agendamentos a WHERE t.agendamento_id = a.id AND t.user_id IS NULL;


-- ASSISTANTS TABLE POLICIES
DROP POLICY IF EXISTS "Assistants can view own relationship" ON public.assistants;
CREATE POLICY "Assistants can view own relationship"
ON public.assistants FOR SELECT
TO authenticated
USING (assistant_id = auth.uid());

DROP POLICY IF EXISTS "Assistants can update own relationship" ON public.assistants;
CREATE POLICY "Assistants can update own relationship"
ON public.assistants FOR UPDATE
TO authenticated
USING (assistant_id = auth.uid());

DROP POLICY IF EXISTS "Assistants can link account by email" ON public.assistants;
CREATE POLICY "Assistants can link account by email"
ON public.assistants FOR UPDATE
TO authenticated
USING (true) -- Simplified for initial link, app logic handles the match
WITH CHECK (assistant_email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Assistants can view account by email" ON public.assistants;
CREATE POLICY "Assistants can view account by email"
ON public.assistants FOR SELECT
TO authenticated
USING (assistant_email = auth.jwt() ->> 'email');


-- MAIN DATA POLICIES (Allow assistants to act as their master)

-- 1. CLIENTES
DROP POLICY IF EXISTS "Assistants can view admin clients" ON public.clientes;
CREATE POLICY "Assistants can view admin clients" ON public.clientes FOR SELECT TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.clientes.user_id));

DROP POLICY IF EXISTS "Assistants can insert admin clients" ON public.clientes;
CREATE POLICY "Assistants can insert admin clients" ON public.clientes FOR INSERT TO authenticated
WITH CHECK (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.clientes.user_id));

DROP POLICY IF EXISTS "Assistants can update admin clients" ON public.clientes;
CREATE POLICY "Assistants can update admin clients" ON public.clientes FOR UPDATE TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.clientes.user_id));

DROP POLICY IF EXISTS "Assistants can delete admin clients" ON public.clientes;
CREATE POLICY "Assistants can delete admin clients" ON public.clientes FOR DELETE TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.clientes.user_id));

-- 2. PROJETOS
DROP POLICY IF EXISTS "Assistants can view admin projects" ON public.projetos;
CREATE POLICY "Assistants can view admin projects" ON public.projetos FOR SELECT TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projetos.user_id));

DROP POLICY IF EXISTS "Assistants can insert admin projects" ON public.projetos;
CREATE POLICY "Assistants can insert admin projects" ON public.projetos FOR INSERT TO authenticated
WITH CHECK (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projetos.user_id));

DROP POLICY IF EXISTS "Assistants can update admin projects" ON public.projetos;
CREATE POLICY "Assistants can update admin projects" ON public.projetos FOR UPDATE TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projetos.user_id));

DROP POLICY IF EXISTS "Assistants can delete admin projects" ON public.projetos;
CREATE POLICY "Assistants can delete admin projects" ON public.projetos FOR DELETE TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projetos.user_id));

-- 3. AGENDAMENTOS
DROP POLICY IF EXISTS "Assistants can view admin appointments" ON public.agendamentos;
CREATE POLICY "Assistants can view admin appointments" ON public.agendamentos FOR SELECT TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.agendamentos.user_id));

DROP POLICY IF EXISTS "Assistants can insert admin appointments" ON public.agendamentos;
CREATE POLICY "Assistants can insert admin appointments" ON public.agendamentos FOR INSERT TO authenticated
WITH CHECK (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.agendamentos.user_id));

DROP POLICY IF EXISTS "Assistants can update admin appointments" ON public.agendamentos;
CREATE POLICY "Assistants can update admin appointments" ON public.agendamentos FOR UPDATE TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.agendamentos.user_id));

DROP POLICY IF EXISTS "Assistants can delete admin appointments" ON public.agendamentos;
CREATE POLICY "Assistants can delete admin appointments" ON public.agendamentos FOR DELETE TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.agendamentos.user_id));

-- 4. CIDADES
DROP POLICY IF EXISTS "Assistants can view admin cities" ON public.cidades;
CREATE POLICY "Assistants can view admin cities" ON public.cidades FOR SELECT TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.cidades.user_id));

DROP POLICY IF EXISTS "Assistants can insert admin cities" ON public.cidades;
CREATE POLICY "Assistants can insert admin cities" ON public.cidades FOR INSERT TO authenticated
WITH CHECK (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.cidades.user_id));

-- 5. CLIENTES_CIDADES
-- Now that we have user_id, we can secure this properly
DROP POLICY IF EXISTS "Assistants can view admin client cities" ON public.clientes_cidades;
CREATE POLICY "Assistants can view admin client cities" ON public.clientes_cidades FOR SELECT TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.clientes_cidades.user_id));

DROP POLICY IF EXISTS "Assistants can insert admin client cities" ON public.clientes_cidades;
CREATE POLICY "Assistants can insert admin client cities" ON public.clientes_cidades FOR INSERT TO authenticated
WITH CHECK (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.clientes_cidades.user_id));

-- 6. TRANSACOES
DROP POLICY IF EXISTS "Assistants can insert admin transactions" ON public.transacoes;
CREATE POLICY "Assistants can insert admin transactions" ON public.transacoes FOR INSERT TO authenticated
WITH CHECK (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.transacoes.user_id));

-- 7. PROJETO_REF, ANEXOS, SESSOES
-- Now we have user_id on these tables too
DROP POLICY IF EXISTS "Assistants can manage admin project refs" ON public.projeto_referencias;
CREATE POLICY "Assistants can manage admin project refs" ON public.projeto_referencias FOR ALL TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projeto_referencias.user_id))
WITH CHECK (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projeto_referencias.user_id));

DROP POLICY IF EXISTS "Assistants can manage admin project attachments" ON public.projeto_anexos;
CREATE POLICY "Assistants can manage admin project attachments" ON public.projeto_anexos FOR ALL TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projeto_anexos.user_id))
WITH CHECK (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projeto_anexos.user_id));

DROP POLICY IF EXISTS "Assistants can manage admin project sessions" ON public.projeto_sessoes;
CREATE POLICY "Assistants can manage admin project sessions" ON public.projeto_sessoes FOR ALL TO authenticated
USING (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projeto_sessoes.user_id))
WITH CHECK (exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projeto_sessoes.user_id));
