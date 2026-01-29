-- Migration: Optimize get_projects_v5 RPC
-- Reason: Include 'ultimo_agendamento' to identify stalled projects.

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
                    'valor_pago', COALESCE(s.pago, 0),
                    'fotos_count', COALESCE(f.total_fotos, 0),
                    'feedback_count', COALESCE(s.feedbacks, 0),
                    'ultimo_agendamento', a.ultimo_agendamento
                ) as project_data
            FROM projetos p
            LEFT JOIN clientes c ON p.cliente_id = c.id
            -- Aggregated Stats from projeto_sessoes
            LEFT JOIN (
                SELECT 
                    projeto_id,
                    COUNT(*) as realizadas,
                    SUM(CASE WHEN status_pagamento = 'pago' THEN valor_sessao ELSE 0 END) as pago,
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
            
            WHERE p.user_id = p_user_id
            ORDER BY p.created_at DESC
        ) qt
    );
END;
$$;

GRANT EXECUTE ON FUNCTION get_projects_v5(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_projects_v5(uuid) TO service_role;
