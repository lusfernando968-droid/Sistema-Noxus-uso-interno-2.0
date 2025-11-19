-- Verificar permissões da tabela bancos
SELECT 
    grantee,
    table_name,
    privilege_type 
FROM 
    information_schema.role_table_grants 
WHERE 
    table_schema = 'public' 
    AND table_name = 'bancos'
    AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type;

-- Verificar se existe políticas RLS (Row Level Security)
SELECT 
    polname as policy_name,
    polcmd as command,
    polroles::regrole[] as roles,
    polqual as qual
FROM 
    pg_policies 
WHERE 
    schemaname = 'public' 
    AND tablename = 'bancos';

-- Verificar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'bancos'
ORDER BY ordinal_position;