-- Verificar estrutura atual da tabela bancos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'bancos'
ORDER BY ordinal_position;

-- Verificar valores atuais para entender o padrão
SELECT 
    codigo,
    nome_curto,
    nome,
    cor_primaria,
    ativo,
    created_at
FROM 
    public.bancos 
ORDER BY 
    codigo 
LIMIT 10;