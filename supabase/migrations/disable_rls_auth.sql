-- DESATIVAR RLS EM TABELAS DE SISTEMA (Auth/Roles)
-- Isso garante que o sistema reconheça que você é ADMIN.

ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
