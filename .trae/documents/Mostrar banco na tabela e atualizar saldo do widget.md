## Objetivo
- Exibir o nome da conta/banco selecionado na tabela da Carteira.
- Fazer o widget de saldo do banco refletir imediatamente as movimentações da Carteira.

## Mudanças
1) CarteiraTable
- Adicionar coluna "Banco" na tabela e exibir `contas.find(...).nome` baseado em `row.conta_id`.
- Incluir controle "Liquidar agora" (Switch) no modal:
  - Default: ligado (true) quando há conta selecionada.
  - Se ligado, definir `data_liquidacao` com a data de hoje ao salvar; caso contrário, manter `null`.
  - Atualizar o preview (saldo pós-transação) para usar o estado do switch.

2) Carteira page (`src/pages/Carteira.tsx`)
- Usar `useCarteira()` e passar `items` como `transacoes` para `BankBalanceWidget`.
- Remover o fetch manual de `transacoes` de `public.transacoes`. Assim o widget usa os itens da Carteira com realtime.

## Validação
- Inserir transação com conta selecionada e "Liquidar agora" ligado: widget deve refletir imediatamente.
- Inserir transação sem liquidar: widget não altera o saldo atual (apenas previsão no modal muda).
- Tabela passa a mostrar a coluna "Banco" com o nome da conta.

## Observações
- Não altera schema de banco; apenas ajusta UI e fonte de dados do widget.
- Mantém consistência com util `calcularSaldoConta` (usa transações liquidadas).

Aprovando, aplico as mudanças e verifico no dev server.