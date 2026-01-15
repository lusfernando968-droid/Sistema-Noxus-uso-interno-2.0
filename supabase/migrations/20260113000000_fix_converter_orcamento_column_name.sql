-- Fix converter_orcamento_em_cliente RPC to use correct column name
-- The projetos table has 'titulo' not 'nome'
-- Date: 2026-01-13

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
  
  -- Criar projeto (FIXED: usando 'titulo' em vez de 'nome')
  INSERT INTO public.projetos (
    user_id, 
    cliente_id, 
    titulo, 
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

-- Comentário: Corrigido para usar 'titulo' em vez de 'nome' na tabela projetos
