-- ============================================
-- View: projetos_com_metricas
-- Descrição: Retorna projetos com métricas calculadas
-- (sessões realizadas, valor pago, progresso)
-- ============================================

-- Primeiro, remover a view se existir (para recriar)
DROP VIEW IF EXISTS public.projetos_com_metricas;

-- Criar view com métricas otimizadas
CREATE VIEW public.projetos_com_metricas AS
SELECT 
  p.id,
  p.user_id,
  p.cliente_id,
  p.titulo,
  p.descricao,
  p.status,
  p.notas,
  p.valor_total,
  p.valor_por_sessao,
  p.quantidade_sessoes,
  p.progresso,
  p.data_inicio,
  p.data_estimada_fim,
  p.local_corpo,
  p.estilo,
  p.created_at,
  p.updated_at,
  -- Dados do cliente
  c.id AS cliente_id_ref,
  c.nome AS cliente_nome,
  c.email AS cliente_email,
  c.telefone AS cliente_telefone,
  c.instagram AS cliente_instagram,
  c.foto_url AS cliente_foto_url,
  -- Métricas calculadas
  COALESCE(metricas.sessoes_realizadas, 0)::integer AS sessoes_realizadas,
  COALESCE(metricas.valor_pago, 0)::numeric(12,2) AS valor_pago,
  COALESCE(metricas.fotos_count, 0)::integer AS fotos_count,
  COALESCE(metricas.agendamentos_count, 0)::integer AS agendamentos_count,
  -- Progresso calculado
  CASE 
    WHEN COALESCE(p.quantidade_sessoes, 0) > 0 
    THEN LEAST(100, ROUND((COALESCE(metricas.sessoes_realizadas, 0)::numeric / p.quantidade_sessoes) * 100))
    ELSE 0 
  END::integer AS progresso_calculado
FROM public.projetos p
LEFT JOIN public.clientes c ON c.id = p.cliente_id
LEFT JOIN LATERAL (
  SELECT 
    -- Contagem de sessões realizadas
    COUNT(DISTINCT ps.id) AS sessoes_realizadas,
    -- Soma do valor pago
    COALESCE(SUM(ps.valor_sessao) FILTER (WHERE ps.status_pagamento = 'pago'), 0) AS valor_pago,
    -- Contagem de fotos
    (SELECT COUNT(*) FROM public.projeto_fotos pf WHERE pf.projeto_id = p.id) AS fotos_count,
    -- Contagem de agendamentos
    (SELECT COUNT(*) FROM public.agendamentos ag WHERE ag.projeto_id = p.id) AS agendamentos_count
  FROM public.projeto_sessoes ps
  WHERE ps.projeto_id = p.id
) metricas ON true;

-- Comentário na view
COMMENT ON VIEW public.projetos_com_metricas IS 
'View que retorna projetos com métricas calculadas (sessões, valor pago, progresso). Usa security_invoker para respeitar RLS.';

-- Permitir acesso via RLS
ALTER VIEW public.projetos_com_metricas SET (security_invoker = true);

