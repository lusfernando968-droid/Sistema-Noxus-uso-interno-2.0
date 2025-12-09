-- ============================================
-- View: clientes_com_ltv
-- Descrição: Calcula o LTV (Lifetime Value) de cada cliente
-- no banco de dados, eliminando N+1 queries no frontend
-- ============================================

-- Primeiro, remover a view se existir (para recriar)
DROP VIEW IF EXISTS public.clientes_com_ltv;

-- Criar view com cálculo de LTV otimizado
CREATE VIEW public.clientes_com_ltv AS
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
  -- Contagem de projetos
  COALESCE(proj_stats.projetos_count, 0)::integer AS projetos_count,
  -- Contagem de transações de receita pagas
  COALESCE(proj_stats.transacoes_count, 0)::integer AS transacoes_count,
  -- LTV: soma de sessões pagas + transações pagas
  COALESCE(proj_stats.ltv, 0)::numeric(12,2) AS ltv
FROM public.clientes c
LEFT JOIN LATERAL (
  SELECT 
    COUNT(DISTINCT p.id) AS projetos_count,
    -- Soma das sessões pagas
    COALESCE(SUM(ps.valor_sessao) FILTER (WHERE ps.status_pagamento = 'pago'), 0) AS sessoes_pagas,
    -- Contagem e soma de transações
    COUNT(DISTINCT t.id) FILTER (WHERE t.tipo = 'RECEITA' AND t.data_liquidacao IS NOT NULL) AS transacoes_count,
    COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'RECEITA' AND t.data_liquidacao IS NOT NULL), 0) AS transacoes_pagas,
    -- LTV Total
    COALESCE(SUM(ps.valor_sessao) FILTER (WHERE ps.status_pagamento = 'pago'), 0) +
    COALESCE(SUM(DISTINCT t.valor) FILTER (WHERE t.tipo = 'RECEITA' AND t.data_liquidacao IS NOT NULL), 0) AS ltv
  FROM public.projetos p
  LEFT JOIN public.projeto_sessoes ps ON ps.projeto_id = p.id
  LEFT JOIN public.agendamentos a ON a.projeto_id = p.id
  LEFT JOIN public.transacoes t ON t.agendamento_id = a.id AND t.user_id = c.user_id
  WHERE p.cliente_id = c.id AND p.user_id = c.user_id
) proj_stats ON true;

-- Comentário na view
COMMENT ON VIEW public.clientes_com_ltv IS 
'View que calcula o LTV (Lifetime Value) de cada cliente, incluindo contagem de projetos e transações. Usa security_invoker para respeitar RLS.';

-- Permitir acesso via RLS (security_invoker faz a view respeitar as políticas RLS das tabelas base)
ALTER VIEW public.clientes_com_ltv SET (security_invoker = true);

