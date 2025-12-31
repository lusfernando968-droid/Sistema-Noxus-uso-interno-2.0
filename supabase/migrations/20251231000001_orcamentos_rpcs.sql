-- RPCs para gestão de orçamentos e conversão
-- Data: 2025-12-31

-- =====================================================
-- 1. RPC: Converter Orçamento em Cliente + Projeto
-- =====================================================
CREATE OR REPLACE FUNCTION public.converter_orcamento_em_cliente(
  p_orcamento_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_orcamento RECORD;
  v_cliente_id UUID;
  v_projeto_id UUID;
  v_result JSON;
BEGIN
  -- Buscar orçamento
  SELECT * INTO v_orcamento 
  FROM public.orcamentos 
  WHERE id = p_orcamento_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orçamento não encontrado';
  END IF;
  
  IF v_orcamento.status = 'fechado' THEN
    RAISE EXCEPTION 'Orçamento já foi fechado anteriormente';
  END IF;
  
  -- Criar ou atualizar cliente
  IF v_orcamento.cliente_id IS NULL THEN
    -- Criar novo cliente
    INSERT INTO public.clientes (
      user_id, nome, telefone, status
    ) VALUES (
      auth.uid(), 
      COALESCE(v_orcamento.nome, 'Cliente sem nome'), 
      v_orcamento.numero, 
      'cliente'
    ) RETURNING id INTO v_cliente_id;
  ELSE
    -- Usar cliente existente e atualizar status
    v_cliente_id := v_orcamento.cliente_id;
    UPDATE public.clientes 
    SET status = 'cliente' 
    WHERE id = v_cliente_id;
  END IF;
  
  -- Criar projeto
  INSERT INTO public.projetos (
    user_id, 
    cliente_id, 
    nome, 
    descricao, 
    valor_total, 
    status
  ) VALUES (
    auth.uid(), 
    v_cliente_id, 
    'Projeto ' || COALESCE(v_orcamento.estilo, 'Tatuagem'),
    COALESCE(v_orcamento.observacoes, 'Projeto criado a partir de orçamento'),
    COALESCE(v_orcamento.valor_total, v_orcamento.valor_estimado, 0),
    'planejamento'
  ) RETURNING id INTO v_projeto_id;
  
  -- Atualizar orçamento
  UPDATE public.orcamentos 
  SET 
    status = 'fechado',
    data_fechamento = now(),
    cliente_id = v_cliente_id,
    projeto_id = v_projeto_id,
    updated_at = now()
  WHERE id = p_orcamento_id;
  
  -- Retornar resultado
  v_result := json_build_object(
    'cliente_id', v_cliente_id,
    'projeto_id', v_projeto_id,
    'success', true,
    'message', 'Orçamento convertido com sucesso'
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. RPC: Buscar Orçamentos para Remarketing
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_orcamentos_remarketing(
  p_dias INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  numero TEXT,
  plataforma_contato TEXT,
  data_contato TIMESTAMP WITH TIME ZONE,
  valor_total NUMERIC,
  estilo TEXT,
  dias_desde_contato INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.nome,
    o.numero,
    o.plataforma_contato,
    o.data_contato,
    COALESCE(o.valor_total, o.valor_estimado) as valor_total,
    o.estilo,
    EXTRACT(DAY FROM (now() - o.data_contato))::INTEGER as dias_desde_contato
  FROM public.orcamentos o
  WHERE 
    o.user_id = auth.uid()
    AND o.status = 'pendente'
    AND o.data_contato IS NOT NULL
    AND EXTRACT(DAY FROM (now() - o.data_contato)) = p_dias
  ORDER BY o.data_contato DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 3. RPC: Analytics de Conversão
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_orcamentos_analytics(
  p_mes INTEGER DEFAULT EXTRACT(MONTH FROM now())::INTEGER,
  p_ano INTEGER DEFAULT EXTRACT(YEAR FROM now())::INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_total INTEGER;
  v_fechados INTEGER;
  v_pendentes INTEGER;
  v_perdidos INTEGER;
  v_taxa_conversao NUMERIC;
  v_valor_total_fechados NUMERIC;
  v_result JSON;
BEGIN
  -- Contar orçamentos
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'fechado'),
    COUNT(*) FILTER (WHERE status = 'pendente'),
    COUNT(*) FILTER (WHERE status = 'perdido'),
    SUM(COALESCE(valor_total, valor_estimado)) FILTER (WHERE status = 'fechado')
  INTO v_total, v_fechados, v_pendentes, v_perdidos, v_valor_total_fechados
  FROM public.orcamentos
  WHERE 
    user_id = auth.uid()
    AND EXTRACT(MONTH FROM data_contato) = p_mes
    AND EXTRACT(YEAR FROM data_contato) = p_ano;
  
  -- Calcular taxa de conversão
  IF v_total > 0 THEN
    v_taxa_conversao := (v_fechados::NUMERIC / v_total::NUMERIC) * 100;
  ELSE
    v_taxa_conversao := 0;
  END IF;
  
  -- Montar resultado
  v_result := json_build_object(
    'total', COALESCE(v_total, 0),
    'fechados', COALESCE(v_fechados, 0),
    'pendentes', COALESCE(v_pendentes, 0),
    'perdidos', COALESCE(v_perdidos, 0),
    'taxa_conversao', ROUND(v_taxa_conversao, 2),
    'valor_total_fechados', COALESCE(v_valor_total_fechados, 0),
    'mes', p_mes,
    'ano', p_ano
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. RPC: Estatísticas por Plataforma
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_orcamentos_por_plataforma()
RETURNS TABLE (
  plataforma TEXT,
  total INTEGER,
  fechados INTEGER,
  taxa_conversao NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(o.plataforma_contato, 'não informado') as plataforma,
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE o.status = 'fechado')::INTEGER as fechados,
    CASE 
      WHEN COUNT(*) > 0 THEN 
        ROUND((COUNT(*) FILTER (WHERE o.status = 'fechado')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
      ELSE 0
    END as taxa_conversao
  FROM public.orcamentos o
  WHERE o.user_id = auth.uid()
  GROUP BY o.plataforma_contato
  ORDER BY total DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. RPC: Orçamentos por Mês (últimos 6 meses)
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_orcamentos_por_mes()
RETURNS TABLE (
  mes INTEGER,
  ano INTEGER,
  mes_nome TEXT,
  total INTEGER,
  fechados INTEGER,
  valor_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(MONTH FROM o.data_contato)::INTEGER as mes,
    EXTRACT(YEAR FROM o.data_contato)::INTEGER as ano,
    TO_CHAR(o.data_contato, 'Mon/YY') as mes_nome,
    COUNT(*)::INTEGER as total,
    COUNT(*) FILTER (WHERE o.status = 'fechado')::INTEGER as fechados,
    SUM(COALESCE(o.valor_total, o.valor_estimado, 0)) as valor_total
  FROM public.orcamentos o
  WHERE 
    o.user_id = auth.uid()
    AND o.data_contato >= (CURRENT_DATE - INTERVAL '6 months')
  GROUP BY 
    EXTRACT(MONTH FROM o.data_contato),
    EXTRACT(YEAR FROM o.data_contato),
    TO_CHAR(o.data_contato, 'Mon/YY')
  ORDER BY ano DESC, mes DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário: RPCs para conversão de orçamentos, rastreamento de remarketing e analytics
