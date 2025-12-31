-- O erro "Deadlock" aconteceu porque o sistema tentou mexer nas regras de segurança
-- enquanto o aplicativo estava aberto e usando as tabelas.

-- Solução Leve (Sem bloquear tabelas): Apenas liberar acesso (GRANT)
-- Isso não requer bloqueio exclusivo e deve passar sem erro.

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Garantir acesso específico nas views que estavam dando erro
GRANT SELECT ON clientes_com_ltv TO authenticated;

-- Se o erro 403 persistir, é porque o RLS ainda está ativo e bloqueando.
-- Nesse caso, precisaremos criar as policies UMA POR UMA para as tabelas essenciais,
-- em vez de fazer o loop em tudo (que causou o travamento).

-- Tente rodar apenas as linhas de GRANT acima primeiro.
-- Se continuar o erro, rode as linhas abaixo individualmente:

CREATE POLICY "Libera Geral Clientes" ON clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Libera Geral Projetos" ON projetos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Libera Geral Agendamentos" ON agendamentos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Libera Geral Sessoes" ON projeto_sessoes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Libera Geral Fotos" ON projeto_fotos FOR ALL USING (auth.role() = 'authenticated');
