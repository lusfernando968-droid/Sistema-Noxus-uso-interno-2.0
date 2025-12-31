-- O problema é que o front-end consulta uma VIEW (clientes_com_ltv) e não a tabela direta
-- Precisamos dar permissão explícita para ler essa view

GRANT SELECT ON clientes_com_ltv TO authenticated;
GRANT SELECT ON clientes_com_ltv TO service_role;
GRANT SELECT ON clientes_com_ltv TO anon; -- (Opcional, mas evita erros de pre-flight as vezes)

-- Se houver outras views, repetimos:
-- GRANT SELECT ON nome_da_view TO authenticated;

-- Reforçar acesso às tabelas base também, só para garantir
GRANT SELECT, INSERT, UPDATE, DELETE ON clientes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON projetos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON agendamentos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON assistants TO authenticated;
