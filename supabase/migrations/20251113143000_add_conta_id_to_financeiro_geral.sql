-- Adicionar vínculo opcional de conta bancária ao financeiro geral
ALTER TABLE public.financeiro_geral ADD COLUMN IF NOT EXISTS conta_id UUID;

ALTER TABLE public.financeiro_geral
  ADD CONSTRAINT fk_financeiro_geral_conta
  FOREIGN KEY (conta_id)
  REFERENCES public.contas_bancarias(id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_financeiro_geral_conta_id ON public.financeiro_geral(conta_id);

