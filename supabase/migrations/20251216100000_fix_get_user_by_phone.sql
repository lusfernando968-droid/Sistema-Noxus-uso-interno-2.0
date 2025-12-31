-- Atualiza função get_user_by_phone para buscar também na tabela profiles
-- Migration: fix_get_user_by_phone

CREATE OR REPLACE FUNCTION get_user_by_phone(p_phone TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  verified BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_clean_phone TEXT;
BEGIN
  -- Remove formatação do telefone (mantém apenas números)
  v_clean_phone := regexp_replace(p_phone, '[^0-9]', '', 'g');
  
  -- Remove código do país se presente (55 para Brasil)
  IF v_clean_phone LIKE '55%' THEN
    v_clean_phone := substring(v_clean_phone from 3);
  END IF;
  
  RETURN QUERY
  -- Primeiro tenta buscar em user_phone_numbers (verificado)
  SELECT 
    upn.user_id,
    u.email,
    upn.verified
  FROM public.user_phone_numbers upn
  JOIN auth.users u ON u.id = upn.user_id
  WHERE regexp_replace(upn.phone_number, '[^0-9]', '', 'g') LIKE '%' || v_clean_phone
    AND upn.verified = true
  LIMIT 1;
  
  -- Se não encontrar, busca em profiles.telefone
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      p.user_id,
      u.email,
      true as verified  -- Considera verificado se está no perfil
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE regexp_replace(p.telefone, '[^0-9]', '', 'g') LIKE '%' || v_clean_phone
      AND p.telefone IS NOT NULL
    LIMIT 1;
  END IF;
END;
$$;

COMMENT ON FUNCTION get_user_by_phone IS 'Busca usuário por número de telefone (user_phone_numbers ou profiles)';
