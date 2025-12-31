-- Fix RLS policies for WhatsApp dashboard
-- Migration: 20251218000000_fix_whatsapp_dashboard_rls

-- Allow authenticated users to view chatbot logs and sessions
CREATE POLICY "Authenticated users can view chatbot_logs"
  ON public.chatbot_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view chatbot_sessions"
  ON public.chatbot_sessions FOR SELECT
  TO authenticated
  USING (true);

-- Grant execute permission on RPCs to authenticated users
GRANT EXECUTE ON FUNCTION get_active_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_messages(TEXT) TO authenticated;

-- Comments
COMMENT ON POLICY "Authenticated users can view chatbot_logs" ON public.chatbot_logs 
  IS 'Permite que usuários autenticados vejam logs do chatbot para o dashboard';
COMMENT ON POLICY "Authenticated users can view chatbot_sessions" ON public.chatbot_sessions 
  IS 'Permite que usuários autenticados vejam sessões do chatbot para o dashboard';
