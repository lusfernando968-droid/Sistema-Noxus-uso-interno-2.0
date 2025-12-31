-- SOLUÇÃO V4 (DEFINITIVA): Seleção Dinâmica
-- Em vez de listar as colunas uma por uma (e errar os nomes),
-- vamos pegar O QUE TIVER na tabela usando "c".
-- Isso evita erros "column does not exist".

CREATE OR REPLACE FUNCTION get_clients_v4(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Superusuário
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT json_agg(c) 
        FROM clientes c
        WHERE c.user_id = p_user_id
    );
END;
$$;

-- Libera execução
GRANT EXECUTE ON FUNCTION get_clients_v4(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_clients_v4(uuid) TO service_role;
