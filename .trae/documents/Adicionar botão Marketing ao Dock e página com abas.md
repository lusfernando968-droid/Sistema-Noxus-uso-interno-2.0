## Contexto
- Há um dock flutuante global em `src/components/layout/DockNav.tsx` com itens definidos em `menuItems`.
- Rotas são configuradas em `src/App.tsx` e páginas principais usam `Layout`.
- Padrão de abas está em `src/components/ui/tabs.tsx` com exemplos em `pages/Carteira.tsx` e `pages/Conhecimento.tsx`.

## Perguntas de Esclarecimento
1. O texto correto das abas é “Campanha”, “Branding”, “Produção de conteúdo” e “Anúncio”? Posso ajustar ortografia e acentuação?
2. O botão “Marketing” deve aparecer no dock global em todas as páginas ou apenas quando estiver na página Tattoo?
3. Em qual posição do dock você prefere o “Marketing”? Sugestão: após `Agendamentos` e antes de `Financeiro`.
4. A aba padrão ao abrir “Marketing” deve ser “Campanha”?
5. Há alguma restrição de acesso (roles) para a rota de Marketing, ou segue `ProtectedRoute` padrão?
6. Tem preferência de ícone para o botão “Marketing”? Sugestão: `Megaphone` (biblioteca atual de ícones).

## Plano de Implementação
### Fase 1: Rotas
- Adicionar a rota `"/marketing"` em `src/App.tsx` sob `ProtectedRoute`, renderizando `<Layout><Marketing /></Layout>`.

### Fase 2: Dock
- Incluir um item em `menuItems` de `src/components/layout/DockNav.tsx`:
  - `label: "Marketing"`, `path: "/marketing"`, `icon: Megaphone`.
- Garantir que `Layout.tsx` não oculte o dock para `"/marketing"` (ver `hideDockRoutes`).

### Fase 3: Página Marketing com Abas
- Criar `src/pages/Marketing.tsx` usando `Tabs` com `defaultValue="campanha"`.
- Adicionar `TabsList` com `TabsTrigger` para as chaves: `campanha`, `branding`, `producao`, `anuncio`.
- Incluir `TabsContent` correspondentes. Conteúdo inicial será placeholders bem estruturados para futura implementação.
- Seguir padrões de layout e estilização existentes (containers, espaçamentos, tipografia).

### Fase 4: Organização e Escalabilidade
- Se o arquivo exceder ~200 linhas, extrair cada aba em `src/pages/marketing/`:
  - `CampanhaTab.tsx`, `BrandingTab.tsx`, `ProducaoConteudoTab.tsx`, `AnuncioTab.tsx`.
- Manter componentes pequenos e reutilizáveis.

### Fase 5: Validação
- Verificar navegação pelo dock até `"/marketing"`.
- Checar visibilidade do dock na página Marketing.
- Trocar entre abas para garantir estados e estilo consistentes.

## Reflexão sobre Escalabilidade e Manutenibilidade
- Centralizar itens do dock em `DockNav` mantém o ponto único de verdade e facilita futuras expansões (ex.: permissões por item). A página Marketing isolada com abas baseadas em `Tabs` evita acoplamento e permite evoluir cada área (Campanha, Branding, Conteúdo, Anúncio) de forma independente.
- Eventuais crescimentos de lógica de negócio por aba indicam separar em módulos específicos e introduzir estado por feature (Zustand/Context já existente, se houver), além de lazy loading por rota/aba para performance.

## Ideias de Melhorias (2–5)
- Adicionar atalhos rápidos no dock contextual dentro da página Marketing (ex.: “Nova Campanha”).
- Suporte a favoritos/recente para campanhas e anúncios.
- Persistência de aba ativa por usuário (ex.: via query string `?tab=` ou armazenamento local).
- Métricas básicas por aba com `Skeleton`/lazy loading para melhorar UX.
- Guardas de permissão por item do dock caso existam diferentes papéis de usuário.

## Solicitação
- Confirme as respostas das perguntas de esclarecimento e aprove o plano para que eu implemente as mudanças imediatamente.