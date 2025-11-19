-- Garantir permissões para a tabela bancos
GRANT ALL ON TABLE public.bancos TO authenticated;
GRANT SELECT ON TABLE public.bancos TO anon;

-- Se precisar inserir novos bancos como usuário autenticado
GRANT INSERT ON TABLE public.bancos TO authenticated;

-- Verificar se existem políticas RLS e criar se necessário
-- Como RLS está desabilitado, as permissões acima devem ser suficientes