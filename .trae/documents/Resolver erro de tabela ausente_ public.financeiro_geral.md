## Diagnóstico
- O erro "Could not find the table 'public.financeiro_geral' in the schema cache" vem do PostgREST (usado pelo Supabase) indicando que a tabela não existe no banco-alvo ou o cache de schema não foi atualizado.
- O front chama `financeiro_geral` em `src/hooks/useFinanceiroGeral.ts:86` para inserir e em `src/components/debug/FinanceiroGeralTests.tsx:26-41` já trata explicitamente esse erro.
- Há uma migração pronta em `supabase/migrations/20251112090000_create_financeiro_geral.sql` que cria a tabela, políticas RLS e índices.
- O cliente Supabase usa `VITE_SUPABASE_LOCAL_URL`/`VITE_SUPABASE_LOCAL_ANON_KEY` se definidos, caso contrário `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (`src/integrations/supabase/client.ts:4-18`, `src/integrations/supabase/local.ts:3-18`).

## Perguntas de Esclarecimento
1. Você está testando contra Supabase Cloud (`VITE_SUPABASE_URL`) ou um Supabase local (`VITE_SUPABASE_LOCAL_URL`)?
2. As migrações do diretório `supabase/migrations` já foram aplicadas ao banco alvo deste ambiente?
3. A tabela foi criada recentemente e o erro persiste mesmo após alguns minutos (indicando cache não recarregado)?
4. O projeto tem outras tabelas acessíveis via PostgREST neste mesmo ambiente (confirmando que o schema `public` está exposto)?
5. Há algum uso de múltiplos schemas além de `public` que possa ter criado a tabela em outro schema ou com outro nome?

## Plano de Ação
### 1) Validar ambiente ativo
- Conferir qual cliente está em uso: se `VITE_SUPABASE_LOCAL_URL` e `VITE_SUPABASE_LOCAL_ANON_KEY` estão definidos, o app usa o local, caso contrário usa Cloud.
- Verificar se as chaves/URL apontam para o projeto correto.

### 2) Verificar existência da tabela e políticas
- Rodar no SQL do Supabase: `select to_regclass('public.financeiro_geral');` — deve retornar `public.financeiro_geral`.
- Se retornar `NULL`, a tabela não existe no banco alvo.
- Listar políticas: `select polname from pg_policies where schemaname='public' and tablename='financeiro_geral';` — deve listar 4 políticas (SELECT/INSERT/UPDATE/DELETE).

### 3) Aplicar migrações (se faltarem)
- Opção A (CLI): usar "db push" para aplicar as migrações pendentes do diretório local para o banco remoto/local.
- Opção B (SQL Editor): copiar e executar o conteúdo de `supabase/migrations/20251112090000_create_financeiro_geral.sql` diretamente no banco alvo.
- Confirmar que a trigger `update_financeiro_geral_updated_at` existe e que a função `public.update_updated_at_column()` já está presente (padrão em projetos Supabase; se faltar, criar ou remover a trigger temporariamente).

### 4) Recarregar o cache de schema do PostgREST
- Executar: `NOTIFY pgrst, 'reload schema';` (canal correto nas versões atuais) para forçar o refresh do cache.
- Alternativamente, reiniciar o serviço de API na dashboard do Supabase.

### 5) Revalidar do lado do app
- Abrir o componente de debug e clicar em "Executar testes": `src/components/debug/FinanceiroGeralTests.tsx:95`.
- Esperar passar pelos passos: `select id`, `insert`, `select *`, `delete` com sucesso.
- Testar a criação real pelo formulário que gerou o erro para confirmar resolução.

### 6) Endurecer a detecção de ambiente e mensagens
- Se desejar, adicionar uma verificação visual de ambiente ativo (Cloud vs Local) e o projeto/URL atual, para evitar apontar para um projeto sem as migrações.
- Opcional: ao detectar o erro de schema, exibir instruções com o ambiente alvo atual.

## Validação
- Sucesso quando: `to_regclass` retorna a tabela, políticas visíveis, `FinanceiroGeralTests` insere/consulta/deleta sem erros, e o formulário cria registros sem a notificação de erro.

## Riscos e Mitigação
- Trigger depende da função `update_updated_at_column`: se não existir, criar função padrão ou remover a trigger temporariamente.
- Políticas RLS incorretas podem bloquear `INSERT`: garantir `auth.uid() = user_id` e que o usuário está autenticado.
- Usar o ambiente errado: sempre conferir qual URL/Key está ativa antes de aplicar migração.

## Ideias de Melhoria
- Adicionar uma página de "Saúde do Banco" em dev que execute `to_regclass` para tabelas críticas e mostre status.
- Incluir indicador de versão de migração aplicada com um check simples.
- Adicionar botão "Forçar refresh de schema" (executa `NOTIFY pgrst, 'reload schema';`) apenas em ambientes de dev.
- Logar o ambiente ativo (Cloud/Local) e projeto de forma clara na UI de debug.
- Criar testes e2e mínimos para o fluxo de inserção/consulta/exclusão em `financeiro_geral`.

## Próximo Passo
- Confirme o plano e informe em qual ambiente devemos atuar (Cloud ou Local). Vou aplicar as verificações e executar a correção seguindo as etapas acima.