## Objetivo
Padronizar a página e artefatos associados à “Financeiro Tattoo” para “Carteira”, evitando confusão com a página “Financeiro”.

## Perguntas de Esclarecimento
1. Confirmamos que a rota desejada para a nova página deve ser `"/carteira"`? (substituindo `"/tattoo/financeiro"`).
2. A aba dentro do Noxus deve chamar “Carteira” e usar o valor `carteira` para deep-linking?
3. Componentes compartilhados (ex.: `BankBalanceWidget`, `TabelaGestaoBancos`) podem manter nomes genéricos ou também devem ser renomeados?
4. Deseja manter a página “Financeiro” (`/financeiro`) intacta, com seus próprios nomes e componentes?
5. Precisa de redirects temporários de `"/tattoo/financeiro"` → `"/carteira"` para não quebrar links existentes?

## Escopo de Renomeação
- Página e rota:
  - `src/pages/TattooFinanceiro.tsx` → `src/pages/Carteira.tsx`.
  - Títulos e textos internos: “Financeiro” → “Carteira”.
  - Rota: `"/tattoo/financeiro"` → `"/carteira"`.
- Navegação e tabs:
  - `src/pages/Index.tsx`: aba “Financeiro Tattoo” → “Carteira”, `value="carteira"`.
  - `src/components/layout/Header.tsx`: botão “Financeiro” → “Carteira” com link `"/carteira"`.
  - Opcional: `DockNav` se houver item; hoje não há para `TattooFinanceiro`, então apenas manter.
- Componentes específicos da página:
  - `src/components/financeiro/FinanceiroTattooTable.tsx` → `src/components/carteira/CarteiraTable.tsx`.
  - `src/components/financeiro/RelatoriosFinanceiros.tsx` → `src/components/carteira/RelatoriosCarteira.tsx`.
  - `src/components/financeiro/DockFinanceiro.tsx` → `src/components/carteira/DockCarteira.tsx`.
  - Ajustar imports na nova página `Carteira.tsx`.
- Hooks utilizados:
  - `src/hooks/useFinanceiroTattoo.ts` → `src/hooks/useCarteira.ts` (mesma API), atualizar imports na `CarteiraTable`.
  - Manter demais hooks genéricos inalterados.
- Compatibilidade:
  - Opcionalmente criar re-exports temporários (ex.: `financeiro/index.ts` reexportando de `carteira`) para não quebrar referências legadas, se necessário.

## Passos Técnicos
1. Renomear arquivo e componente principal:
   - Mover `TattooFinanceiro.tsx` → `Carteira.tsx` e alterar o título do documento e cabeçalho para “Carteira”.
2. Atualizar rotas em `src/App.tsx`:
   - Remover/atualizar rota `"/tattoo/financeiro"` para `"/carteira"` usando `<Carteira />`.
   - (Opcional) Adicionar `<Navigate from="/tattoo/financeiro" to="/carteira" replace />` para compatibilidade.
3. Atualizar `Header.tsx`:
   - Alterar botão e link de “Financeiro” para “Carteira” com path `"/carteira"`.
4. Atualizar Noxus (`Index.tsx`):
   - Importar `Carteira`.
   - Alterar `TabsTrigger` texto para “Carteira” e `value="carteira"`.
   - Alterar `TabsContent` correspondente para renderizar `<Carteira />`.
5. Renomear componentes específicos e ajustar imports:
   - `FinanceiroTattooTable` → `CarteiraTable`.
   - `RelatoriosFinanceiros` → `RelatoriosCarteira`.
   - `DockFinanceiro` → `DockCarteira`.
   - Ajustar referências em `Carteira.tsx`.
6. Renomear hook:
   - `useFinanceiroTattoo` → `useCarteira` mantendo a mesma API e validadores.
   - Atualizar import em `CarteiraTable` e onde mais for usado.

## Validação
- Rodar o projeto e acessar `"/carteira"` e `"/noxus"` → aba “Carteira”.
- Verificar carregamento de transações e contas, abertura de diálogos e funcionalidades do dock.
- Confirmar que `/financeiro` continua funcionando intacto.
- Testar que links do header estão consistentes e não há erros de import.

## Melhorias Futuras
- Adicionar deep-linking para aba `"/noxus?tab=carteira"`.
- Criar um índice de re-exports para reduzir churn em renomeações futuras.
- Unificar texto e ícones em um design system para evitar divergência de nomenclatura.
- Refatorar validações em `useCarteira` com zod compartilhado para reuso.
- Adicionar testes de navegação e render para garantir estabilidade após renomeações.

## Próximo Passo
Aprovar este plano para eu executar a renomeação completa, atualizar rotas, abas e imports sem quebrar a página “Financeiro” existente.