-- Funções RPC para Chatbot WhatsApp
-- Migration: 20251216000001_create_chatbot_rpcs

-- Função para criar cliente via chatbot
CREATE OR REPLACE FUNCTION create_cliente_via_chatbot(
  p_user_id UUID,
  p_nome TEXT,
  p_email TEXT,
  p_telefone TEXT,
  p_documento TEXT DEFAULT NULL,
  p_endereco TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cliente_id UUID;
BEGIN
  -- Valida dados obrigatórios
  IF p_nome IS NULL OR p_email IS NULL OR p_telefone IS NULL THEN
    RAISE EXCEPTION 'Nome, email e telefone são obrigatórios';
  END IF;

  -- Insere cliente
  INSERT INTO public.clientes (
    user_id,
    nome,
    email,
    telefone,
    documento,
    endereco,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_nome,
    p_email,
    p_telefone,
    p_documento,
    p_endereco,
    now(),
    now()
  )
  RETURNING id INTO v_cliente_id;
  
  RETURN v_cliente_id;
END;
$$;

-- Função para buscar usuário por telefone
CREATE OR REPLACE FUNCTION get_user_by_phone(p_phone TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    upn.user_id,
    u.email,
    upn.verified
  FROM public.user_phone_numbers upn
  JOIN auth.users u ON u.id = upn.user_id
  WHERE upn.phone_number = p_phone
    AND upn.verified = true
  LIMIT 1;
END;
$$;

-- Função para criar agendamento via chatbot
CREATE OR REPLACE FUNCTION create_agendamento_via_chatbot(
  p_user_id UUID,
  p_projeto_id UUID,
  p_titulo TEXT,
  p_data DATE,
  p_hora TIME,
  p_descricao TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_agendamento_id UUID;
BEGIN
  -- Valida dados obrigatórios
  IF p_projeto_id IS NULL OR p_titulo IS NULL OR p_data IS NULL OR p_hora IS NULL THEN
    RAISE EXCEPTION 'Projeto, título, data e hora são obrigatórios';
  END IF;

  -- Verifica se projeto existe e pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.projetos 
    WHERE id = p_projeto_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Projeto não encontrado';
  END IF;

  -- Insere agendamento
  INSERT INTO public.agendamentos (
    user_id,
    projeto_id,
    titulo,
    data,
    hora,
    descricao,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_projeto_id,
    p_titulo,
    p_data,
    p_hora,
    p_descricao,
    'agendado',
    now(),
    now()
  )
  RETURNING id INTO v_agendamento_id;
  
  RETURN v_agendamento_id;
END;
$$;

-- Função para criar projeto via chatbot
CREATE OR REPLACE FUNCTION create_projeto_via_chatbot(
  p_user_id UUID,
  p_cliente_id UUID,
  p_titulo TEXT,
  p_descricao TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'planejamento'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_projeto_id UUID;
BEGIN
  -- Valida dados obrigatórios
  IF p_cliente_id IS NULL OR p_titulo IS NULL THEN
    RAISE EXCEPTION 'Cliente e título são obrigatórios';
  END IF;

  -- Verifica se cliente existe e pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.clientes 
    WHERE id = p_cliente_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Cliente não encontrado';
  END IF;

  -- Insere projeto
  INSERT INTO public.projetos (
    user_id,
    cliente_id,
    titulo,
    descricao,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_cliente_id,
    p_titulo,
    p_descricao,
    p_status,
    now(),
    now()
  )
  RETURNING id INTO v_projeto_id;
  
  RETURN v_projeto_id;
END;
$$;

-- Comentários
COMMENT ON FUNCTION create_cliente_via_chatbot IS 'Cria cliente via chatbot WhatsApp com validações';
COMMENT ON FUNCTION get_user_by_phone IS 'Busca usuário por número de telefone verificado';
COMMENT ON FUNCTION create_agendamento_via_chatbot IS 'Cria agendamento via chatbot WhatsApp';
COMMENT ON FUNCTION create_projeto_via_chatbot IS 'Cria projeto via chatbot WhatsApp';
