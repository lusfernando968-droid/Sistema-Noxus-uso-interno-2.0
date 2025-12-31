-- Tabelas do Chatbot WhatsApp
-- Migration: 20251216000000_create_chatbot_tables

-- Tabela de sessões de chatbot
CREATE TABLE IF NOT EXISTS public.chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id),
  state JSONB DEFAULT '{}'::jsonb,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '15 minutes')
);

-- Tabela de logs de mensagens
CREATE TABLE IF NOT EXISTS public.chatbot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.chatbot_sessions(id),
  phone_number TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_text TEXT,
  intent TEXT,
  entities JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de telefones vinculados
CREATE TABLE IF NOT EXISTS public.user_phone_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  phone_number TEXT NOT NULL UNIQUE,
  verified BOOLEAN DEFAULT false,
  verification_code TEXT,
  code_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_phone ON public.chatbot_sessions(phone_number);
CREATE INDEX IF NOT EXISTS idx_chatbot_sessions_expires ON public.chatbot_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_session ON public.chatbot_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_phone ON public.chatbot_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_phones_number ON public.user_phone_numbers(phone_number);
CREATE INDEX IF NOT EXISTS idx_user_phones_user ON public.user_phone_numbers(user_id);

-- Habilitar RLS
ALTER TABLE public.chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_phone_numbers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS (service_role bypass RLS automaticamente)
CREATE POLICY "Service role full access chatbot_sessions"
  ON public.chatbot_sessions FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access chatbot_logs"
  ON public.chatbot_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own phone numbers"
  ON public.user_phone_numbers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own phone numbers"
  ON public.user_phone_numbers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own phone numbers"
  ON public.user_phone_numbers FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger para limpar sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.chatbot_sessions
  WHERE expires_at < now();
END;
$$;

-- Comentários
COMMENT ON TABLE public.chatbot_sessions IS 'Sessões ativas de conversação do chatbot';
COMMENT ON TABLE public.chatbot_logs IS 'Log de todas as mensagens trocadas com o chatbot';
COMMENT ON TABLE public.user_phone_numbers IS 'Telefones vinculados aos usuários para autenticação via WhatsApp';
