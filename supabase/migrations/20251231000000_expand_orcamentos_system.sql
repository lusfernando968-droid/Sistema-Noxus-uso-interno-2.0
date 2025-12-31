-- Expandir sistema de orçamentos para gestão completa de leads
-- Data: 2025-12-31

-- 1. Adicionar campos de lead/contato à tabela orcamentos
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS plataforma_contato TEXT CHECK (plataforma_contato IN ('instagram', 'presencial', 'whatsapp')),
ADD COLUMN IF NOT EXISTS data_contato TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 2. Adicionar status do orçamento
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente' 
  CHECK (status IN ('pendente', 'fechado', 'perdido'));

-- 3. Adicionar detalhes do projeto
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS local_tatuagem TEXT,
ADD COLUMN IF NOT EXISTS quantidade_sessoes INTEGER,
ADD COLUMN IF NOT EXISTS valor_por_sessao NUMERIC,
ADD COLUMN IF NOT EXISTS valor_total NUMERIC,
ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- 4. Adicionar rastreamento
ALTER TABLE public.orcamentos 
ADD COLUMN IF NOT EXISTS data_fechamento TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS projeto_id UUID REFERENCES public.projetos(id) ON DELETE SET NULL;

-- 5. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON public.orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_orcamentos_data_contato ON public.orcamentos(data_contato);
CREATE INDEX IF NOT EXISTS idx_orcamentos_plataforma ON public.orcamentos(plataforma_contato);
CREATE INDEX IF NOT EXISTS idx_orcamentos_projeto_id ON public.orcamentos(projeto_id);

-- 6. Atualizar registros existentes (se houver)
UPDATE public.orcamentos 
SET 
  status = 'pendente',
  data_contato = created_at
WHERE status IS NULL;

-- Comentário: Esta migration expande a tabela orcamentos para suportar
-- gestão completa de leads, rastreamento temporal e conversão em clientes/projetos
