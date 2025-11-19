## Diagnóstico
- A página de Relatórios cai no ErrorBoundary que exibe “Algo deu errado” (`src/components/ui/error-boundary.tsx:58`).
- O componente `RelatoriosFinanceiros` usa campos inexistentes do hook: `stats.totalDespesas` e `stats.porCategoria` (`src/components/financeiro/RelatoriosFinanceiros.tsx:88, 110, 151`).
- O hook `useFinanceiroGeral` expõe `FinanceiroStats` com `totalEntradas`, `totalSaidas`, `saldo`, `porCategoriaEntradas`, `porCategoriaSaidas` (`src/hooks/useFinanceiroGeral.ts:41-47, 70`).
- Mismatch de contrato causa acesso a `undefined` e chamada de `.toFixed`, gerando exceção e ativando o boundary.

## Perguntas de Esclarecimento
1. “Total de Despesas” deve refletir somente saídas (`stats.totalSaidas`)?
2. A análise por categoria deve usar apenas despesas (`stats.porCategoriaSaidas`) ou quer ver entradas também?
3. Preferimos ajustar o componente para o contrato atual do hook ou adicionar aliases no hook para manter compatibilidade (`totalDespesas`/`porCategoria`)?
4. O relatório mensal exportado deve considerar somente despesas (tipo `saida`)? Hoje considera todos os itens.
5. Em ausência de dados, quer exibir zeros/placeholders em vez de erro? Deseja skeleton de carregamento?
6. Manter o formato `.txt` para exportação ou prefere `.csv` para uso em planilhas?

## Plano de Correção
1. Atualizar `RelatoriosFinanceiros` para usar os campos corretos do hook:
   - Substituir `stats.totalDespesas` por `stats.totalSaidas` nas métricas.
   - Substituir `stats.porCategoria` por `stats.porCategoriaSaidas` onde aplicável.
2. Adicionar null-safety e defaults:
   - Proteger chamadas a `.toFixed` com `Number(... || 0).toFixed(2)`.
   - Renderizar contagens com `Object.keys(stats?.porCategoriaSaidas || {}).length`.
3. Corrigir geração do relatório mensal:
   - Filtrar `items` por mês atual e `tipo === 'saida'` antes de somar.
   - Manter mapeamento de categorias e formato textual.
4. Melhorar UX/resiliência:
   - Exibir pequeno estado de carregamento quando `loading` for `true`.
   - Evitar queda no ErrorBoundary ao garantir guardas em todos cálculos.
5. Opcional: adicionar aliases no hook para compatibilidade futura:
   - Expor `totalDespesas = totalSaidas` e `porCategoria = porCategoriaSaidas` para evitar regressões em outras telas.

## Validação
- Acessar `"/tattoo/financeiro"` e abrir a aba “Relatórios” (`src/pages/TattooFinanceiro.tsx`).
- Confirmar que o card “Total de Despesas” e a lista “Análise por Categoria” renderizam sem erro, com valores consistentes.
- Testar exportação do relatório mensal e validar conteúdo filtrado por saídas.
- Verificar que o ErrorBoundary não é disparado; usar “Detalhes do erro (desenvolvimento)” para garantir ausência de exceções.

## Riscos e Mitigações
- Se outras telas dependem dos nomes antigos, preferir o alias no hook para compatibilidade.
- Dados com `valor` ou `categoria` inválidos: normalizar com `Number()` e fallback “Outros”.

## Resumo p/ Notion
- Problema: contrato quebrado entre `RelatoriosFinanceiros` e `useFinanceiroGeral`.
- Ação: alinhar campos para `totalSaidas`/`porCategoriaSaidas`, adicionar guardas e filtrar relatório por saídas.
- Validação: abrir aba Relatórios e exportar, sem ativar ErrorBoundary.

Confirme o plano para eu aplicar os ajustes e validar em seguida.