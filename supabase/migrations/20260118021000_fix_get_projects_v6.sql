-- Migration: Update get_projects to v6
-- Reason: Calculate 'valor_pago' from 'transacoes' table for better accuracy.

CREATE OR REPLACE FUNCTION get_projects_v5(p_user_id uuid)
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
                    CASE WHEN c.id IS NOT NULL THEN jsonb_build_object('nome', c.nome) ELSE null END,
                    'sessoes_realizadas', COALESCE(s.realizadas, 0),
                    'valor_pago', COALESCE(fin.total_pago, 0),
                    'fotos_count', COALESCE(f.total_fotos, 0),
                    'feedback_count', COALESCE(s.feedbacks, 0),
                    'ultimo_agendamento', a.ultimo_agendamento
                ) as project_data
            FROM projetos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            -- Aggregated Stats from projeto_sessoes (removed valor_pago calc from here)
            LEFT JOIN (
                SELECT 
                    projeto_id,
                    COUNT(*) as realizadas,
                    COUNT(CASE WHEN feedback_cliente IS NOT NULL THEN 1 END) as feedbacks
                FROM projeto_sessoes
                GROUP BY projeto_id
            ) s ON p.id = s.projeto_id
            -- Aggregated Stats from projeto_fotos
            LEFT JOIN (
                SELECT 
                    projeto_id,
                    COUNT(*) as total_fotos
                FROM projeto_fotos
                GROUP BY projeto_id
            ) f ON p.id = f.projeto_id
            -- Last Appointment Date
            LEFT JOIN (
                SELECT 
                    projeto_id,
                    MAX(data) as ultimo_agendamento
                FROM agendamentos
                GROUP BY projeto_id
            ) a ON p.id = a.projeto_id
            -- Financial Stats from transacoes via agendamentos
            LEFT JOIN (
                SELECT 
                    ag.projeto_id,
                    SUM(t.valor) as total_pago
                FROM transacoes t
                JOIN agendamentos ag ON t.agendamento_id = ag.id
                WHERE t.tipo = 'RECEITA'
                GROUP BY ag.projeto_id
            ) fin ON p.id = fin.projeto_id
            
            WHERE p.user_id = p_user_id
            ORDER BY p.created_at DESC
        ) qt
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_projects_v5(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_projects_v5(uuid) TO service_role;
