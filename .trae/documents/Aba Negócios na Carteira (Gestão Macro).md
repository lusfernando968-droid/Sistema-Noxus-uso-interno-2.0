## Perguntas de Esclarecimento
1. Quais tipos de negócio você quer gerenciar (produtos próprios, serviços, parcerias, franquias, marcas)?
2. Você quer controlar receita/custo/ROI por negócio, ou também metas, pipeline e tarefas?
3. Há necessidade de multi-unidade/filiais ou agrupamento por marcas? 
4. Nível de detalhe das métricas: diário, semanal, mensal? Quer ver comparativos com período anterior?
5. Deseja integração com transações da Carteira e Contas (vincular receitas/despesas a um negócio)?
6. Precisamos de permissões específicas (multiusuário/colaboradores) para editar negócios?

## Objetivo
Criar a aba "Negócios" no Dock da Carteira para visão macro de cada negócio, consolidando indicadores-chave, pipeline e ações.

## Dados Macros por Negócio
- Identidade: nome, marca, categoria, status (ativo/hibernado/encerrado), descrição.
- Financeiro macro:
  - Receita total (período selecionado)
  - Custo total
  - Margem bruta e líquida
  - ROI e variação vs período anterior
  - Ticket médio e número de transações (receitas)
  - Distribuição por canais (ex.: PIX, cartão, dinheiro)
- Operacional:
  - Pipeline (Leads → Oportunidades → Fechados) opcional
  - Tarefas e metas associadas (curto prazo)
  - Status de cumprimento de metas (% atingido)
- Patrimônio vinculado (opcional): valor atual dos ativos ligados ao negócio

## UI/UX – Estrutura da Aba
- Filtros topo: período (range), status, marca/categoria, canal.
- Cards de resumo (tema-aware): Receita, Custo, Margem, ROI, Ticket médio.
- Tabela de Negócios: nome, marca, status, receita, custo, lucro, ROI, ações (ver detalhes/editar).
- Gráficos:
  - Pizza: receita por marca/categoria
  - Barras: receita vs custos por mês
  - Linha: evolução de receita
- Pipeline opcional: mini-board com contadores (Leads/Oportunidades/Fechados) por negócio.
- Botões: "Adicionar negócio", "Adicionar meta", "Ver detalhes".

## Modelagem (Supabase)
- `public.negocios`:
  - id, user_id, nome, marca (texto), categoria, status, descricao
  - metas_relacionadas (jsonb opcional)
  - created_at, updated_at
- `public.negocios_financeiro` (agregações ou vínculo):
  - negocio_id, periodo, receita_total, custo_total, lucro, roi
  - opcional: armazenar snapshots mensais para performance
- Integração com `financeiro_tattoo`:
  - adicionar `negocio_id` (nullable) para vincular transações a um negócio
  - queries agregadas por período para compor os cards e gráficos
- RLS: todas as tabelas com políticas por `auth.uid() = user_id`

## Integrações e Agregações
- Carteira: somatórios de `financeiro_tattoo` filtrando por `negocio_id` e período
- Contas Bancárias: distribuição por forma de pagamento
- Patrimônio: opcionalmente somar `valor_atual_cache ?? calcularValorAtual` para ativos com tag do negócio
- Metas/KPIs: reutilizar ou criar estrutura simples de metas por negócio (meta de receita, custo, margem)

## Componentes Planejados
- `NegociosTab` (novo): filtros, cards, gráficos, tabela, modais
- `NegocioFormModal`: criar/editar negócio (nome, marca, categoria, status)
- `useNegocios` hook: CRUD em `negocios` + agregações (consulta em `financeiro_tattoo` por `negocio_id`)
- `NegocioDetailsDrawer` (opcional): detalhes rápido com gráficos e metas

## Passos Técnicos
1. Adicionar tab "negocios" no Dock e nos Tabs da Carteira.
2. Criar `useNegocios` com:
   - `fetchAll` e filtros
   - agregações (sum receita/custo/lucro/roi) por período e negócio via `financeiro_tattoo`
3. Criar `NegociosTab` com filtros, cards, gráficos (recharts), tabela e modal de criação.
4. Adicionar campo opcional `negocio_id` ao formulário de transações (`CarteiraTable`) para vincular receitas/despesas.
5. RLS e migrations: criar `negocios` e opcional `negocios_financeiro` com índices por `user_id` e `status`.
6. Testar performance com datasets e memoização nas agregações.

## Critérios de Aceite
- Visualização macro de negócios com filtros e KPIs funcionando.
- Vínculo de transações a negócios e atualização dos indicadores.
- UI responsiva e tema-aware, sem impacto em outras abas.

## Roadmap de Evolução
- Metas por negócio com progresso e alertas.
- Pipeline simplificado (leads → fechados) e integração com Marketing.
- Exportação CSV/PNG de relatórios.
- Permissões multiusuário por negócio.

Confirma seguir com esse plano e incluir os campos de vínculo `negocio_id` nas transações para alimentar os indicadores?