## Perguntas de esclarecimento
- A rota raiz deve ser `"/" → Nexus` e o dashboard antigo (`Index`) mover para `"/noxus"`? (alternativas: `"/dashboard"`)
- O botão “NOXUS” no Header deve apontar para o dashboard antigo (`Index`) ou para a home `Nexus`? (recomendo: “Nexus” → `/`, “NOXUS” → `/noxus`).
- Em “Financeiro”, qual página deseja destacar dentro da Nexus: `"/financeiro"` (geral) ou `"/tattoo/financeiro"` (específica)?
- Deseja que os atalhos dentro da Nexus sejam cards clicáveis com breve descrição ou apenas botões?
- Manteremos `/tattoo` como alias com redirecionamento para `/` por compatibilidade?

## Contexto atual (referências)
- `src/App.tsx:32` — `"/"` → `Index`.
- `src/App.tsx:34` — `"/tattoo"` → `Tattoo` (Nexus).
- `src/components/layout/Header.tsx:29` — botão “NOXUS” aponta para `/`.
- `src/components/layout/Header.tsx:32` — botão “Nexus” aponta para `/tattoo`.
- `src/pages/Tattoo.tsx:28` — botão “Ir para Dashboard” navega para `/`.

## Plano de ação
1. Tornar Nexus a página inicial
   - Em `src/App.tsx`, alterar a rota raiz `"/"` para renderizar `Tattoo` (Nexus).
   - Mover o dashboard `Index` para nova rota (`"/noxus"`).
   - Adicionar redirecionamento de `"/tattoo"` → `"/"` para compatibilidade.
2. Ajustar navegação no Header
   - Trocar o link do botão “Nexus” para `"/"` (home).
   - Trocar o botão “NOXUS” para apontar à nova rota (`"/noxus"`).
3. Agregar atalhos dentro da Nexus
   - Em `src/pages/Tattoo.tsx`, substituir o botão “Ir para Dashboard” por um grid de cards/botões para:
     - `NOXUS` → `"/noxus"`
     - `Financeiro` → `"/financeiro"` (ou `"/tattoo/financeiro"`, conforme resposta)
     - `Conhecimento` → `"/conhecimento"`
4. Verificação
   - Rodar em dev e validar navegação: home abre `Nexus`, atalhos funcionam, Header atualizado.
   - Conferir que `Layout` continua ocultando o Dock quando necessário (`/tattoo/financeiro`).

## Validação técnica
- Smoke test manual navegando por `"/"`, `"/noxus"`, `"/financeiro"`, `"/conhecimento"` e verificando HMR.
- Checar ausência de erros no console e rotas quebradas.

## Impacto e melhorias
- Alteração simples de rotas e rótulos com baixo risco.
- Sugestões:
  - Centralizar rotas e rótulos em um `menuConfig` único para Header/Sidebar/Dock.
  - Adicionar `Navigate` para aliases (`/tattoo` → `/`).
  - Criar testes de navegação básicos para as rotas principais.
  - Introduzir i18n/constantes para textos de UI.

Aprovando, eu implemento as etapas 1–3 e entrego com verificação.