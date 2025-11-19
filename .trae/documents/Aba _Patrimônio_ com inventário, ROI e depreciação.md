## Perguntas de Esclarecimento
- Onde você prefere a aba: em `Carteira` (junto de "Despesas, Relatórios, Bancos, Crédito, Dívidas") ou como página própria no menu principal?
- Quais categorias iniciais de patrimônio você quer ver prontas (ex.: roupas, acessórios, tecnologia, imóveis/casa, veículos/carro, empresas, colecionáveis)?
- Para depreciação, adotamos linha reta como padrão? Quer opcional de taxa declinante (percentual anual/mensal)?
- O ROI deve considerar receitas/despesas específicas do item (ex.: aluguel da casa, manutenção do carro) via lançamentos vinculados ao item?
- Precisa anexar comprovantes/nota fiscal/garantia e fotos por item?
- Deseja importação/exportação CSV para itens e lançamentos?

## Visão Geral
Criar a aba "Patrimônio" para cadastrar e controlar inventário de bens, com cálculo de valor atual por depreciação e ROI por fluxo de caixa do item. Integra com o visual existente de tabs (Radix `Tabs`) e Supabase para persistência.

## Modelo de Dados (Supabase)
### Tabela `patrimonio_itens`
- `id` UUID PK, `user_id` UUID (RLS), `nome` (texto), `categoria` (texto), `descricao` (texto opcional)
- `data_aquisicao` (timestamp), `custo_inicial` (decimal), `valor_residual` (decimal, default 0)
- `metodo_depreciacao` (enum texto: `linha_reta`, `declinante`), `vida_util_meses` (int, default por categoria)
- `taxa_declinante_anual` (decimal opcional), `localizacao` (texto), `condicao` (enum: novo, bom, usado, avariado)
- `serial_nota` (texto opcional), `garantia_fim` (date opcional)
- `rendimento_mensal_estimado` (decimal opcional), `tags` (array texto), `status` (ativo, vendido, descartado)
- `valor_atual_cache` (decimal) para performance, `created_at`, `updated_at`

### Tabela `patrimonio_movimentos`
- Lançamentos vinculados ao item para ROI: `id` PK, `item_id` FK, `user_id`
- `tipo` (entrada|saida), `valor` (decimal), `data` (timestamp), `descricao`, `categoria` (ex.: aluguel, manutenção)
- `comprovante_url` opcional, `created_at`, `updated_at`

### RLS e Índices
- Habilitar RLS nas duas tabelas com políticas iguais às já usadas (usuário só vê/edita seus registros)
- Índices por `user_id`, `categoria`, `status`, e em `patrimonio_movimentos.item_id`

## Cálculos
- Depreciação (linha reta padrão): `dep_mensal = (custo_inicial - valor_residual) / vida_util_meses`; `meses_passados = diff(data_aquisicao, hoje)`; `valor_atual = max(valor_residual, custo_inicial - dep_mensal * meses_passados)`
- Depreciação declinante: `valor_atual = custo_inicial * (1 - taxa_anual)^(anos_passados)` com ajuste mensal; travar em `valor_residual`
- ROI do item: `ROI = (∑ entradas - ∑ saídas) / custo_inicial` no período selecionado; saldo acumulado e ROI anualizado

## Hooks e Integração (React + Supabase)
- `src/hooks/usePatrimonio.ts`: CRUD de `patrimonio_itens` e `patrimonio_movimentos`, filtros, e helpers de cálculo
- Reuso do padrão dos hooks existentes (`useCarteira`, `useFinanceiroGeral`), com `@tanstack/react-query` para cache

## UI/UX
- Em `src/pages/Carteira.tsx:54-60`, adicionar `TabsTrigger value="patrimonio"` e `TabsContent value="patrimonio"`
- `src/components/carteira/TabelaPatrimonio.tsx`:
  - Lista com colunas: Nome, Categoria, Valor Atual, Custo Inicial, ROI, Status, Ações
  - Filtros por categoria/status, busca por texto
  - Botão "Adicionar" abre modal de cadastro (nome, categoria, datas, custo, método depreciação, vida útil, residual, anexos)
- Drawer/Modal "Lançamentos do Item": tabela de entradas/saídas para ROI com gráfico pequeno (Recharts)
- Cards de resumo: `Valor total`, `Valor depreciado`, `ROI médio`, `Top 5 por ROI`
- Suporte a anexos (upload URL Supabase Storage se já houver integração; caso contrário, campo de URL)

## Segurança e Performance
- RLS igual aos módulos atuais; sem expor dados de outros usuários
- Campos `valor_atual_cache` e `updated_at` com trigger para recalcular ao atualizar item ou inserir movimento (opcional; primeiro entregar cálculo no cliente para simplicidade)

## Marcos
1. Banco de dados: criar migrações e RLS das duas tabelas
2. Hook `usePatrimonio` com CRUD e cálculos
3. UI: adicionar aba em Carteira e tabela básica de itens
4. Modal de cadastro/edição + validação
5. Lançamentos do item e gráficos; cálculo de ROI
6. Resumos e filtros; polimento

## Integrações Futuras (opcionais)
- Vincular `financeiro_geral` aos itens via campo opcional `patrimonio_item_id` para unificar lançamentos
- Exportar/importar CSV
- Notificações de fim de garantia/manutenção periódica
- Múltiplos proprietários/centros de custo
- Análise de portfólio por categoria (heatmap e radar)

## Próximas Ideias
- Defaults de vida útil por categoria (ex.: tecnologia 36m, carros 60m)
- Simulação de venda: qual o preço mínimo para ROI alvo
- Histórico de reavaliação de preço de mercado
- Widget na dashboard com evolução do valor de patrimônio
- Etiquetas e QR code para inventário físico
