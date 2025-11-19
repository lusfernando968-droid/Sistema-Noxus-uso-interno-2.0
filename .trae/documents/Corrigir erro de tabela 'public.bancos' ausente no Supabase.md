## Perguntas de Clarificação
1. Confirmo que deseja usar o projeto Supabase configurado em `.env` (`VITE_SUPABASE_URL=fplfjqttuvawzachfnob.supabase.co`)?
2. Está trabalhando em produção ou em uma branch de desenvolvimento do Supabase? Qual?
3. Posso aplicar todas as migrações relacionadas a `bancos` e `contas_bancarias` presentes em `supabase/migrations` na ordem cronológica?
4. Deseja que eu regenere os tipos TypeScript do Supabase (`src/integrations/supabase/types.ts`) após aplicar as migrações?
5. Quer manter permissões de escrita em `bancos` para usuários `authenticated` ou restringir apenas leitura?
6. Algum dado existente de contas deve ser migrado do campo leg. `banco` para `banco_id` (migração já prevê isso)?

## Diagnóstico (Resultado da Pesquisa)
- O app consulta `public.bancos` diretamente em `TabelaGestaoBancos.tsx` e via join em `useContasBancarias`.
- O erro indica que o projeto Supabase atual não possui a tabela `public.bancos` aplicada na schema (ou o cache não está atualizado).
- Há migrações locais para criar `public.bancos` e relacionar `public.contas_bancarias` (FK, índices, view `contas_bancarias_completas`).

## Plano de Correção
1. Identificar projeto Supabase ativo e seu `project_id` com base no `.env`.
2. Verificar e aplicar migrações em ordem:
   - `20251113120000_create_bancos_table.sql`
   - `20251113130000_fix_bancos_permissions.sql`
   - `20251113131000_fix_bancos_structure.sql`
   - `20251112123000_create_contas_bancarias.sql` (se ainda não aplicada)
   - `20251113120100_update_contas_bancarias_add_banco_id.sql`
   - `20251113200000_add_bancos_digitais.sql`
3. Forçar atualização do schema cache do PostgREST (normalmente automática após DDL; caso necessário, revalidar via endpoint/console).
4. Regenerar tipos TypeScript do Supabase para incluir `bancos`/`contas_bancarias`.
5. Validar no app:
   - Abrir `Financeiro`/`TattooFinanceiro` e `TabelaGestaoBancos`.
   - Confirmar que `SimpleSelect` lista bancos e inserção/edição funciona.
6. Documentar o resultado e links de verificação.

## Critérios de Pronto
- `public.bancos` e `public.contas_bancarias` existentes no banco com índices e permissões corretas.
- UI carrega bancos sem erro; inserção de banco/conta funciona para usuário autenticado.
- Tipos TS atualizados e sem erros de compilação.

## Resumo Elegante (para Notion)
- Problema: Tabela `public.bancos` ausente no schema (erro de cache do Supabase)
- Ação: Aplicar migrações de `bancos`/`contas_bancarias`; atualizar cache; regenerar tipos
- Validação: UI de `Financeiro`/`TattooFinanceiro` funcionando com listagem e CRUD de bancos/contas

## Ideias de Melhoria
- Adicionar health-check SQL leve antes de queries críticas; ex.: verificar existência de tabela e exibir mensagem guiada.
- Criar `useBancos` isolado com cache (React Query) e fallback sem quebrar UI.
- Automatizar geração de tipos TS via script pós-migração em dev.
- Seed idempotente de bancos apenas em dev/test; produção controlada por migrações.
- Alertar visualmente na UI quando faltar estrutura (política de migração pendente) com CTA para docs/ajuda.