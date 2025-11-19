-- Criar tabela de financeiro geral (despesas gerais)
CREATE TABLE public.financeiro_geral (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  data TIMESTAMP WITH TIME ZONE NOT NULL,
  descricao TEXT NOT NULL,
  valor DECIMAL(12, 2) NOT NULL CHECK (valor >= 0),
  categoria TEXT NOT NULL,
  forma_pagamento TEXT NOT NULL,
  comprovante TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.financeiro_geral ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (usuário somente vê/edita seus registros)
CREATE POLICY "Usuários podem ver seu financeiro geral" 
ON public.financeiro_geral 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seu financeiro geral" 
ON public.financeiro_geral 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu financeiro geral" 
ON public.financeiro_geral 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seu financeiro geral" 
ON public.financeiro_geral 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_financeiro_geral_updated_at
BEFORE UPDATE ON public.financeiro_geral
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para desempenho
CREATE INDEX idx_financeiro_geral_user_id ON public.financeiro_geral(user_id);
CREATE INDEX idx_financeiro_geral_data ON public.financeiro_geral(data);
CREATE INDEX idx_financeiro_geral_categoria ON public.financeiro_geral(categoria);

-- Categorias recomendadas para despesas gerais (comentário de referência)
-- Aluguel, Contas, Materiais, Marketing, Impostos, Salários, Serviços, Manutenção, Outros