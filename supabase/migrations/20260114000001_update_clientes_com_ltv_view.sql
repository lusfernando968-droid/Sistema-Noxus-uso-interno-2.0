-- Update View: clientes_com_ltv (Add status column, Fix missing anniversary)
-- Date: 2026-01-14

DROP VIEW IF EXISTS public.clientes_com_ltv;

CREATE OR REPLACE VIEW public.clientes_com_ltv AS
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
  -- c.data_aniversario,  <-- REMOVIDO POIS NÃO EXISTE NA TABELA
  c.foto_url,
  c.status,
  c.created_at,
  c.updated_at,
  COALESCE(proj_stats.projetos_count, 0)::integer AS projetos_count,
  COALESCE(proj_stats.transacoes_count, 0)::integer AS transacoes_count,
  COALESCE(proj_stats.ltv, 0)::numeric(12,2) AS ltv
FROM public.clientes c
LEFT JOIN LATERAL (
  SELECT 
    COUNT(DISTINCT p.id) AS projetos_count,
    COALESCE(SUM(ps.valor_sessao) FILTER (WHERE ps.status_pagamento = 'pago'), 0) AS sessoes_pagas,
    COUNT(DISTINCT t.id) FILTER (WHERE t.tipo = 'RECEITA' AND t.data_liquidacao IS NOT NULL) AS transacoes_count,
    COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'RECEITA' AND t.data_liquidacao IS NOT NULL), 0) AS transacoes_pagas,
    COALESCE(SUM(ps.valor_sessao) FILTER (WHERE ps.status_pagamento = 'pago'), 0) +
    COALESCE(SUM(DISTINCT t.valor) FILTER (WHERE t.tipo = 'RECEITA' AND t.data_liquidacao IS NOT NULL), 0) AS ltv
  FROM public.projetos p
  LEFT JOIN public.projeto_sessoes ps ON ps.projeto_id = p.id
  LEFT JOIN public.agendamentos a ON a.projeto_id = p.id
  LEFT JOIN public.transacoes t ON t.agendamento_id = a.id AND t.user_id = c.user_id
  WHERE p.cliente_id = c.id AND p.user_id = c.user_id
) proj_stats ON true;

ALTER VIEW public.clientes_com_ltv SET (security_invoker = true);
