-- Corrigir políticas RLS para permitir criação de orçamentos
-- Data: 2025-12-31

-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can view their own orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Users can create their own orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Users can update their own orcamentos" ON public.orcamentos;
DROP POLICY IF EXISTS "Users can delete their own orcamentos" ON public.orcamentos;

-- Criar políticas atualizadas
CREATE POLICY "Users can view their own orcamentos" 
ON public.orcamentos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orcamentos" 
ON public.orcamentos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orcamentos" 
ON public.orcamentos
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orcamentos" 
ON public.orcamentos
FOR DELETE
USING (auth.uid() = user_id);

-- Garantir que a coluna user_id tem valor padrão
ALTER TABLE public.orcamentos 
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Comentário: Esta migration corrige as políticas RLS para permitir
-- que usuários autenticados criem e gerenciem seus próprios orçamentos
