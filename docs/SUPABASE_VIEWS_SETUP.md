# 📊 Views do Supabase - Guia de Configuração

**Data**: 09/12/2025  
**Versão**: 1.0.0

---

## 📋 Visão Geral

Este documento explica como aplicar as views otimizadas do banco de dados que eliminam problemas N+1 e melhoram a performance do sistema.

---

## 🎯 Views Disponíveis

### 1. `clientes_com_ltv`
Calcula o LTV (Lifetime Value) de cada cliente diretamente no banco.

**Benefícios:**
- Elimina N+1 queries ao buscar clientes
- LTV calculado em tempo real
- Contagem de projetos e transações incluída

### 2. `agendamentos_com_detalhes`
Retorna agendamentos com dados completos do projeto e cliente.

**Benefícios:**
- Uma única query para dados relacionados
- Verificação de sessão/transação existente
- Dados do cliente e projeto incluídos

### 3. `projetos_com_metricas`
Retorna projetos com métricas calculadas.

**Benefícios:**
- Sessões realizadas calculadas
- Valor pago consolidado
- Progresso calculado automaticamente

---

## 🚀 Como Aplicar

### Opção 1: Via Supabase CLI (Recomendado)

```bash
# Na raiz do projeto
npx supabase db push
```

Isso aplicará todas as migrações pendentes, incluindo:
- `20251209000001_create_clientes_com_ltv_view.sql`
- `20251209000002_create_agendamentos_com_detalhes_view.sql`
- `20251209000003_create_projetos_com_metricas_view.sql`

### Opção 2: Via Supabase Dashboard

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole e execute cada um dos SQLs abaixo:

---

## 📝 SQL das Views

### View: `clientes_com_ltv`

```sql
-- Primeiro, remover a view se existir (para recriar)
DROP VIEW IF EXISTS public.clientes_com_ltv;

-- Criar view com cálculo de LTV otimizado
CREATE VIEW public.clientes_com_ltv AS
SELECT 
  c.id,
  c.user_id,
  c.nome,
  c.email,
  c.telefone,
  c.documento,
  c.endereco,
  c.instagram,
  c.cidade,
  c.indicado_por,
  c.data_aniversario,
  c.foto_url,
  c.created_at,
  c.updated_at,
  -- Contagem de projetos
  COALESCE(proj_stats.projetos_count, 0)::integer AS projetos_count,
  -- Contagem de transações de receita pagas
  COALESCE(proj_stats.transacoes_count, 0)::integer AS transacoes_count,
  -- LTV: soma de sessões pagas + transações pagas
  COALESCE(proj_stats.ltv, 0)::numeric(12,2) AS ltv
FROM public.clientes c
LEFT JOIN LATERAL (
  SELECT 
    COUNT(DISTINCT p.id) AS projetos_count,
    COALESCE(SUM(ps.valor_sessao) FILTER (WHERE ps.status_pagamento = 'pago'), 0) AS sessoes_pagas,
    COUNT(DISTINCT t.id) FILTER (WHERE t.tipo = 'RECEITA' AND t.data_liquidacao IS NOT NULL) AS transacoes_count,
    COALESCE(SUM(t.valor) FILTER (WHERE t.tipo = 'RECEITA' AND t.data_liquidacao IS NOT NULL), 0) AS transacoes_pagas,
    COALESCE(SUM(ps.valor_sessao) FILTER (WHERE ps.status_pagamento = 'pago'), 0) +
    COALESCE(SUM(DISTINCT t.valor) FILTER (WHERE t.tipo = 'RECEITA' AND t.data_liquidacao IS NOT NULL), 0) AS ltv
  FROM public.projetos p
  LEFT JOIN public.projeto_sessoes ps ON ps.projeto_id = p.id
  LEFT JOIN public.agendamentos a ON a.projeto_id = p.id
  LEFT JOIN public.transacoes t ON t.agendamento_id = a.id AND t.user_id = c.user_id
  WHERE p.cliente_id = c.id AND p.user_id = c.user_id
) proj_stats ON true;

-- Permitir acesso via RLS
ALTER VIEW public.clientes_com_ltv SET (security_invoker = true);

-- Comentário
COMMENT ON VIEW public.clientes_com_ltv IS 
'View que calcula o LTV de cada cliente, incluindo contagem de projetos e transações.';
```

### View: `agendamentos_com_detalhes`

