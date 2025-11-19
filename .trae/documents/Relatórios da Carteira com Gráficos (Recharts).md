## Perguntas de Esclarecimento
1. Período padrão dos relatórios: último mês, trimestre, ano ou customizável por intervalo?
2. Fontes a incluir: `financeiro_tattoo` (Carteira), `financeiro_geral`, `contas_bancarias`, `dividas`, `linhas_credito`, `patrimonio` — todas entram nos gráficos ou focamos primeiro em Carteira + Bancos?
3. Filtro por conta e por categoria é obrigatório nos gráficos? Deseja também filtro por forma de pagamento (pix, dinheiro, cartão)?
4. Exportações: precisa exportar imagem/PNG dos gráficos e CSV dos dados agregados?
5. Atualização em tempo real: os gráficos devem reagir à inserção/edição (Realtime) ou apenas em refresh manual?
6. Estilo: usar o visual atual do dashboard (cores e badges de banco) e o wrapper `src/components/ui/chart.tsx`?

## Visão Geral
- Criar a aba “Relatórios” da Carteira com múltiplos gráficos interativos usando `recharts`, reaproveitando dados e agregações existentes.
- Centralizar filtros de período, conta, tipo (receita/saída) e categoria; aplicar aos gráficos e às métricas resumo.

## Fontes de Dados
- `useCarteira` (tabela `financeiro_tattoo`): receitas/saídas, categorias, datas de liquidação/vencimento, `conta_id`.
- `useContasBancarias`: nome das contas e saldos/calculados via `saldoPorConta.ts`.
- (Opcional) `useFinanceiroGeral`: entradas/saídas genéricas por categoria.
- (Opcional) `useDividas`, `useLinhasCredito`, `usePatrimonio`: status, limites, composição de ativos.

## Gráficos Propostos
- Evolução mensal Receita vs Despesa (LineChart): soma por mês; período selecionável.
- Fluxo de Caixa Acumulado (AreaChart): saldo acumulado no período; base em `financeiro_tattoo`.
- Despesas por Categoria (BarChart/PieChart): top N categorias; toggle pizza/barras.
- Receita por Categoria (BarChart/PieChart): espelho da anterior.
- Saldo por Conta (BarChart): valores atuais por conta vinculada.
- Distribuição por Forma de Pagamento (PieChart): dinheiro, cartão, pix (se disponível).
- (Opcional) Dívidas por status e próximo vencimento (BarChart): de `useDividas`.
- (Opcional) Linhas de crédito: uso vs limite por instituição (BarChart/Stacked).
- (Opcional) Patrimônio por tipo (PieChart): ativos, equipamentos, etc.

## UX/Controles
- Barra de filtros: período (date range), conta(s), tipo (receita/saída), categoria(s).
- Cards de resumo: total receitas, total despesas, saldo líquido, variação vs período anterior.
- Tooltips e legenda padronizados usando `src/components/ui/chart.tsx`.
- Responsivo: grid com 2 colunas em `md`, 3 em `lg` e 4 em `xl`; gráficos compactos mantendo legibilidade.

## Implementação Técnica
- Criar `src/components/carteira/RelatoriosGraficos.tsx`: componente pai com filtros e renderização dos gráficos.
- Agregar dados: helpers memoizados que:
  - Filtram por período/conta/categoria/tipo.
  - Agrupam por mês (`startOfMonth`/`endOfMonth`), categoria, conta, forma de pagamento.
  - Calculam saldo acumulado a partir de receitas/saídas ordenadas por data.
- Reaproveitar `BankBalanceWidget` para saldo por conta, extraindo função utilitária se necessário.
- Usar `recharts` (já presente) e wrapper de chart com estilos.
- Integrar na página `src/pages/Carteira.tsx` (aba Relatórios): trocar componente atual `RelatoriosCarteira` (texto) por versão que inclui gráficos mantendo o bloco textual como seção adicional.

## Fases
### Fase 1: Base e Filtros
- Montar componente `RelatoriosGraficos` com filtros e carregamento dos dados da Carteira + Contas.
- Implementar agregadores (`useMemo`) para: por mês, por categoria, por conta, acumulado.

### Fase 2: Gráficos Principais
- Receita vs Despesa (LineChart) e Fluxo Acumulado (AreaChart).
- Despesas/Receitas por Categoria (Pie/Bar com toggle).

### Fase 3: Bancos e Forma de Pagamento
- Saldo por Conta (BarChart) e distribuição por forma de pagamento (Pie).

### Fase 4: Extras (Opcional)
- Dívidas, Linhas de crédito, Patrimônio — gráficos dedicados com respectivas fontes.
- Exportações CSV/PNG.

### Fase 5: Polimento
- Responsividade, legendas, tooltips, cores por banco/categoria.
- Cache/memoização e testes visuais.

## Critérios de Aceite
- Filtros aplicam consistentemente a todos os gráficos.
- Gráficos renderizam sem travamentos com grandes volumes.
- Responsivo e consistente com o tema atual.
- Dados batem com os totais da Carteira e dos resumos existentes.

Confirma seguir esse plano e quais itens opcionais incluir (dívidas, crédito, patrimônio)?