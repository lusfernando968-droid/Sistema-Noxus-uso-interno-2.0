-- Adicionar coluna indicado_por na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN indicado_por UUID REFERENCES public.clientes(id) ON DELETE SET NULL;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN public.clientes.indicado_por IS 'ID do cliente que indicou este cliente (referência para rede de indicações)';

-- Criar índice para melhorar performance das consultas de indicação
CREATE INDEX idx_clientes_indicado_por ON public.clientes(indicado_por);

-- Atualizar a função updated_at se existir
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Garantir que o trigger de updated_at existe para clientes
DROP TRIGGER IF EXISTS handle_clientes_updated_at ON public.clientes;
CREATE TRIGGER handle_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();