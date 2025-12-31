-- SOLUÇÃO SISTÊMICA: RPCs para Projetos e Agendamentos
-- Replicação do sucesso da correção de Clientes

-- 1. Buscar Projetos (Com join em Clientes)
CREATE OR REPLACE FUNCTION get_projects_v4(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            row_to_json(p)::jsonb || 
            jsonb_build_object(
                'clientes', 
                CASE WHEN c.id IS NOT NULL THEN jsonb_build_object('nome', c.nome) ELSE null END
            )
        ) 
        FROM projetos p
        LEFT JOIN clientes c ON p.cliente_id = c.id
        WHERE p.user_id = p_user_id
        ORDER BY p.created_at DESC
    );
END;
$$;

-- 2. Buscar Agendamentos (Com join em Clientes e Projetos)
CREATE OR REPLACE FUNCTION get_appointments_v4(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT json_agg(
            row_to_json(a)::jsonb || 
            jsonb_build_object(
                'clientes', CASE WHEN c.id IS NOT NULL THEN jsonb_build_object('nome', c.nome) ELSE null END,
                'projetos', CASE WHEN p.id IS NOT NULL THEN jsonb_build_object('titulo', p.titulo) ELSE null END
            )
        ) 
        FROM agendamentos a
        LEFT JOIN clientes c ON a.cliente_id = c.id
        LEFT JOIN projetos p ON a.projeto_id = p.id
        WHERE a.user_id = p_user_id
        ORDER BY a.data_horario ASC
    );
END;
$$;

-- Libera execução
GRANT EXECUTE ON FUNCTION get_projects_v4(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_projects_v4(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION get_appointments_v4(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_appointments_v4(uuid) TO service_role;
