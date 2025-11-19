## Perguntas de Confirmação
1. Você tem `Node` e `pnpm` instalados? Quais versões (`node -v`, `pnpm -v`)?
2. Deseja usar Supabase cloud (via `VITE_SUPABASE_URL`/`ANON_KEY`) ou o fallback local já configurado?
3. O arquivo `.env` está preenchido? Posso apenas validar sem alterar nada?
4. Preferimos manter um único servidor dev ativo; tudo bem?
5. A porta padrão `5173` pode ser usada? Se estiver ocupada, aceitamos porta automática?

## Passos de Execução
1. Validar ambiente: checar presença de `Node`/`pnpm` e confirmar `.env` sem mudanças.
2. Instalar dependências: executar `pnpm install` na raiz do projeto.
3. Iniciar servidor: executar `pnpm dev` (Vite). Manter somente um terminal servidor ativo.
4. Capturar URL de preview: identificar `http://localhost:5173/` (ou porta alternativa) e compartilhar.
5. Verificar rotas chave: `/`, `/tattoo`, `/tattoo/financeiro`, `/financeiro`, `/clientes`, `/projetos`, `/agendamentos` (sem alterar código).
6. Diagnóstico: se não subir, coletar logs do terminal, verificar porta ocupada e variáveis de ambiente, reportar e sugerir correções simples.

## Critérios de Pronto
- Dev server iniciado e acessível por URL local.
- Rotas principais abrem sem erro de runtime.
- Conexão ao Supabase válida (ou fallback local funcional) sem travar a UI.

## Resumo Elegante (para Notion)
- Objetivo: Subir app local e entregar URL de preview
- Comandos: `pnpm install` → `pnpm dev`
- Preview esperado: `http://localhost:5173/`
- Validações: rotas principais e ambiente Supabase

## Ideias de Melhoria
- Adicionar script `pnpm start` que referencia `pnpm dev` para padronizar.
- Precheck de `.env` em `predev` para mensagens amigáveis se faltar configuração.
- Expor rota `/health` devolvendo status do app e conexão ao Supabase.
- Habilitar React Query Devtools em `dev` para inspecionar cache/requisições.
- Logar a URL de preview também como notificação no UI ao iniciar em dev.