-- ============================================
-- SISTEMA DE RASTREAMENTO DE ATIVIDADES DE ASSISTENTES
-- ============================================
-- Este script cria toda a infraestrutura necessária para rastrear
-- atividades de assistentes no sistema Noxus.
-- 
-- Execute este script completo no SQL Editor do Supabase.
-- ============================================

-- 1. CRIAR TABELA DE LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.assistant_activity_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assistant_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type text NOT NULL CHECK (action_type IN (
        'PAGE_VIEW',
        'CREATE_CLIENT',
        'CREATE_PROJECT',
        'CREATE_APPOINTMENT',
        'CREATE_BUDGET'
    )),
    entity_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Adicionar comentários para documentação
COMMENT ON TABLE public.assistant_activity_logs IS 'Registra todas as atividades realizadas por assistentes';
COMMENT ON COLUMN public.assistant_activity_logs.assistant_id IS 'ID do usuário assistente que realizou a ação';
COMMENT ON COLUMN public.assistant_activity_logs.admin_id IS 'ID do administrador dono do assistente';
COMMENT ON COLUMN public.assistant_activity_logs.action_type IS 'Tipo de ação: PAGE_VIEW, CREATE_CLIENT, CREATE_PROJECT, CREATE_APPOINTMENT, CREATE_BUDGET';
COMMENT ON COLUMN public.assistant_activity_logs.entity_id IS 'ID da entidade criada (cliente, projeto, etc)';
COMMENT ON COLUMN public.assistant_activity_logs.details IS 'Detalhes adicionais em formato JSON';

-- 2. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.assistant_activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. REMOVER POLÍTICAS ANTIGAS (SE EXISTIREM)
-- ============================================
DROP POLICY IF EXISTS "Admins podem ver logs de seus assistentes" ON public.assistant_activity_logs;
DROP POLICY IF EXISTS "Assistentes podem inserir seus próprios logs" ON public.assistant_activity_logs;
DROP POLICY IF EXISTS "Admins can view their assistants logs" ON public.assistant_activity_logs;
DROP POLICY IF EXISTS "Assistants can insert their own logs" ON public.assistant_activity_logs;
DROP POLICY IF EXISTS "Admins can view all logs debug" ON public.assistant_activity_logs;
DROP POLICY IF EXISTS "Allow inserts debug" ON public.assistant_activity_logs;

-- 4. CRIAR POLÍTICAS DE SEGURANÇA (RLS)
-- ============================================

-- Política para VISUALIZAÇÃO: Admins podem ver logs de seus assistentes
CREATE POLICY "Admins podem ver logs de seus assistentes"
ON public.assistant_activity_logs
FOR SELECT
TO authenticated
USING (
    -- O usuário logado é o admin dono do assistente
    auth.uid() = admin_id
);

-- Política para INSERÇÃO: Assistentes podem inserir seus próprios logs
CREATE POLICY "Assistentes podem inserir seus próprios logs"
ON public.assistant_activity_logs
FOR INSERT
TO authenticated
WITH CHECK (
    -- O usuário logado é o assistente que está criando o log
    auth.uid() = assistant_id
);

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_assistant_activity_logs_assistant_id 
ON public.assistant_activity_logs(assistant_id);

CREATE INDEX IF NOT EXISTS idx_assistant_activity_logs_admin_id 
ON public.assistant_activity_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_assistant_activity_logs_created_at 
ON public.assistant_activity_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assistant_activity_logs_action_type 
ON public.assistant_activity_logs(action_type);

CREATE INDEX IF NOT EXISTS idx_assistant_activity_logs_entity_id 
ON public.assistant_activity_logs(entity_id) WHERE entity_id IS NOT NULL;

-- 6. GARANTIR PERMISSÕES
-- ============================================
GRANT SELECT, INSERT ON public.assistant_activity_logs TO authenticated;

-- 7. CRIAR FUNÇÃO PARA RASTREAMENTO AUTOMÁTICO
-- ============================================
-- Esta função será chamada por triggers quando assistentes criarem entidades

CREATE OR REPLACE FUNCTION public.log_assistant_activity()
RETURNS trigger AS $$
DECLARE
    v_admin_id uuid;
    v_user_email text;
    v_action_type text;
BEGIN
    -- Determinar o tipo de ação baseado no argumento do trigger
    v_action_type := TG_ARGV[0];
    
    -- Verificar se o usuário atual é um assistente
    SELECT user_id INTO v_admin_id
    FROM public.assistants
    WHERE assistant_id = auth.uid()
    LIMIT 1;

    -- Se não encontrou por ID, tentar por email (fallback)
    IF v_admin_id IS NULL THEN
        SELECT email INTO v_user_email 
        FROM auth.users 
        WHERE id = auth.uid();
        
        IF v_user_email IS NOT NULL THEN
            SELECT user_id INTO v_admin_id
            FROM public.assistants
            WHERE assistant_email = v_user_email
            LIMIT 1;
        END IF;
    END IF;

    -- Se é um assistente, registrar a atividade
    IF v_admin_id IS NOT NULL THEN
        INSERT INTO public.assistant_activity_logs (
            assistant_id,
            admin_id,
            action_type,
            entity_id,
            details
        ) VALUES (
            auth.uid(),
            v_admin_id,
            v_action_type,
            NEW.id,
            jsonb_build_object(
                'table', TG_TABLE_NAME,
                'operation', TG_OP
            )
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, não bloquear a operação principal
        RAISE WARNING 'Erro ao registrar atividade do assistente: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CRIAR TRIGGERS PARA RASTREAMENTO AUTOMÁTICO
-- ============================================

-- Trigger para criação de CLIENTES
DROP TRIGGER IF EXISTS log_assistant_client_creation ON public.clientes;
CREATE TRIGGER log_assistant_client_creation
    AFTER INSERT ON public.clientes
    FOR EACH ROW
    EXECUTE FUNCTION public.log_assistant_activity('CREATE_CLIENT');

-- Trigger para criação de PROJETOS
DROP TRIGGER IF EXISTS log_assistant_project_creation ON public.projetos;
CREATE TRIGGER log_assistant_project_creation
    AFTER INSERT ON public.projetos
    FOR EACH ROW
    EXECUTE FUNCTION public.log_assistant_activity('CREATE_PROJECT');

-- Trigger para criação de AGENDAMENTOS
DROP TRIGGER IF EXISTS log_assistant_appointment_creation ON public.agendamentos;
CREATE TRIGGER log_assistant_appointment_creation
    AFTER INSERT ON public.agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.log_assistant_activity('CREATE_APPOINTMENT');

-- Trigger para criação de ORÇAMENTOS
DROP TRIGGER IF EXISTS log_assistant_budget_creation ON public.orcamentos;
CREATE TRIGGER log_assistant_budget_creation
    AFTER INSERT ON public.orcamentos
    FOR EACH ROW
    EXECUTE FUNCTION public.log_assistant_activity('CREATE_BUDGET');

-- ============================================
-- FIM DO SCRIPT
-- ============================================

-- Verificar se tudo foi criado corretamente
DO $$
BEGIN
    RAISE NOTICE '✓ Tabela assistant_activity_logs criada';
    RAISE NOTICE '✓ Políticas RLS configuradas';
    RAISE NOTICE '✓ Índices criados para performance';
    RAISE NOTICE '✓ Função de rastreamento criada';
    RAISE NOTICE '✓ Triggers automáticos configurados';
    RAISE NOTICE '';
    RAISE NOTICE 'Sistema de rastreamento de assistentes instalado com sucesso!';
END $$;
