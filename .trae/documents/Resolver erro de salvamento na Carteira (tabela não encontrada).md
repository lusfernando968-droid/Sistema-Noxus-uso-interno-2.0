## Erro
Toast: "Could not find the table 'public.financeiro_tattoo' in the schema cache" ao salvar em Carteira.

## Causa provável
- A tabela `public.financeiro_tattoo` não existe no ambiente ativo ou o PostgREST não recarregou o schema após migrations.
- O hook `useCarteira` usa `.from("financeiro_tattoo")` para `fetch/insert/update/delete`.

## Perguntas
1. Você está usando Supabase local (CLI) ou o projeto na nuvem? (o código alterna por `isSupabaseLocalConfigured`).
2. As migrations foram rodadas no ambiente atual? Especialmente `20251112170000_rename_transacoes_to_financeiro_tattoo_and_sync.sql`.
3. A tabela antiga `public.transacoes` ainda existe nesse banco?
4. A tabela `public.financeiro_geral` existe e está populada no mesmo ambiente?
5. Você prefere corrigir o ambiente (recarregar schema/aplicar migrations) ou aplicar um hotfix no código apontando provisoriamente para `financeiro_geral`?
6. Tem como reiniciar os serviços do Supabase dev agora? (para recarregar o schema).

## Plano de Ação
1. Verificar ambiente em uso (local vs nuvem) e checar existência das tabelas:
   - No SQL Editor: `select tablename from pg_tables where schemaname='public' and tablename in ('financeiro_tattoo','transacoes','financeiro_geral');`
2. Se `financeiro_tattoo` existir mas continuar o erro, recarregar schema do PostgREST:
   - `select pg_notify('pgrst', 'reload schema');` ou reiniciar o Supabase (CLI: `supabase stop && supabase start`).
3. Se `financeiro_tattoo` não existir:
   - Aplicar migrations pendentes; no dev (CLI): `supabase db reset` ou `supabase db push`.
   - Alternativamente, rodar somente a migration `20251112170000_rename_transacoes_to_financeiro_tattoo_and_sync.sql`.
4. Testar o salvamento no modal da Carteira após recarregar.
5. Hotfix opcional (se necessário e aprovado): alterar `useCarteira` para usar `financeiro_geral` até que o ambiente reconheça `financeiro_tattoo`.

## Validação
- Inserção retorna `rows[0]` e atualiza `items` em tempo real.
- Nenhum erro de schema; toast de sucesso exibido.
- Confirmar que o saldo preview continua correto.

## Observações
- Evito mudanças no modelo de dados; priorizo corrigir ambiente/schema. Hotfix de tabela só será aplicado se você preferir e confirmar.