-- Adicionar campo tipo para diferenciar entradas e saídas
ALTER TABLE public.financeiro_geral 
ADD COLUMN tipo TEXT NOT NULL DEFAULT 'saida' CHECK (tipo IN ('entrada', 'saida'));

-- Atualizar índice para incluir tipo
CREATE INDEX idx_financeiro_geral_tipo ON public.financeiro_geral(tipo);
CREATE INDEX idx_financeiro_geral_user_tipo ON public.financeiro_geral(user_id, tipo);