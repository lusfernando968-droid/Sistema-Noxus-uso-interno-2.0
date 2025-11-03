-- Criar bucket de storage para referências de projetos
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-references', 'project-references', true);

-- Políticas para o bucket de referências
CREATE POLICY "Usuários podem visualizar referências de seus projetos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem fazer upload de referências"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuários podem deletar suas referências"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-references' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Tabela para links de referência
CREATE TABLE public.projeto_referencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  url TEXT NOT NULL,
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projeto_referencias ENABLE ROW LEVEL SECURITY;

-- RLS Policies para projeto_referencias
CREATE POLICY "Usuários podem ver referências de seus projetos"
ON public.projeto_referencias FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar referências em seus projetos"
ON public.projeto_referencias FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar referências de seus projetos"
ON public.projeto_referencias FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar referências de seus projetos"
ON public.projeto_referencias FOR DELETE
USING (auth.uid() = user_id);

-- Tabela para anexos de projetos
CREATE TABLE public.projeto_anexos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  projeto_id UUID NOT NULL,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo TEXT NOT NULL,
  tamanho INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projeto_anexos ENABLE ROW LEVEL SECURITY;

-- RLS Policies para projeto_anexos
CREATE POLICY "Usuários podem ver anexos de seus projetos"
ON public.projeto_anexos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar anexos em seus projetos"
ON public.projeto_anexos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar anexos de seus projetos"
ON public.projeto_anexos FOR DELETE
USING (auth.uid() = user_id);

-- Adicionar coluna de notas detalhadas aos projetos
ALTER TABLE public.projetos ADD COLUMN notas TEXT;

-- Trigger para atualizar updated_at nas novas tabelas
CREATE TRIGGER update_projeto_referencias_updated_at
BEFORE UPDATE ON public.projeto_referencias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projeto_anexos_updated_at
BEFORE UPDATE ON public.projeto_anexos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();