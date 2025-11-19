## Perguntas de esclarecimento
- Escopo: deseja renomear apenas o rótulo da aba no topo e o título do cartão da página, ou também qualquer outro lugar onde “Minha Página” apareça?
- Título: prefere “Nexus NOXUS” (mantendo o sufixo) ou apenas “Nexus” no cabeçalho da página?
- Rotas: o caminho `"/tattoo"` permanece como está ou deve ser alterado para `"/nexus"`? (Se sim, atualizaremos todos os links e adicionaremos redirecionamento.)
- Sidebar/Dock: confirmar que não há itens chamados “Minha Página” nesses menus (atual busca indica que não há, apenas no Header).
- Traduções: há alguma camada de i18n/constantes a considerar, ou podemos manter strings diretas por enquanto?

## Onde alterar (referências exatas)
- `src/components/layout/Header.tsx:32` — botão da navegação superior: alterar o texto de `Minha Página` para `Nexus`.
- `src/pages/Tattoo.tsx:17` — título do card principal: alterar `Minha Página NOXUS` para o desejado (ex.: `Nexus`).

## Plano de ação
1. Atualizar rótulo no topo
   - Em `Header.tsx:32`, trocar `Minha Página` por `Nexus`.
2. Atualizar título da página
   - Em `Tattoo.tsx:17`, trocar `Minha Página NOXUS` por `Nexus` (ou `Nexus NOXUS`, conforme resposta).
3. Revisão visual e verificação
   - Rodar o app em dev e validar que o pill de navegação e o título exibem “Nexus”.
   - Conferir se não há regressões nas rotas (`/tattoo`) e links relacionados.
4. (Opcional, caso aprove): Renomear rota
   - Alterar `App.tsx` de `"/tattoo"` para `"/nexus"`, atualizar todos os `Link to`, e criar redirecionamento de `"/tattoo"` → `"/nexus"`.

## Validação
- Navegar para a página atual e confirmar visualmente o novo rótulo e título.
- Checar console e navegação para garantir ausência de erros.

## Impacto e melhorias
- Pequeno impacto, apenas strings exibidas; não altera estado ou dados.
- Sugestões:
  - Centralizar rótulos em um arquivo de constantes/i18n para facilitar futuras renomeações.
  - Padronizar nomes de rotas e componentes (ex.: alinhar `Tattoo` com “Nexus” se houver mudança de rota).
  - Criar testes de snapshot para pegas regressões em textos de UI.
  - Adotar um config de navegação único (menu schema) para sincronizar Header/Sidebar/Dock.

Se confirmar, executo os passos 1–3 imediatamente; se desejar o passo opcional 4 (rota), eu incluo também.