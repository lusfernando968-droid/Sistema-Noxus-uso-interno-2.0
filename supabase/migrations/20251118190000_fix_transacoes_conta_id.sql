-- Garantir coluna conta_id em public.transacoes
ALTER TABLE public.transacoes ADD COLUMN IF NOT EXISTS conta_id UUID;

-- Garantir foreign key para contas_bancarias
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_transacoes_conta'
  ) THEN
    ALTER TABLE public.transacoes
      ADD CONSTRAINT fk_transacoes_conta
      FOREIGN KEY (conta_id)
      REFERENCES public.contas_bancarias(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Índice para acelerar consultas por conta
CREATE INDEX IF NOT EXISTS idx_transacoes_conta_id ON public.transacoes(conta_id);

-- Recarregar cache de schema do PostgREST
NOTIFY pgrst, 'reload schema';
