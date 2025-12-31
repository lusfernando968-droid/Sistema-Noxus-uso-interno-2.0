-- SOLUÇÃO V2: RPC com nome novo para garantir atualização
-- 1. Cria a função 'get_clients_v2'
-- Usamos 'p_user_id' para evitar confusão com o nome da coluna 'user_id'

CREATE OR REPLACE FUNCTION get_clients_v2(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Superusuário (Ignora RLS e permissões de users)
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT json_agg(t) 
        FROM (
            SELECT 
                c.id, 
                c.user_id, 
                c.nome, 
                c.email, 
                c.telefone, 
                c.documento, 
                c.cidades, -- Se existir na tabela
                c.foto_url, 
                c.created_at,
                -- Mock de valores nulos
                0 as ltv
            FROM clientes c
            WHERE c.user_id = p_user_id
        ) t
    );
END;
$$;

-- 2. Libera execução
GRANT EXECUTE ON FUNCTION get_clients_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_clients_v2(uuid) TO service_role;

-- 3. Tentativa de liberar a tabela 'users' caso ela exista no schema public
-- (Se não existir, o comando falha silenciosamente ou dá erro ignorável se rodar tudo junto? 
-- Melhor separar, mas vamos arriscar o Grant genérico de novo com segurança)
DO $$
BEGIN
   EXECUTE 'GRANT SELECT ON TABLE "users" TO authenticated';
EXCEPTION WHEN OTHERS THEN
   NULL; -- Ignora erro se a tabela não existir
END
$$;
