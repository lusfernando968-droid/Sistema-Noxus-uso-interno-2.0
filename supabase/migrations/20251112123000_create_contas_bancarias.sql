-- Criar tabela de contas bancárias
CREATE TABLE public.contas_bancarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  banco TEXT,
  agencia TEXT,
  numero TEXT,
  tipo TEXT,
  moeda TEXT NOT NULL DEFAULT 'BRL',
  saldo_inicial DECIMAL(14, 2) NOT NULL DEFAULT 0,
  is_arquivada BOOLEAN NOT NULL DEFAULT false,
  arquivado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (usuário somente vê/edita seus registros)
CREATE POLICY "Usuários podem ver suas contas bancárias"
ON public.contas_bancarias
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir suas contas bancárias"
ON public.contas_bancarias
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas contas bancárias"
ON public.contas_bancarias
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas contas bancárias"
ON public.contas_bancarias
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_contas_bancarias_updated_at
BEFORE UPDATE ON public.contas_bancarias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para desempenho
CREATE INDEX idx_contas_bancarias_user_id ON public.contas_bancarias(user_id);
CREATE INDEX idx_contas_bancarias_is_arquivada ON public.contas_bancarias(is_arquivada);
CREATE INDEX idx_contas_bancarias_nome ON public.contas_bancarias(nome);

