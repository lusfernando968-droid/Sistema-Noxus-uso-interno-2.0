-- Create assistants table
CREATE TABLE IF NOT EXISTS public.assistants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assistant_email TEXT NOT NULL,
    assistant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, assistant_email)
);

-- Enable RLS
ALTER TABLE public.assistants ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is an assistant
CREATE OR REPLACE FUNCTION public.is_assistant_of(admin_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.assistants 
    WHERE assistant_id = auth.uid() 
    AND user_id = admin_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for assistants table
CREATE POLICY "Admins can view their assistants"
ON public.assistants FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert their assistants"
ON public.assistants FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can delete their assistants"
ON public.assistants FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Assistants can view their relationship"
ON public.assistants FOR SELECT
TO authenticated
USING (assistant_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Add 'assistant' to app_role enum if not exists
-- Note: Modifying enum in migration can be tricky if it's already used. 
-- We'll try to add it safely.
DO $$
BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'assistant';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Policies for accessing data (Clientes, Projetos, Agendamentos)

-- Clientes
CREATE POLICY "Assistants can view admin's clients"
ON public.clientes FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assistants
        WHERE assistant_id = auth.uid()
        AND user_id = public.clientes.user_id
    )
);

-- Projetos
CREATE POLICY "Assistants can view admin's projects"
ON public.projetos FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assistants
        WHERE assistant_id = auth.uid()
        AND user_id = public.projetos.user_id
    )
);

-- Agendamentos
CREATE POLICY "Assistants can view admin's appointments"
ON public.agendamentos FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.assistants
        WHERE assistant_id = auth.uid()
        AND user_id = public.agendamentos.user_id
    )
);

-- Grant permissions needed
GRANT ALL ON public.assistants TO authenticated;
GRANT ALL ON public.assistants TO service_role;