```sql
DROP VIEW IF EXISTS public.agendamentos_com_detalhes;

CREATE VIEW public.agendamentos_com_detalhes AS
SELECT 
  a.id,
  a.user_id,
  a.projeto_id,
  a.titulo,
  a.descricao,
  a.data,
  a.hora,
  a.status,
  a.valor_estimado,
  a.created_at,
  a.updated_at,
  p.id AS projeto_id_ref,
  p.titulo AS projeto_titulo,
  p.status AS projeto_status,
  p.valor_total AS projeto_valor_total,
  p.valor_por_sessao AS projeto_valor_por_sessao,
  p.quantidade_sessoes AS projeto_quantidade_sessoes,
  c.id AS cliente_id,
  c.nome AS cliente_nome,
  c.email AS cliente_email,
  c.telefone AS cliente_telefone,
  c.instagram AS cliente_instagram,
  c.foto_url AS cliente_foto_url,
  EXISTS (SELECT 1 FROM public.projeto_sessoes ps WHERE ps.agendamento_id = a.id) AS tem_sessao_registrada,
  EXISTS (SELECT 1 FROM public.transacoes t WHERE t.agendamento_id = a.id) AS tem_transacao_registrada
FROM public.agendamentos a
LEFT JOIN public.projetos p ON p.id = a.projeto_id
LEFT JOIN public.clientes c ON c.id = p.cliente_id;

ALTER VIEW public.agendamentos_com_detalhes SET (security_invoker = true);

COMMENT ON VIEW public.agendamentos_com_detalhes IS 
'View que retorna agendamentos com dados completos do projeto e cliente.';
```

### View: `projetos_com_metricas`

```sql
DROP VIEW IF EXISTS public.projetos_com_metricas;

CREATE VIEW public.projetos_com_metricas AS
SELECT 
  p.id,
  p.user_id,
  p.cliente_id,
  p.titulo,
  p.descricao,
  p.status,
  p.notas,
  p.valor_total,
  p.valor_por_sessao,
  p.quantidade_sessoes,
  p.progresso,
  p.data_inicio,
  p.data_estimada_fim,
  p.local_corpo,
  p.estilo,
  p.created_at,
  p.updated_at,
  c.id AS cliente_id_ref,
  c.nome AS cliente_nome,
  c.email AS cliente_email,
  c.telefone AS cliente_telefone,
  c.instagram AS cliente_instagram,
  c.foto_url AS cliente_foto_url,
  COALESCE(metricas.sessoes_realizadas, 0)::integer AS sessoes_realizadas,
  COALESCE(metricas.valor_pago, 0)::numeric(12,2) AS valor_pago,
  COALESCE(metricas.fotos_count, 0)::integer AS fotos_count,
  COALESCE(metricas.agendamentos_count, 0)::integer AS agendamentos_count,
  CASE 
    WHEN COALESCE(p.quantidade_sessoes, 0) > 0 
    THEN LEAST(100, ROUND((COALESCE(metricas.sessoes_realizadas, 0)::numeric / p.quantidade_sessoes) * 100))
    ELSE 0 
  END::integer AS progresso_calculado
FROM public.projetos p
LEFT JOIN public.clientes c ON c.id = p.cliente_id
LEFT JOIN LATERAL (
  SELECT 
    COUNT(DISTINCT ps.id) AS sessoes_realizadas,
    COALESCE(SUM(ps.valor_sessao) FILTER (WHERE ps.status_pagamento = 'pago'), 0) AS valor_pago,
    (SELECT COUNT(*) FROM public.projeto_fotos pf WHERE pf.projeto_id = p.id) AS fotos_count,
    (SELECT COUNT(*) FROM public.agendamentos ag WHERE ag.projeto_id = p.id) AS agendamentos_count
  FROM public.projeto_sessoes ps
  WHERE ps.projeto_id = p.id
) metricas ON true;

ALTER VIEW public.projetos_com_metricas SET (security_invoker = true);

COMMENT ON VIEW public.projetos_com_metricas IS 
'View que retorna projetos com métricas calculadas.';
```

---

## ✅ Verificação

Após aplicar as views, execute as queries abaixo para verificar:

```sql
-- Verificar clientes com LTV
SELECT id, nome, ltv, projetos_count, transacoes_count 
FROM clientes_com_ltv 
ORDER BY ltv DESC 
LIMIT 10;

-- Verificar agendamentos
SELECT id, titulo, cliente_nome, projeto_titulo 
FROM agendamentos_com_detalhes 
LIMIT 10;

-- Verificar projetos
SELECT id, titulo, cliente_nome, sessoes_realizadas, valor_pago, progresso_calculado 
FROM projetos_com_metricas 
LIMIT 10;
```

---

## 🔧 Troubleshooting

### Erro: "relation does not exist"
Algumas tabelas podem não existir ainda. Execute as migrações anteriores primeiro:
```bash
npx supabase db push
```

### Erro: "permission denied"
A view usa `security_invoker = true` para respeitar RLS. Verifique se o usuário tem as permissões corretas nas tabelas base.

### Erro: "column does not exist"
Algumas colunas podem ter sido adicionadas em migrações posteriores. Verifique a ordem das migrações.

---

## 📚 Referências

- [Supabase Views Documentation](https://supabase.com/docs/guides/database/tables#views)
- [PostgreSQL CREATE VIEW](https://www.postgresql.org/docs/current/sql-createview.html)
- [RLS with Views](https://supabase.com/docs/guides/auth/row-level-security#using-views)

---

**Última Atualização**: 09/12/2025

