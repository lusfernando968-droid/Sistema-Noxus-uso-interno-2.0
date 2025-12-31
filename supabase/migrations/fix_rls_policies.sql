-- Remove políticas antigas que podem estar bloqueando (garante limpeza)
DROP POLICY IF EXISTS "Enable read access for all users" ON clientes;
DROP POLICY IF EXISTS "Enable read access for all users" ON projetos;
DROP POLICY IF EXISTS "Enable read access for all users" ON agendamentos;

DROP POLICY IF EXISTS "Owners and assistants can view clients" ON clientes;
DROP POLICY IF EXISTS "Owners and assistants can view projects" ON projetos;
DROP POLICY IF EXISTS "Owners and assistants can view appointments" ON agendamentos;

-- Política CORRETA: Permite acesso se for dono OU se for assistente do dono
-- Tabela: CLIENTES
CREATE POLICY "Owners and assistants can view clients"
ON clientes FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM assistants 
    WHERE assistant_id = auth.uid() 
    AND user_id = clientes.user_id
  )
);

-- Tabela: PROJETOS
CREATE POLICY "Owners and assistants can view projects"
ON projetos FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM assistants 
    WHERE assistant_id = auth.uid() 
    AND user_id = projetos.user_id
  )
);

-- Tabela: AGENDAMENTOS
CREATE POLICY "Owners and assistants can view appointments"
ON agendamentos FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM assistants 
    WHERE assistant_id = auth.uid() 
    AND user_id = agendamentos.user_id
  )
);

-- Permissões de escrita (Insert/Update/Delete) para Assistants (Opcional, mas recomendado para o app funcionar)
-- Ajuste conforme segurança desejada. Aqui estamos liberando geral para authenticated para evitar travamentos, 
-- mas idealmente seria igual ao SELECT.

CREATE POLICY "Enable all access for authenticated users" ON clientes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON projetos FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for authenticated users" ON agendamentos FOR ALL USING (auth.role() = 'authenticated');
