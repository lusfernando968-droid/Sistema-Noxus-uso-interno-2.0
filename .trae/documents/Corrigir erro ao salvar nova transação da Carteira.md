## Problema
Ao salvar uma nova transação na Carteira, surge o erro: `financeiroTattooSchema is not defined`.

## Causa
No hook `useCarteira`, a função `insert` usa um schema inexistente: `financeiroTattooSchema.parse(payload)` em `src/hooks/useCarteira.ts:74`. O schema correto já definido no arquivo é `carteiraSchema`.

## Plano de Correção
1. Alterar a linha `const parsed = financeiroTattooSchema.parse(payload);` para `const parsed = carteiraSchema.parse(payload);` em `src/hooks/useCarteira.ts`.
2. Conferir se não há outras referências a `financeiroTattooSchema` no repositório (já verificado: apenas essa ocorrência).
3. Testar o fluxo: abrir Carteira → “Adicionar” → preencher e salvar, confirmando que o registro é inserido sem erro e a UI atualiza corretamente.
4. Manter Zod validando o payload e os campos opcionais (`agendamento_id`, `data_liquidacao`, `conta_id`) tratados como `null` quando vazios.

## Validação
- Inserção deve retornar `rows[0]` e atualizar `items` no estado.
- Falhas de validação devem exibir o toast com a mensagem de Zod (sem crash).

## Observações
- Não haverá alterações de banco ou tabela (`financeiro_tattoo` permanece).
- Categorias da Carteira já foram ajustadas previamente; não interferem no erro atual.

Quando aprovar, aplico a correção e verifico no dev server.