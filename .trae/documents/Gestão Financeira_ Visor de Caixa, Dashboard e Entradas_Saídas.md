## Perguntas de Esclarecimento

1. Você já possui a lista de bancos/contas (ex.: Itaú PJ, Nubank, Bradesco), ou deseja criá-las no sistema? sim
2. O saldo inicial de cada conta deve ser cadastrado manualmente ou vamos importar de extratos/integrações? manual
3. As entradas/saídas atuais ficam todas em `transacoes`, e as despesas gerais em `financeiro_geral`. Deseja unificar ambos em uma visão única ou manter módulos separados? mantem separado
4. Quais períodos e filtros são essenciais no Dashboard (mensal, trimestral, anual, por conta, por categoria, por forma de pagamento)?mensal, anual, entrada e saida 
5. Precisamos de conciliação bancária (marcar transações como conciliadas) e anexos de comprovantes/notas?
6. Há necessidade de multiusuário/empresas (filtrar por `user_id`/`tenant`) nos cálculos do saldo por banco?não 

## Visão Geral

* Organizar uma única página de Gestão Financeira com três áreas:

  * Visor de Caixa por Banco (saldo atual por conta)

  * Dashboard de Métricas (receitas, despesas, fluxo de caixa, categorias)

  * Entradas/Saídas (CRUD unificado com filtros e calendário)

* Reutilizar stack existente: React + Vite, Tailwind + Shadcn UI, Supabase, React Query, Recharts.

## Arquitetura Atual (base para o plano)

* Páginas: `src/pages/Financeiro.tsx:376` (transações), `src/pages/TattooFinanceiro.tsx:18` (resumo e link para módulo completo)

* Componentes: `src/components/financeiro/FinanceiroGeralTable.tsx:25`, `src/components/dashboard/FinanceTab.tsx:106`

* Dados: `src/hooks/useFinanceiroGeral.ts:49` (tabela `public.financeiro_geral`), `src/hooks/useDashboardData.ts`

* Navegação: `src/App.tsx:34–41`, `src/components/layout/DockNav.tsx:12`

## Design de Dados

* Contas bancárias: se ainda não existe, criar `public.contas_bancarias` (id, nome\_banco, apelido, saldo\_inicial, cor, ativo, user\_id, created\_at, updated\_at).

* Transações: estender (ou já usar) `public.transacoes` com `conta_id`, `tipo` (entrada/saida), `categoria`, `forma_pagamento`, `valor`, `data`, `status` (pendente/conciliada), `descricao`, `user_id`.

* Cálculo de saldo atual por banco: `saldo_atual = saldo_inicial + sum(entradas) - sum(saidas)` filtrado por `conta_id`, `user_id` e período (opcional).

* Despesas gerais (`financeiro_geral`) permanecem como categoria específica, podendo apontar para `conta_id`.

## Dashboard: Métricas Principais

* Saldo por banco (cards por conta com tendência vs mês anterior)

* Receitas vs Despesas (linha/área mensal)

* Fluxo de caixa acumulado no período

* Por categoria (pizza) e por forma de pagamento (barra)

* Top 5 maiores despesas e receitas

* Projeções simples (média móvel de 3 meses) e metas (opcional)

## UX/Fluxo

* Header da página: filtros de período e conta

* Seções em cards:

  * "Visor de Caixa" com cartões por banco + ação “Adicionar entrada/saída” rápida

  * "Dashboard" com gráficos e resumos

  * "Entradas/Saídas" com tabela + calendário + formulário

* Ações rápidas: adicionar, editar, excluir, conciliar, anexar comprovante (se habilitado)

## Implementação por Fases

### Fase 1: Modelagem de Contas Bancárias

* Criar tabela `contas_bancarias` (com RLS por `user_id`) e índices básicos.

* Adicionar hook `useContasBancarias` com React Query para listar/criar/editar/arquivar.

### Fase 2: Integração com Transações

* Garantir `conta_id` em `transacoes` e adicionar migração se faltar.

* Normalizar CRUD atual em `src/pages/Financeiro.tsx:376` para suportar seleção de conta.

### Fase 3: Visor de Caixa por Banco

* Novo componente `BankBalanceWidget` consumindo `useContasBancarias` + agregações em `transacoes`.

* Cards com: nome do banco, saldo atual, variação mensal, botão ação rápida.

### Fase 4: Dashboard de Métricas

* Reutilizar `FinanceTab` (`src/components/dashboard/FinanceTab.tsx:106`) com fonte de dados única.

* Adicionar gráficos: saldo por banco, receitas vs despesas, categorias, formas de pagamento, fluxo acumulado.

* Filtros reativos (período/conta) com estado compartilhado.

### Fase 5: Entradas/Saídas

* Unificar CRUD em uma tabela única com colunas essenciais e filtros.

* Adicionar calendário (`FinancialCalendar`) e dialog de criação/edição com validação `zod`.

* Suporte a conciliação (toggle) e anexos (opcional).

### Fase 6: Performance e Segurança

* Query agregada por banco com índices em `transacoes(conta_id, data)`.

* Rate Limits e RLS conferidos; nenhum dado de outros usuários visível.

### Fase 7: QA/Validação

* Testes manuais: criação de contas, lançamentos, variação mensal, filtros.

* Métricas conferidas com exemplos e checagem visual dos gráficos.

## Impacto em Arquivos

* `src/pages/Financeiro.tsx:376` — incorporar Visor de Caixa, filtros e CRUD unificado

* `src/components/dashboard/FinanceTab.tsx:106–201` — padronizar fonte de dados e novos gráficos

* `src/components/financeiro/FinanceiroGeralTable.tsx:25` — apontar para `conta_id` (se aplicável)

* `src/hooks/useFinanceiroGeral.ts:49` e `src/hooks/useDashboardData.ts` — consolidar dados de transações

* Migrações Supabase (sem servidor próprio) — criação/ajuste de tabelas

## Entregáveis

* Página "Gestão Financeira" com:

  * Visor de Caixa por Banco

  * Dashboard completo com filtros

  * Entradas/Saídas com CRUD + calendário

* Hooks e consultas consolidados; RLS aplicada; índices mínimos.

## Ideias de Melhoria

* Conciliação semi-automática via import de extratos CSV por conta

* Orçamentos por categoria com alertas quando extrapolar

* Projeções com média móvel e sazonalidade simples

* Metas mensais e badges de progresso no dashboard

* Exportação CSV/PDF dos relatórios filtrados

## Resumo para Notion

* Planejamento de página única de Gestão Financeira com visor de caixa por banco, dashboard e CRUD de entradas/saídas.

* Reuso do stack atual (React, Supabase, Recharts) e componentes existentes, adicionando `contas_bancarias` e agregações por banco.

* Fases: modelagem de contas, integração de transações, widgets de saldo, dashboard, CRUD, segurança/performance e validação.

Se aprovarmos, avanço para implementação fase a fase seguindo este plano.
