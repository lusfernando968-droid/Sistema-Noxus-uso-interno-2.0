## Diagnóstico Atual
- Modal de transação já permite escolher a conta: `src/pages/Financeiro.tsx:618–637` (`Select` para `conta_id`).
- O saldo geral e filtros funcionam; o saldo no topo considera apenas liquidadas: `src/pages/Financeiro.tsx:321–337`.
- Existe widget para saldos por conta (`BankBalanceWidget`) que soma por `conta_id`, mas hoje calcula sem filtrar por liquidação: `src/components/financeiro/BankBalanceWidget.tsx:31–34`.
- A tabela `transacoes` possui `conta_id` (FK) e é utilizada para salvar e listar transações: `supabase/migrations/20251029093914_*.sql`, `20251112124500_add_conta_id_to_transacoes.sql`, e no código: `src/pages/Financeiro.tsx:145–165, 215–227`.

## Objetivo
- No fluxo geral, ao abrir “Nova transação”, exibir: (1) lista das contas já cadastradas; (2) saldo atual da conta selecionada; (3) preview do saldo pós-transação (adicionar se for receita, descontar se for despesa).
- Ao salvar, o banco deve refletir a nova transação. Se a transação for marcada como “liquidar agora”, o saldo muda imediatamente; se for “liquidar no futuro”, muda apenas quando liquidar.

## Perguntas de Esclarecimento
1. O “saldo atual” deve considerar só transações liquidadas, correto?
2. Para o saldo “pós-transação”, devemos aplicar o valor apenas quando “liquidar agora” estiver ativo?
3. Se o usuário editar/excluir transações, o saldo deve recalcular automaticamente (com base nos dados atuais)?
4. Onde exatamente mostrar o saldo na UI: abaixo do seletor de conta ou numa faixa dedicada à direita?
5. Deseja ver também “saldo inicial” da conta separadamente do “saldo atual” calculado?
6. No seu ambiente, a tabela consultada permanece `transacoes` (não renomeada para `financeiro_tattoo`), certo?

## Plano Técnico
### Backend (Supabase)
- Não alterar DDL. Manter cálculo de saldo como agregação: `saldo_atual = saldo_inicial + receitas_liquidadas − despesas_liquidadas` por `conta_id`.
- Opcional futuro: criar view ou função RPC para retornar saldo por conta, melhorando desempenho.

### Frontend
1. Calcular saldo da conta selecionada:
   - Criar util/hook `calcularSaldoConta(contaId, transacoes, contas)` que:
     - Busca `saldo_inicial` da conta (`useContasBancarias`);
     - Soma apenas transações com `conta_id`=contaId e `data_liquidacao` definida;
     - Retorna `{saldoInicial, entradas, saídas, saldoAtual}`.
2. Mostrar no modal:
   - Abaixo do `Select` de conta, exibir três linhas: `Saldo inicial`, `Saldo atual`, `Saldo pós-transação`.
   - `Saldo pós-transação = saldoAtual + valor` se `tipo='RECEITA'` e `liquidarFuturo=false`; `saldoAtual - valor` se `tipo='DESPESA'` e `liquidarFuturo=false`.
   - Se `liquidarFuturo=true`, mostrar badge “não impacta agora”.
3. Atualização em tempo real:
   - Após `insert/update/delete` de transações, reaproveitar o `fetchTransacoes()` já existente (`src/pages/Financeiro.tsx:140–165, 245–247`), que atualiza o saldo calculado sem persistir em `contas_bancarias`.
4. Ajustes no `BankBalanceWidget`:
   - Atualizar o cálculo para considerar apenas liquidadas tanto no `saldoAtual` quanto na variação mensal.
   - Reaproveitar o mesmo util/hook para manter consistência.
5. Experiência de usuário:
   - Exibir aviso se nenhuma conta estiver selecionada e desabilitar a prévia.
   - Manter “Nenhuma conta” como opção, mas sem preview.

## Validação
- Criar/editar transações com `liquidar agora` em uma conta e verificar:
  - O preview mostra o impacto correto antes de salvar.
  - Após salvar, `fetchTransacoes` atualiza o saldo; o widget/banco mostra variação consistente.
- Testar também transações “no futuro” e liquidação posterior para confirmar atualização do saldo.

## Entregáveis
- Hook/util de cálculo de saldo por conta.
- UI no modal com saldo atual e saldo pós-transação.
- Ajustes no `BankBalanceWidget` para refletir liquidação.

## Ideias de Melhoria
- Adicionar um pequeno gráfico Sparkline por conta no widget.
- Criar filtros por conta na lista e calendário já existentes (há estrutura pronta em `Financeiro.tsx`).
- Adicionar badge de banco/conta nas linhas de transação.
- Expor visão “Caixa por banco” também no topo da página Financeiro.

Confirma este plano? Posso seguir para implementar no frontend e validar o cálculo/UX.