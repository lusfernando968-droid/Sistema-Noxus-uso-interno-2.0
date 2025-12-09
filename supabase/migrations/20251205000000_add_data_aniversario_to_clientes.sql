-- Add data_aniversario column to clientes table
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS data_aniversario DATE;

-- Add comment to explain the column
COMMENT ON COLUMN clientes.data_aniversario IS 'Data de aniversário do cliente';
