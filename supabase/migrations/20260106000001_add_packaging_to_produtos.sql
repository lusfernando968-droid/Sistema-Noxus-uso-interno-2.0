-- Add packaging fields to produtos table
ALTER TABLE produtos
ADD COLUMN IF NOT EXISTS unidade_embalagem TEXT,
ADD COLUMN IF NOT EXISTS fator_conversao NUMERIC(12,2);

-- Add comment to columns
COMMENT ON COLUMN produtos.unidade_embalagem IS 'Tipo de embalagem do produto (Caixa, Frasco, Tubo, etc)';
COMMENT ON COLUMN produtos.fator_conversao IS 'Capacidade ou quantidade por embalagem (ex: 240 para 240mL)';
