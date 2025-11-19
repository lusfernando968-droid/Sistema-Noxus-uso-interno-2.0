-- Create aula_modelos table first (referenced by aulas)
CREATE TABLE IF NOT EXISTS public.aula_modelos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  disciplina TEXT NOT NULL,
  descricao TEXT,
  estrutura JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create aulas table
CREATE TABLE IF NOT EXISTS public.aulas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  disciplina TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'esboco_inicial',
  prazo DATE,
  descricao TEXT,
  estrutura JSONB DEFAULT '[]',
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  modelo_id UUID REFERENCES public.aula_modelos(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create aula_versions table
CREATE TABLE IF NOT EXISTS public.aula_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  aula_id UUID REFERENCES public.aulas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  version_number BIGINT NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aula_modelos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aula_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for aulas
CREATE POLICY "Users can view their own aulas" ON public.aulas
  FOR SELECT USING (auth.uid() = responsavel_id);

CREATE POLICY "Users can insert their own aulas" ON public.aulas
  FOR INSERT WITH CHECK (auth.uid() = responsavel_id);

CREATE POLICY "Users can update their own aulas" ON public.aulas
  FOR UPDATE USING (auth.uid() = responsavel_id);

CREATE POLICY "Users can delete their own aulas" ON public.aulas
  FOR DELETE USING (auth.uid() = responsavel_id);

-- Create policies for aula_modelos
CREATE POLICY "Anyone can view aula_modelos" ON public.aula_modelos
  FOR SELECT USING (true);

CREATE POLICY "Users can insert aula_modelos" ON public.aula_modelos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update aula_modelos" ON public.aula_modelos
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete aula_modelos" ON public.aula_modelos
  FOR DELETE USING (true);

-- Create policies for aula_versions
CREATE POLICY "Users can view versions of their aulas" ON public.aula_versions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.aulas 
    WHERE aulas.id = aula_versions.aula_id 
    AND aulas.responsavel_id = auth.uid()
  ));

CREATE POLICY "Users can insert versions for their aulas" ON public.aula_versions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_aulas_status ON public.aulas(status);
CREATE INDEX idx_aulas_responsavel ON public.aulas(responsavel_id);
CREATE INDEX idx_aulas_prazo ON public.aulas(prazo);
CREATE INDEX idx_aulas_modelo ON public.aulas(modelo_id);
CREATE INDEX idx_aula_versions_aula ON public.aula_versions(aula_id);
CREATE INDEX idx_aula_versions_user ON public.aula_versions(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_aulas_updated_at
  BEFORE UPDATE ON public.aulas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aula_modelos_updated_at
  BEFORE UPDATE ON public.aula_modelos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();