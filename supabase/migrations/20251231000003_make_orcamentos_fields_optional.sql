-- Tornar campos opcionais na tabela orcamentos
-- Data: 2025-12-31

-- Permitir NULL em campos que não são essenciais
ALTER TABLE public.orcamentos 
ALTER COLUMN cor DROP NOT NULL;

ALTER TABLE public.orcamentos 
ALTER COLUMN tamanho DROP NOT NULL;

ALTER TABLE public.orcamentos 
ALTER COLUMN estilo DROP NOT NULL;

-- Comentário: Esta migration torna campos opcionais para permitir
-- criação de orçamentos com informações parciais
