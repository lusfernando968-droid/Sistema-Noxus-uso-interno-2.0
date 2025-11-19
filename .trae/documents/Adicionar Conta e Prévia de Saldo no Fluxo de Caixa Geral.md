## Objetivo
- Replicar a função de seleção de conta e prévia de saldo no botão “Adicionar” do Fluxo de caixa geral (Despesas Gerais), para que:
  - O usuário escolha a conta bancária vinculada.
  - Veja saldo inicial, saldo atual e saldo pós-transação antes de salvar.
  - Ao salvar, o saldo do banco seja impactado conforme o tipo (entrada/saída).

## Perguntas de Esclarecimento
1. As transações do Fluxo Geral devem impactar o saldo imediatamente (sem “liquidar no futuro”), correto?
2. Deseja manter a opção “Nenhuma conta” (sem impacto no saldo) disponível nesse formulário?
3. O widget de bancos deve considerar tanto transações do módulo Tattoo quanto as do Fluxo Geral, certo?
4. Podemos adicionar `conta_id` em `financeiro_geral` (FK para `contas_bancarias`) para persistir o vínculo?
5. A data usada para variação mensal no widget, para o Fluxo Geral, será `data` (timestamp do registro), ok?
6. Deseja exibir também a cor/nome curto do banco nas linhas para facilitar identificação?

## Plano Técnico
### Banco de Dados
- Adicionar coluna `conta_id UUID` em `public.financeiro_geral`, com FK para `public.contas_bancarias(id)` e índice `idx_financeiro_geral_conta_id`.
- Não alterar RLS além do que já existe; `conta_id` será opcional.

### Frontend
1. Tipos e hook:
   - Atualizar `FinanceiroGeralRecord` em `src/hooks/useFinanceiroGeral.ts` para incluir `conta_id?: string | null`.
   - Incluir `conta_id` no `schema` (opcional) e nos métodos `insert` e `update`.
2. Formulário (FinanceiroGeralTable):
   - Adicionar `Select` de `Conta` usando `useContasBancarias`.
   - Integrar util `calcularSaldoConta` e `saldoPosTransacao` para exibir: Saldo inicial, Saldo atual, Saldo pós-transação.
   - Como Fluxo Geral é imediato, aplicar impacto no preview sempre.
3. Widget de bancos:
   - Agregar saldos com base em duas fontes:
     - `transacoes` (apenas liquidadas) e
     - `financeiro_geral` (sempre consideradas “liquidadas”).
   - Reutilizar o util de saldo para manter consistência.
4. UX
   - Se nenhuma conta estiver selecionada, desabilitar a prévia e exibir aviso.
   - Mostrar badge do banco na linha da transação (opcional).

## Validação
- Criar uma entrada e uma saída no Fluxo Geral: verificar se o preview está correto e se o widget atualiza o saldo.
- Testar com “Nenhuma conta” para garantir que o saldo não muda.
- Conferir variação mensal no widget usando as datas dos registros.

## Entregáveis
- Migração com `conta_id` em `financeiro_geral`.
- Atualização do formulário e do hook para salvar `conta_id`.
- Prévia de saldo por conta no modal “Adicionar” do Fluxo Geral.
- Widget de bancos combinando as duas fontes.

## Ideias de Melhoria
- Filtro por conta nas tabelas de despesas gerais.
- Resumo por banco dentro da aba “Relatórios”.
- Sparkline de variação por conta no widget.
- RPC no Supabase para saldo por conta, melhorando performance.

Confirma este plano para eu implementar e validar?