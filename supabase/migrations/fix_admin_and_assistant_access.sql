-- UNIFIED ACCESS FIX
-- This script ensures BOTH Admins (Owners) and Assistants have correct access.

-- 1. Enable RLS
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

-- 2. ASSISTANTS TABLE CONFIGURATION
-- Allow assistants to view their own link
DROP POLICY IF EXISTS "Assistants can view own relationship" ON public.assistants;
CREATE POLICY "Assistants can view own relationship"
ON public.assistants FOR SELECT TO authenticated
USING (assistant_id = auth.uid());

-- Allow assistants to update their own link (e.g. accepting invite)
DROP POLICY IF EXISTS "Assistants can update own relationship" ON public.assistants;
CREATE POLICY "Assistants can update own relationship"
ON public.assistants FOR UPDATE TO authenticated
USING (assistant_id = auth.uid());

-- Allow owners (Admins) to manage all their assistants
DROP POLICY IF EXISTS "Admins can manage their assistants" ON public.assistants;
CREATE POLICY "Admins can manage their assistants"
ON public.assistants FOR ALL TO authenticated
USING (user_id = auth.uid());

-- Allow linking by email (special case for onboarding)
DROP POLICY IF EXISTS "Assistants can link account by email" ON public.assistants;
CREATE POLICY "Assistants can link account by email"
ON public.assistants FOR UPDATE TO authenticated
USING (true)
WITH CHECK (assistant_email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS "Assistants can view account by email" ON public.assistants;
CREATE POLICY "Assistants can view account by email"
ON public.assistants FOR SELECT TO authenticated
USING (assistant_email = auth.jwt() ->> 'email');


-- 3. DATA TABLES (CLIENTES, PROJETOS, ETC)

-- MACRO: We want two main policies per table:
-- A) Owner Access: auth.uid() = user_id
-- B) Assistant Access: exists (select 1 from assistants where assistant_id = auth.uid() and user_id = table.user_id)

-- === CLIENTES ===
DROP POLICY IF EXISTS "Users can view own clients" ON public.clientes;
DROP POLICY IF EXISTS "Assistants can view admin clients" ON public.clientes;
-- Unified SELECT
CREATE POLICY "Unified view clients" ON public.clientes FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.clientes.user_id)
);

DROP POLICY IF EXISTS "Users can insert own clients" ON public.clientes;
DROP POLICY IF EXISTS "Assistants can insert admin clients" ON public.clientes;
-- Unified INSERT
CREATE POLICY "Unified insert clients" ON public.clientes FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.clientes.user_id)
);

DROP POLICY IF EXISTS "Users can update own clients" ON public.clientes;
DROP POLICY IF EXISTS "Assistants can update admin clients" ON public.clientes;
-- Unified UPDATE
CREATE POLICY "Unified update clients" ON public.clientes FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.clientes.user_id)
);

DROP POLICY IF EXISTS "Users can delete own clients" ON public.clientes;
DROP POLICY IF EXISTS "Assistants can delete admin clients" ON public.clientes;
-- Unified DELETE
CREATE POLICY "Unified delete clients" ON public.clientes FOR DELETE TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.clientes.user_id)
);


-- === PROJETOS ===
DROP POLICY IF EXISTS "Users can view own projects" ON public.projetos;
DROP POLICY IF EXISTS "Assistants can view admin projects" ON public.projetos;
CREATE POLICY "Unified view projects" ON public.projetos FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projetos.user_id)
);

DROP POLICY IF EXISTS "Users can insert own projects" ON public.projetos;
DROP POLICY IF EXISTS "Assistants can insert admin projects" ON public.projetos;
CREATE POLICY "Unified insert projects" ON public.projetos FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projetos.user_id)
);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projetos;
DROP POLICY IF EXISTS "Assistants can update admin projects" ON public.projetos;
CREATE POLICY "Unified update projects" ON public.projetos FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projetos.user_id)
);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projetos;
DROP POLICY IF EXISTS "Assistants can delete admin projects" ON public.projetos;
CREATE POLICY "Unified delete projects" ON public.projetos FOR DELETE TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projetos.user_id)
);


