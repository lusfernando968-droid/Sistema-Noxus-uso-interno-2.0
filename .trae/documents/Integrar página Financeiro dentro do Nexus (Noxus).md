## Descobertas
- Existem duas páginas de financeiro:
  - `src/pages/Financeiro.tsx` (gestão completa, 988 linhas), rota `"/financeiro"` (App.tsx:36).
  - `src/pages/TattooFinanceiro.tsx` (financeiro com tabs: Despesas, Relatórios, Bancos), rota `"/tattoo/financeiro"` (App.tsx:31).
- O "Nexus" corresponde à página inicial do estúdio em `src/pages/Tattoo.tsx`, carregada em `"/"` (App.tsx:30). O "NOXUS" é o dashboard com abas em `src/pages/Index.tsx` acessível por `"/noxus"` (App.tsx:39).
- O Noxus já possui uma aba "Finance" com análises (`src/components/dashboard/FinanceTab.tsx`) dentro de `Index.tsx` (Index.tsx:139–156).

## Perguntas de Esclarecimento
1. Quando você diz “a outra página de financeiro”, quer integrar a `Financeiro` (`/financeiro`) ou a `TattooFinanceiro` (`/tattoo/financeiro`)?
2. Você quer que apareça dentro do Noxus (`/noxus`, com abas) ou dentro da Home Nexus (`/`, página Tattoo.tsx)?
3. A experiência deve ser uma nova aba no Noxus (ex.: “Financeiro Tattoo”) ou substituir/expandir a aba "Finance" atual?
4. Deseja reaproveitar o componente inteiro (com cabeçalho e dock) ou uma versão compacta sem cabeçalho, mantendo o visual do Noxus?
5. Precisamos refletir o estado em URL (ex.: `?tab=financeiro-tattoo`) para deep-linking/compartilhamento?

## Plano Proposto (assumindo: integrar `TattooFinanceiro` dentro do Noxus como nova aba)
- Adicionar uma nova aba em `src/pages/Index.tsx` chamada "Financeiro Tattoo".
- Importar e renderizar `TattooFinanceiro` dentro de `TabsContent` do Noxus.
- Manter a aba "Finance" atual para insights; a nova aba foca em fluxos e registros.
- Preservar `ProtectedRoute` e layout existente; não alterar rotas globais.

## Passos Técnicos
1. `src/pages/Index.tsx`:
   - Importar `TattooFinanceiro`.
   - Adicionar `TabsTrigger value="financeiro-tattoo"` ao `TabsList`.
   - Adicionar `TabsContent value="financeiro-tattoo"` renderizando `<TattooFinanceiro />`.
   - Opcional: se houver duplicação de cabeçalhos, esconder o header interno via prop leve ou wrapper simples mantendo padrão visual (apenas se necessário).
2. Validar que consultas Supabase de `TattooFinanceiro` funcionam dentro do layout Noxus.
3. Testar navegação: `Header.tsx` já tem links para `/tattoo/financeiro` e `/financeiro` (Header.tsx:28–39). Não é obrigatório alterar.

## Validação
- Rodar o servidor dev e navegar até `"/noxus"`.
- Alternar para a aba "Financeiro Tattoo".
- Confirmar carregamento de contas e transações, interação dos diálogos e responsividade.
- Verificar que `DockFinanceiro` está funcional e que estilos não conflitam.

## Melhorias Futuras
- Unificar hooks de financeiro (`useFinanceiroTattoo` e geral) em um contexto para evitar duplicação.
- Adicionar deep-linking de abas (`/noxus?tab=financeiro-tattoo`) para compartilhar estado.
- Refatorar `Financeiro.tsx` em subcomponentes menores (988 linhas) para manutenibilidade.
- Cachear consultas com React Query para carregamento mais suave.
- Criar um "Resumo Financeiro" compacto para a aba "Finance" com atalho para ações rápidas.

## Solicitação de Aprovação
- Confirma se devemos integrar a página `TattooFinanceiro` dentro do Noxus como nova aba “Financeiro Tattoo”.
- Se preferir integrar a `Financeiro` em vez disso, eu ajusto o plano para renderizá-la no Noxus com o mesmo padrão de aba.