-- Migration: Fix SQL Syntax Error in get_projects_v4 RPC
-- Reason: The previous version failed with "column p.created_at must appear in GROUP BY"
-- Solution: Use a subquery to order results before aggregating.

CREATE OR REPLACE FUNCTION get_projects_v4(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        SELECT json_agg(qt.project_data)
        FROM (
            SELECT 
                row_to_json(p)::jsonb || 
                jsonb_build_object(
                    'clientes', 
                    CASE WHEN c.id IS NOT NULL THEN jsonb_build_object('nome', c.nome) ELSE null END
                ) as project_data
            FROM projetos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            WHERE p.user_id = p_user_id
            ORDER BY p.created_at DESC
        ) qt
    );
END;
$$;

-- Grant execute permissions again just in case
GRANT EXECUTE ON FUNCTION get_projects_v4(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_projects_v4(uuid) TO service_role;