-- === AGENDAMENTOS ===
DROP POLICY IF EXISTS "Users can view own appointments" ON public.agendamentos;
DROP POLICY IF EXISTS "Assistants can view admin appointments" ON public.agendamentos;
CREATE POLICY "Unified view appointments" ON public.agendamentos FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.agendamentos.user_id)
);

DROP POLICY IF EXISTS "Users can insert own appointments" ON public.agendamentos;
DROP POLICY IF EXISTS "Assistants can insert admin appointments" ON public.agendamentos;
CREATE POLICY "Unified insert appointments" ON public.agendamentos FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.agendamentos.user_id)
);

DROP POLICY IF EXISTS "Users can update own appointments" ON public.agendamentos;
DROP POLICY IF EXISTS "Assistants can update admin appointments" ON public.agendamentos;
CREATE POLICY "Unified update appointments" ON public.agendamentos FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.agendamentos.user_id)
);

DROP POLICY IF EXISTS "Users can delete own appointments" ON public.agendamentos;
DROP POLICY IF EXISTS "Assistants can delete admin appointments" ON public.agendamentos;
CREATE POLICY "Unified delete appointments" ON public.agendamentos FOR DELETE TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.agendamentos.user_id)
);


-- === CIDADES (Usually shared/auxiliary, but managed by user) ===
DROP POLICY IF EXISTS "Unified access cities" ON public.cidades;
-- Clean up old specific policies
DROP POLICY IF EXISTS "Users can view own cities" ON public.cidades;
DROP POLICY IF EXISTS "Assistants can view admin cities" ON public.cidades;
DROP POLICY IF EXISTS "Users can insert own cities" ON public.cidades;
DROP POLICY IF EXISTS "Assistants can insert admin cities" ON public.cidades;

CREATE POLICY "Unified access cities" ON public.cidades FOR ALL TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.cidades.user_id)
)
WITH CHECK (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.cidades.user_id)
);


-- === CLIENTES_CIDADES ===
DROP POLICY IF EXISTS "Unified access client cities" ON public.clientes_cidades;
-- Clean up
DROP POLICY IF EXISTS "Assistants can view admin client cities" ON public.clientes_cidades;
DROP POLICY IF EXISTS "Assistants can insert admin client cities" ON public.clientes_cidades;

CREATE POLICY "Unified access client cities" ON public.clientes_cidades FOR ALL TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.clientes_cidades.user_id)
)
WITH CHECK (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.clientes_cidades.user_id)
);


-- === REFS, ANEXOS, SESSOES (Allow ALL access if owner or assistant) ===
-- Helper macro logic for all
DROP POLICY IF EXISTS "Unified access project refs" ON public.projeto_referencias;
DROP POLICY IF EXISTS "Assistants can manage admin project refs" ON public.projeto_referencias;
-- Need to drop specific old policies if they exist, but easier to just create unified.

CREATE POLICY "Unified access project refs" ON public.projeto_referencias FOR ALL TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projeto_referencias.user_id)
)
WITH CHECK (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projeto_referencias.user_id)
);

DROP POLICY IF EXISTS "Unified access project attachments" ON public.projeto_anexos;
DROP POLICY IF EXISTS "Assistants can manage admin project attachments" ON public.projeto_anexos;

CREATE POLICY "Unified access project attachments" ON public.projeto_anexos FOR ALL TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projeto_anexos.user_id)
)
WITH CHECK (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projeto_anexos.user_id)
);

DROP POLICY IF EXISTS "Unified access project sessions" ON public.projeto_sessoes;
DROP POLICY IF EXISTS "Assistants can manage admin project sessions" ON public.projeto_sessoes;

CREATE POLICY "Unified access project sessions" ON public.projeto_sessoes FOR ALL TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projeto_sessoes.user_id)
)
WITH CHECK (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.projeto_sessoes.user_id)
);

-- === TRANSACOES ===
DROP POLICY IF EXISTS "Unified access transactions" ON public.transacoes;
DROP POLICY IF EXISTS "Assistants can insert admin transactions" ON public.transacoes;

CREATE POLICY "Unified access transactions" ON public.transacoes FOR ALL TO authenticated
USING (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.transacoes.user_id)
)
WITH CHECK (
  user_id = auth.uid() OR 
  exists (select 1 from public.assistants a where a.assistant_id = auth.uid() and a.user_id = public.transacoes.user_id)
);
