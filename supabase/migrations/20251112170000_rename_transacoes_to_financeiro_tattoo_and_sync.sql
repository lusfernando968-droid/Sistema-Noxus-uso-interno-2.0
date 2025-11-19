-- Renomear tabela transacoes para financeiro_tattoo
ALTER TABLE public.transacoes RENAME TO financeiro_tattoo;

-- Renomear trigger de updated_at para refletir novo nome
ALTER TRIGGER update_transacoes_updated_at ON public.financeiro_tattoo RENAME TO update_financeiro_tattoo_updated_at;

-- Renomear índices para clareza
ALTER INDEX IF EXISTS idx_transacoes_user_id RENAME TO idx_financeiro_tattoo_user_id;
ALTER INDEX IF EXISTS idx_transacoes_agendamento_id RENAME TO idx_financeiro_tattoo_agendamento_id;
ALTER INDEX IF EXISTS idx_transacoes_data_vencimento RENAME TO idx_financeiro_tattoo_data_vencimento;
ALTER INDEX IF EXISTS idx_transacoes_conta_id RENAME TO idx_financeiro_tattoo_conta_id;

-- Adicionar colunas de origem e setor em financeiro_geral para espelhamento
ALTER TABLE public.financeiro_geral
  ADD COLUMN IF NOT EXISTS origem TEXT,
  ADD COLUMN IF NOT EXISTS origem_id UUID,
  ADD COLUMN IF NOT EXISTS setor TEXT;

-- Índice único parcial para manter 1:1 entre origem e origem_id
CREATE UNIQUE INDEX IF NOT EXISTS ux_financeiro_geral_origem_origem_id
ON public.financeiro_geral (origem, origem_id)
WHERE origem IS NOT NULL AND origem_id IS NOT NULL;

-- Função de sincronização de financeiro_tattoo -> financeiro_geral
CREATE OR REPLACE FUNCTION public.sync_financeiro_tattoo_to_geral()
RETURNS TRIGGER AS $$
DECLARE
  v_tipo TEXT;
  v_data TIMESTAMPTZ;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    v_tipo := CASE NEW.tipo WHEN 'RECEITA' THEN 'entrada' ELSE 'saida' END;
    v_data := COALESCE(NEW.data_liquidacao::timestamptz, NEW.data_vencimento::timestamptz);
    INSERT INTO public.financeiro_geral (
      user_id, data, descricao, valor, categoria, forma_pagamento, tipo,
      comprovante, observacoes, origem, origem_id, setor
    ) VALUES (
      NEW.user_id, v_data, NEW.descricao, NEW.valor, NEW.categoria, 'indefinido', v_tipo,
      NULL, NULL, 'financeiro_tattoo', NEW.id, 'Tattoo'
    )
    ON CONFLICT (origem, origem_id) WHERE origem IS NOT NULL AND origem_id IS NOT NULL DO UPDATE SET
      user_id = EXCLUDED.user_id,
      data = EXCLUDED.data,
      descricao = EXCLUDED.descricao,
      valor = EXCLUDED.valor,
      categoria = EXCLUDED.categoria,
      forma_pagamento = EXCLUDED.forma_pagamento,
      tipo = EXCLUDED.tipo,
      updated_at = now();
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    v_tipo := CASE NEW.tipo WHEN 'RECEITA' THEN 'entrada' ELSE 'saida' END;
    v_data := COALESCE(NEW.data_liquidacao::timestamptz, NEW.data_vencimento::timestamptz);
    UPDATE public.financeiro_geral SET
      user_id = NEW.user_id,
      data = v_data,
      descricao = NEW.descricao,
      valor = NEW.valor,
      categoria = NEW.categoria,
      forma_pagamento = COALESCE(forma_pagamento, 'indefinido'),
      tipo = v_tipo,
      updated_at = now()
    WHERE origem = 'financeiro_tattoo' AND origem_id = NEW.id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    DELETE FROM public.financeiro_geral
    WHERE origem = 'financeiro_tattoo' AND origem_id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger que chama a função em INSERT/UPDATE/DELETE
DROP TRIGGER IF EXISTS trg_sync_financeiro_tattoo_to_geral ON public.financeiro_tattoo;
CREATE TRIGGER trg_sync_financeiro_tattoo_to_geral
AFTER INSERT OR UPDATE OR DELETE ON public.financeiro_tattoo
FOR EACH ROW EXECUTE FUNCTION public.sync_financeiro_tattoo_to_geral();

