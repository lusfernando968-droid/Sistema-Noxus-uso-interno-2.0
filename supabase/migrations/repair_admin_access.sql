-- Permite que usuários vejam seus próprios registros (Admin/Dono)

-- CLIENTES
DROP POLICY IF EXISTS "Users can view own clients" ON public.clientes;
CREATE POLICY "Users can view own clients"
ON public.clientes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own clients" ON public.clientes;
CREATE POLICY "Users can update own clients"
ON public.clientes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own clients" ON public.clientes;
CREATE POLICY "Users can delete own clients"
ON public.clientes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own clients" ON public.clientes;
CREATE POLICY "Users can insert own clients"
ON public.clientes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


-- PROJETOS
ALTER TABLE public.projetos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own projects" ON public.projetos;
CREATE POLICY "Users can view own projects"
ON public.projetos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own projects" ON public.projetos;
CREATE POLICY "Users can update own projects"
ON public.projetos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projetos;
CREATE POLICY "Users can delete own projects"
ON public.projetos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own projects" ON public.projetos;
CREATE POLICY "Users can insert own projects"
ON public.projetos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);


-- AGENDAMENTOS
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own appointments" ON public.agendamentos;
CREATE POLICY "Users can view own appointments"
ON public.agendamentos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own appointments" ON public.agendamentos;
CREATE POLICY "Users can update own appointments"
ON public.agendamentos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own appointments" ON public.agendamentos;
CREATE POLICY "Users can delete own appointments"
ON public.agendamentos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own appointments" ON public.agendamentos;
CREATE POLICY "Users can insert own appointments"
ON public.agendamentos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
