-- Tabelas de Patrimônio
CREATE TABLE public.patrimonio_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT,
  data_aquisicao DATE NOT NULL,
  custo_inicial DECIMAL(12,2) NOT NULL CHECK (custo_inicial >= 0),
  valor_residual DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (valor_residual >= 0),
  metodo_depreciacao TEXT NOT NULL DEFAULT 'linha_reta',
  vida_util_meses INTEGER NOT NULL DEFAULT 36 CHECK (vida_util_meses > 0),
  taxa_declinante_anual DECIMAL(6,2),
  localizacao TEXT,
  condicao TEXT NOT NULL DEFAULT 'bom',
  serial_nota TEXT,
  garantia_fim DATE,
  rendimento_mensal_estimado DECIMAL(12,2),
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'ativo',
  valor_atual_cache DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.patrimonio_movimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id UUID NOT NULL REFERENCES public.patrimonio_itens(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada','saida')),
  valor DECIMAL(12,2) NOT NULL CHECK (valor >= 0),
  data DATE NOT NULL,
  descricao TEXT,
  categoria TEXT,
  comprovante_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.patrimonio_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrimonio_movimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê seus itens" ON public.patrimonio_itens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuário insere itens" ON public.patrimonio_itens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza itens" ON public.patrimonio_itens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta itens" ON public.patrimonio_itens FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Usuário vê seus movimentos" ON public.patrimonio_movimentos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuário insere movimentos" ON public.patrimonio_movimentos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuário atualiza movimentos" ON public.patrimonio_movimentos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuário deleta movimentos" ON public.patrimonio_movimentos FOR DELETE USING (auth.uid() = user_id);

-- Triggers de updated_at
CREATE TRIGGER update_patrimonio_itens_updated_at
BEFORE UPDATE ON public.patrimonio_itens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patrimonio_movimentos_updated_at
BEFORE UPDATE ON public.patrimonio_movimentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX IF NOT EXISTS idx_patrimonio_itens_user ON public.patrimonio_itens(user_id);
CREATE INDEX IF NOT EXISTS idx_patrimonio_itens_categoria ON public.patrimonio_itens(categoria);
CREATE INDEX IF NOT EXISTS idx_patrimonio_itens_status ON public.patrimonio_itens(status);
CREATE INDEX IF NOT EXISTS idx_patrimonio_mov_user ON public.patrimonio_movimentos(user_id);
CREATE INDEX IF NOT EXISTS idx_patrimonio_mov_item ON public.patrimonio_movimentos(item_id);
