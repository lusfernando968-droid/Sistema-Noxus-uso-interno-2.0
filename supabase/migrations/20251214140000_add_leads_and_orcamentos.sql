-- Add status to clientes table
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'lead' 
CHECK (status IN ('lead', 'cliente', 'efetivado'));

-- Create orcamentos table
CREATE TABLE IF NOT EXISTS public.orcamentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
    tamanho NUMERIC NOT NULL,
    estilo TEXT NOT NULL,
    cor TEXT NOT NULL,
    locais TEXT[] NOT NULL DEFAULT '{}',
    tempo_estimado NUMERIC NOT NULL,
    valor_estimado NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- Policies for orcamentos
CREATE POLICY "Users can view their own orcamentos" ON public.orcamentos
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own orcamentos" ON public.orcamentos
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own orcamentos" ON public.orcamentos
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own orcamentos" ON public.orcamentos
    FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orcamentos_user_id ON public.orcamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON public.orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON public.clientes(status);

-- Trigger for update_updated_at_column (assuming the function exists from previous migrations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orcamentos_updated_at') THEN
        CREATE TRIGGER update_orcamentos_updated_at
        BEFORE UPDATE ON public.orcamentos
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END
$$;
