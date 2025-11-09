-- Adiciona coluna de preferência de cor do sistema ao perfil
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS color_theme TEXT NOT NULL DEFAULT 'black';

-- Opcional: comentar possíveis valores para referência
-- Valores suportados pelo app: 'default', 'ocean', 'sunset', 'forest', 'purple', 'rose', 'black'