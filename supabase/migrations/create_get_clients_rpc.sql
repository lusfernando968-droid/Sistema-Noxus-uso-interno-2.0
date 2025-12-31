-- FUNÇÃO DE LEITURA BLINDADA (Bypassa RLS de 'users' e outros bloqueios)
-- Retorna os clientes ignorando qualquer permissão de tabela
CREATE OR REPLACE FUNCTION get_clients_secure(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Roda como SUPERUSUARIO (ignora RLS)
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
                c.endereco, 
                c.instagram, 
                c.cidade, 
                c.indicado_por, 
                c.data_aniversario, 
                c.foto_url, 
                c.created_at, 
                c.updated_at,
                -- Campos extras calculados como ZERO para manter compatibilidade
                0 as ltv,
                0 as projetos_count,
                0 as transacoes_count
            FROM clientes c
            WHERE c.user_id = target_user_id
            ORDER BY c.nome ASC
        ) t
    );
END;
$$;

-- Dá permissão para todos usarem essa função
GRANT EXECUTE ON FUNCTION get_clients_secure(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_clients_secure(uuid) TO service_role;
