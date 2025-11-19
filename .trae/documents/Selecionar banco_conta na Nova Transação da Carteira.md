## Objetivo
Adicionar ao modal "Nova transação" da Carteira um seletor de conta bancária (dos bancos já cadastrados) e exibir o saldo atual da conta selecionada e a projeção pós-transação conforme o valor e o tipo informados.

## Contexto no Código
- Modal atual: `src/components/carteira/CarteiraTable.tsx:113-162`
- Schema e campo existente para conta: `conta_id` já previsto no formulário (`src/components/carteira/CarteiraTable.tsx:21-22,49-50,76-77`) e no hook (`src/hooks/useCarteira.ts:18-21,71-86`).
- Contas e bancos: hook `useContasBancarias` (`src/hooks/useContasBancarias.ts`) retorna `items` com join `banco_detalhes`.
- Cálculo de saldo: util `calcularSaldoConta` e `saldoPosTransacao` em `src/utils/saldoPorConta.ts:12-53`.

## Implementação
1. Importar `useContasBancarias`, `calcularSaldoConta` e `saldoPosTransacao` em `CarteiraTable`.
2. Carregar `contas` com `useContasBancarias()` e exibir um `Select` para `form.conta_id`:
   - Opções: `Nenhuma conta` + lista de `contas` com rótulo `conta.nome` (opcional: incluir `banco_detalhes.nome_curto`).
3. Ao selecionar `conta_id`, renderizar um bloco de resumo com:
   - `Saldo inicial` e `Saldo atual` via `calcularSaldoConta(form.conta_id, contas, items)`.
   - `Saldo pós-transação` via `saldoPosTransacao(saldoAtual, tipoPreview, valor, true)`, onde `tipoPreview` mapeia `'RECEITA'|'DESPESA'` para `'receita'|'despesa'`.
4. Persistência: garantir que `onSubmit` já envia `conta_id` (já implementado em `src/components/carteira/CarteiraTable.tsx:90-91`).
5. UX/Posicionamento:
   - Inserir o campo "Conta" logo abaixo do primeiro grid (Tipo/Valor/Vencimento), antes de Categoria/Descrição.
   - Mostrar o resumo de saldo somente quando houver uma conta selecionada.
6. Validações e estados:
   - Manter opção `""` para "Nenhuma conta" (transação não afeta saldo de contas).
   - Não listar contas arquivadas (hook já filtra por padrão).

## Verificação
- Selecionar diferentes contas deve atualizar imediatamente os saldos exibidos.
- Saldo atual calcula: `saldo_inicial + receitas/entradas liquidadas - despesas/saídas liquidadas` da própria Carteira.
- Inserção/edição mantém `conta_id` e não quebra o schema Zod.

## Manutenibilidade e Escalabilidade
- Reuso de utilitários e do hook existente evita duplicação e mantém lógica centralizada.
- Se o modal crescer, extrair o bloco de "Resumo de saldo" para um componente reutilizável entre Carteira e Financeiro.

## Próximos Passos
- Implementar as mudanças acima em `CarteiraTable`.
- Testar com pelo menos duas contas e transações de ambos os tipos.