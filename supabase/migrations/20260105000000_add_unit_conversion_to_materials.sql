-- Adicionar campos de conversão de unidades à tabela estoque_materiais
-- Permite comprar em embalagens (ex: caixas) e controlar em unidades base (ex: luvas)

ALTER TABLE public.estoque_materiais
ADD COLUMN IF NOT EXISTS unidade_embalagem text,
ADD COLUMN IF NOT EXISTS fator_conversao numeric(12,2),
ADD COLUMN IF NOT EXISTS quantidade_embalagens numeric(12,2);

COMMENT ON COLUMN public.estoque_materiais.unidade_embalagem IS 'Nome da embalagem (ex: Caixa, Pacote, Rolo)';
COMMENT ON COLUMN public.estoque_materiais.fator_conversao IS 'Quantas unidades base por embalagem (ex: 100 luvas por caixa)';
COMMENT ON COLUMN public.estoque_materiais.quantidade_embalagens IS 'Quantidade de embalagens compradas (ex: 5 caixas)';
