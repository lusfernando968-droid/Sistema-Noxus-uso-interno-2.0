-- Função segura para obter role e master_id ignorando RLS das tabelas
-- Isso resolve o erro 403 Forbidden
CREATE OR REPLACE FUNCTION get_user_role_safe(target_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Roda com permissões de admin/criador
SET search_path = public -- Segurança
AS $$
DECLARE
    curr_user_id uuid;
    found_role text;
    found_master uuid;
    found_assistant_id uuid;
BEGIN
    curr_user_id := auth.uid();

    -- 1. Check user_roles (Admin/Manager)
    SELECT role INTO found_role FROM user_roles WHERE user_id = curr_user_id;

    IF found_role IS NOT NULL AND found_role != 'user' THEN
        RETURN json_build_object('role', found_role, 'master_id', curr_user_id);
    END IF;

    -- 2. Check assistants by ID (se já estiver vinculado)
    SELECT user_id INTO found_master FROM assistants WHERE assistant_id = curr_user_id;

    IF found_master IS NOT NULL THEN
        RETURN json_build_object('role', 'assistant', 'master_id', found_master);
    END IF;

    -- 3. Check assistants by Email (para o primeiro acesso/vinculação)
    IF target_email IS NOT NULL THEN
        SELECT id, user_id INTO found_assistant_id, found_master FROM assistants WHERE assistant_email = target_email;

        IF found_master IS NOT NULL THEN
            -- Auto-link: Se achou pelo email mas não tinha ID, salva o ID agora
             UPDATE assistants SET assistant_id = curr_user_id WHERE id = found_assistant_id;
             
             RETURN json_build_object('role', 'assistant', 'master_id', found_master);
        END IF;
    END IF;

    -- 4. Fallback (é apenas um usuário comum)
    RETURN json_build_object('role', 'user', 'master_id', curr_user_id);
END;
$$;
