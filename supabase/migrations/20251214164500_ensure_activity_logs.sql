-- Garantir que a tabela existe
CREATE TABLE IF NOT EXISTS public.assistant_activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assistant_id uuid NOT NULL REFERENCES auth.users(id),
    admin_id uuid NOT NULL REFERENCES auth.users(id),
    action_type text NOT NULL,
    entity_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.assistant_activity_logs ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins can view their assistants logs" ON public.assistant_activity_logs;
DROP POLICY IF EXISTS "Assistants can insert their own logs" ON public.assistant_activity_logs;
DROP POLICY IF EXISTS "Admins can view all logs debug" ON public.assistant_activity_logs;
DROP POLICY IF EXISTS "Allow inserts debug" ON public.assistant_activity_logs;

-- Criar políticas simples e funcionais
CREATE POLICY "Admins podem ver logs de seus assistentes"
ON public.assistant_activity_logs FOR SELECT
TO authenticated
USING (
    auth.uid() = admin_id
);

CREATE POLICY "Assistentes podem inserir seus próprios logs"
ON public.assistant_activity_logs FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = assistant_id
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_assistant_activity_logs_assistant_id 
ON public.assistant_activity_logs(assistant_id);

CREATE INDEX IF NOT EXISTS idx_assistant_activity_logs_admin_id 
ON public.assistant_activity_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_assistant_activity_logs_created_at 
ON public.assistant_activity_logs(created_at DESC);

-- Garantir permissões
GRANT SELECT, INSERT ON public.assistant_activity_logs TO authenticated;
