-- Increase precision of custo_unitario column to allow for small unit costs (e.g. per mL)
ALTER TABLE estoque_materiais
ALTER COLUMN custo_unitario TYPE NUMERIC(20, 10);

-- Update comment
COMMENT ON COLUMN estoque_materiais.custo_unitario IS 'Custo por unidade do material (permite alta precisão para unidades pequenas)';
