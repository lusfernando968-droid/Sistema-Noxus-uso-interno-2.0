-- Adicionar coluna banco_id à tabela contas_bancarias
ALTER TABLE public.contas_bancarias 
ADD COLUMN banco_id UUID REFERENCES public.bancos(id);

-- Criar índice para performance
CREATE INDEX idx_contas_bancarias_banco_id ON public.contas_bancarias(banco_id);

-- Migration para migrar dados existentes (caso haja)
-- Atualizar banco_id baseado no campo banco (texto) existente
UPDATE public.contas_bancarias 
SET banco_id = (
    SELECT id FROM public.bancos 
    WHERE nome_curto = contas_bancarias.banco 
    LIMIT 1
)
WHERE banco IS NOT NULL AND banco_id IS NULL;

-- Adicionar constraint para garantir que uma conta tenha um banco válido
-- (Descomente se quiser tornar obrigatório)
-- ALTER TABLE public.contas_bancarias 
-- ALTER COLUMN banco_id SET NOT NULL;

-- Criar view para facilitar consultas com informações completas do banco
CREATE OR REPLACE VIEW public.contas_bancarias_completas AS
SELECT 
    cb.*,
    b.codigo as banco_codigo,
    b.nome as banco_nome_completo,
    b.nome_curto as banco_nome_curto,
    b.cor_primaria as banco_cor_primaria,
    b.cor_secundaria as banco_cor_secundaria,
    b.logo_url as banco_logo_url,
    b.site_url as banco_site_url
FROM public.contas_bancarias cb
LEFT JOIN public.bancos b ON cb.banco_id = b.id;

-- Grant permissions
GRANT SELECT ON public.contas_bancarias_completas TO anon, authenticated;