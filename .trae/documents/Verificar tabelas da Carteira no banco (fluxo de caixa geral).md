## Objetivo
Confirmar no banco se existem as tabelas usadas pela Carteira para salvar o fluxo de caixa geral.

## Perguntas
1. O ambiente em uso é Supabase local (CLI) ou um projeto na nuvem?
2. Qual projeto devemos inspecionar (nome/ID) se houver mais de um?
3. A Carteira deve salvar em `public.financeiro_tattoo` (atual) ou `public.financeiro_geral`?
4. Devemos validar também a tabela antiga `public.transacoes` (pré-rename)?
5. Quer que eu verifique RLS e colunas obrigatórias além da existência?

## Plano de Execução
1. Listar projetos Supabase e identificar o projeto alvo.
2. Executar queries de verificação no banco:
   - `select tablename from pg_tables where schemaname='public' and tablename in ('financeiro_tattoo','financeiro_geral','transacoes');`
   - Se existir, listar colunas com `select column_name,data_type,is_nullable from information_schema.columns where table_schema='public' and table_name='<tabela>';`.
   - Opcional: verificar RLS ativa com `select relname, relrowsecurity from pg_class where relname in ('financeiro_tattoo','financeiro_geral');`.
3. Relatar resultados e recomendar ações:
   - Se `financeiro_tattoo` não existir: aplicar migrations ou usar `financeiro_geral` como fallback.
   - Se existir mas não reconhecida: recarregar schema (`pg_notify('pgrst','reload schema')`).

## Entregáveis
- Confirmação da existência das tabelas e estrutura.
- Recomendações claras para corrigir divergências.

Aprovando, executo as consultas no projeto e retorno o diagnóstico detalhado.