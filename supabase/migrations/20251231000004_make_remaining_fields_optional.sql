-- Tornar campos restantes opcionais
-- Data: 2025-12-31

ALTER TABLE public.orcamentos 
ALTER COLUMN tempo_estimado DROP NOT NULL;

ALTER TABLE public.orcamentos 
ALTER COLUMN valor_estimado DROP NOT NULL;

ALTER TABLE public.orcamentos 
ALTER COLUMN locais DROP NOT NULL;

-- Comentário: Torna campos opcionais para permitir criação flexível de orçamentos
