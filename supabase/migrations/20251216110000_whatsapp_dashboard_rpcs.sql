-- RPCs para Dashboard de Conversas WhatsApp
-- Migration: 20251216110000_whatsapp_dashboard_rpcs

-- Função para listar conversas ativas
CREATE OR REPLACE FUNCTION get_active_conversations()
RETURNS TABLE (
  phone_number TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  message_count BIGINT,
  last_direction TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    SELECT DISTINCT ON (cl.phone_number)
      cl.phone_number,
      cl.message_text as last_message,
      cl.created_at as last_message_at,
      cl.direction as last_direction
    FROM chatbot_logs cl
    ORDER BY cl.phone_number, cl.created_at DESC
  )
  SELECT 
    lm.phone_number,
    lm.last_message,
    lm.last_message_at,
    COUNT(cl.id) as message_count,
    lm.last_direction
  FROM latest_messages lm
  LEFT JOIN chatbot_logs cl ON cl.phone_number = lm.phone_number
  GROUP BY lm.phone_number, lm.last_message, lm.last_message_at, lm.last_direction
  ORDER BY lm.last_message_at DESC
  LIMIT 100;
END;
$$;

-- Função para buscar mensagens de uma conversa
CREATE OR REPLACE FUNCTION get_conversation_messages(p_phone_number TEXT)
RETURNS TABLE (
  id UUID,
  phone_number TEXT,
  direction TEXT,
  message_text TEXT,
  intent TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cl.id,
    cl.phone_number,
    cl.direction,
    cl.message_text,
    cl.intent,
    cl.created_at
  FROM chatbot_logs cl
  WHERE cl.phone_number = p_phone_number
  ORDER BY cl.created_at ASC;
END;
$$;

-- Comentários
COMMENT ON FUNCTION get_active_conversations IS 'Lista conversas ativas do chatbot WhatsApp';
COMMENT ON FUNCTION get_conversation_messages IS 'Busca histórico de mensagens de uma conversa';
