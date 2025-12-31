-- SOLUÇÃO V3: Correção do nome da coluna
-- O erro anterior foi "column c.cidades does not exist"
-- A coluna correta na tabela é "cidade" (singular).

CREATE OR REPLACE FUNCTION get_clients_v3(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Superusuário
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
                c.cidade, -- CORRIGIDO: Era 'cidades', agora é 'cidade'
                c.indicado_por,
                c.data_aniversario,
                c.foto_url, 
                c.instagram,
                c.created_at,
                c.updated_at,
                -- Mock de valores nulos
                0 as ltv
            FROM clientes c
            WHERE c.user_id = p_user_id
        ) t
    );
END;
$$;

-- Libera execução
GRANT EXECUTE ON FUNCTION get_clients_v3(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_clients_v3(uuid) TO service_role;
