ALTER TABLE public.transacoes ADD COLUMN conta_id UUID;
ALTER TABLE public.transacoes
  ADD CONSTRAINT fk_transacoes_conta
  FOREIGN KEY (conta_id)
  REFERENCES public.contas_bancarias(id)
  ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_transacoes_conta_id ON public.transacoes(conta_id);
