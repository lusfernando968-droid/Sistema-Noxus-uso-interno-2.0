-- Garantir que a estrutura da tabela bancos esteja correta
-- e tornar campos opcionais realmente opcionais

-- Verificar se existe alguma constraint problemática
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'bancos';

-- Verificar índices únicos
SELECT 
    indexname,
    indexdef
FROM 
    pg_indexes 
WHERE 
    tablename = 'bancos' 
    AND schemaname = 'public';

-- Garantir permissões completas para authenticated
GRANT ALL ON TABLE public.bancos TO authenticated;
GRANT ALL ON TABLE public.bancos TO anon;

-- Se houver alguma constraint problemática, podemos removê-la temporariamente
-- (Descomente se necessário)
-- ALTER TABLE public.bancos DROP CONSTRAINT IF EXISTS nome_da_constraint_problematica;

-- Garantir que cor_primaria tenha valor padrão
ALTER TABLE public.bancos 
ALTER COLUMN cor_primaria SET DEFAULT '#1e40af';

-- Garantir que ativo tenha valor padrão
ALTER TABLE public.bancos 
ALTER COLUMN ativo SET DEFAULT true;

-- Garantir que created_at e updated_at tenham valores padrão
ALTER TABLE public.bancos 
ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.bancos 
ALTER COLUMN updated_at SET DEFAULT now();