-- Adicionar campos financeiros e de sessões à tabela de projetos
ALTER TABLE public.projetos 
ADD COLUMN valor_total DECIMAL(10,2),
ADD COLUMN valor_por_sessao DECIMAL(10,2),
ADD COLUMN quantidade_sessoes INTEGER,
ADD COLUMN data_inicio DATE,
ADD COLUMN data_fim DATE,
ADD COLUMN categoria TEXT,
ADD COLUMN notas TEXT,
ADD COLUMN conclusao_final TEXT;

-- Criar tabela para referências de projetos
CREATE TABLE public.projeto_referencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  url TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para projeto_referencias
ALTER TABLE public.projeto_referencias ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para projeto_referencias
CREATE POLICY "Usuários podem ver referências de seus projetos"
  ON public.projeto_referencias
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_referencias.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar referências para seus projetos"
  ON public.projeto_referencias
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_referencias.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar referências de seus projetos"
  ON public.projeto_referencias
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_referencias.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar referências de seus projetos"
  ON public.projeto_referencias
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_referencias.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

-- Criar tabela para anexos de projetos
CREATE TABLE public.projeto_anexos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para projeto_anexos
ALTER TABLE public.projeto_anexos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para projeto_anexos
CREATE POLICY "Usuários podem ver anexos de seus projetos"
  ON public.projeto_anexos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_anexos.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar anexos para seus projetos"
  ON public.projeto_anexos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_anexos.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar anexos de seus projetos"
  ON public.projeto_anexos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_anexos.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar anexos de seus projetos"
  ON public.projeto_anexos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_anexos.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

-- Criar tabela para sessões de projetos (para tracking de progresso)
CREATE TABLE public.projeto_sessoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  numero_sessao INTEGER NOT NULL,
  data_sessao DATE NOT NULL,
  valor_sessao DECIMAL(10,2),
  status_pagamento TEXT DEFAULT 'pendente', -- pendente, pago, cancelado
  metodo_pagamento TEXT,
  feedback_cliente TEXT,
  observacoes_tecnicas TEXT,
  avaliacao INTEGER CHECK (avaliacao >= 1 AND avaliacao <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para projeto_sessoes
ALTER TABLE public.projeto_sessoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para projeto_sessoes
CREATE POLICY "Usuários podem ver sessões de seus projetos"
  ON public.projeto_sessoes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_sessoes.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar sessões para seus projetos"
  ON public.projeto_sessoes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_sessoes.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar sessões de seus projetos"
  ON public.projeto_sessoes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_sessoes.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar sessões de seus projetos"
  ON public.projeto_sessoes
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_sessoes.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

-- Criar tabela para fotos de progresso dos projetos
CREATE TABLE public.projeto_fotos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
  sessao_id UUID REFERENCES public.projeto_sessoes(id) ON DELETE SET NULL,
  url_foto TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'progresso', -- antes, durante, depois, referencia, progresso
  data_upload TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para projeto_fotos
ALTER TABLE public.projeto_fotos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para projeto_fotos
CREATE POLICY "Usuários podem ver fotos de seus projetos"
  ON public.projeto_fotos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_fotos.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem criar fotos para seus projetos"
  ON public.projeto_fotos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_fotos.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem atualizar fotos de seus projetos"
  ON public.projeto_fotos
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_fotos.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem deletar fotos de seus projetos"
  ON public.projeto_fotos
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projetos 
      WHERE projetos.id = projeto_fotos.projeto_id 
      AND projetos.user_id = auth.uid()
    )
  );

-- Criar índices para melhor performance
CREATE INDEX idx_projeto_referencias_projeto_id ON public.projeto_referencias(projeto_id);
CREATE INDEX idx_projeto_anexos_projeto_id ON public.projeto_anexos(projeto_id);
CREATE INDEX idx_projeto_sessoes_projeto_id ON public.projeto_sessoes(projeto_id);
CREATE INDEX idx_projeto_sessoes_agendamento_id ON public.projeto_sessoes(agendamento_id);
CREATE INDEX idx_projeto_fotos_projeto_id ON public.projeto_fotos(projeto_id);
CREATE INDEX idx_projeto_fotos_sessao_id ON public.projeto_fotos(sessao_id);

-- Criar função para calcular progresso do projeto
CREATE OR REPLACE FUNCTION public.calcular_progresso_projeto(projeto_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  total_sessoes INTEGER;
  sessoes_realizadas INTEGER;
  progresso INTEGER;
BEGIN
  -- Buscar quantidade total de sessões planejadas
  SELECT quantidade_sessoes INTO total_sessoes
  FROM public.projetos
  WHERE id = projeto_id_param;
  
  -- Se não há sessões planejadas, retorna 0
  IF total_sessoes IS NULL OR total_sessoes = 0 THEN
    RETURN 0;
  END IF;
  
  -- Contar sessões realizadas
  SELECT COUNT(*) INTO sessoes_realizadas
  FROM public.projeto_sessoes
  WHERE projeto_id = projeto_id_param;
  
  -- Calcular progresso em porcentagem
  progresso := ROUND((sessoes_realizadas::DECIMAL / total_sessoes::DECIMAL) * 100);
  
  -- Garantir que não passe de 100%
  IF progresso > 100 THEN
    progresso := 100;
  END IF;
  
  RETURN progresso;
END;
$$;

-- Criar função para calcular valor pago do projeto
CREATE OR REPLACE FUNCTION public.calcular_valor_pago_projeto(projeto_id_param UUID)
RETURNS DECIMAL(10,2)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  valor_pago DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(valor_sessao), 0) INTO valor_pago
  FROM public.projeto_sessoes
  WHERE projeto_id = projeto_id_param
  AND status_pagamento = 'pago';
  
  RETURN valor_pago;
END;
$$;