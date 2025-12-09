-- ============================================
-- View: agendamentos_com_detalhes
-- Descrição: Retorna agendamentos com informações do projeto e cliente
-- usando JOINs otimizados, eliminando N+1 queries
-- ============================================

-- Primeiro, remover a view se existir (para recriar)
DROP VIEW IF EXISTS public.agendamentos_com_detalhes;

-- Criar view com JOINs otimizados
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
  -- Dados do projeto
  p.id AS projeto_id_ref,
  p.titulo AS projeto_titulo,
  p.status AS projeto_status,
  p.valor_total AS projeto_valor_total,
  p.valor_por_sessao AS projeto_valor_por_sessao,
  p.quantidade_sessoes AS projeto_quantidade_sessoes,
  -- Dados do cliente
  c.id AS cliente_id,
  c.nome AS cliente_nome,
  c.email AS cliente_email,
  c.telefone AS cliente_telefone,
  c.instagram AS cliente_instagram,
  c.foto_url AS cliente_foto_url,
  -- Verificar se já existe sessão para este agendamento
  EXISTS (
    SELECT 1 FROM public.projeto_sessoes ps 
    WHERE ps.agendamento_id = a.id
  ) AS tem_sessao_registrada,
  -- Verificar se já existe transação para este agendamento
  EXISTS (
    SELECT 1 FROM public.transacoes t 
    WHERE t.agendamento_id = a.id
  ) AS tem_transacao_registrada
FROM public.agendamentos a
LEFT JOIN public.projetos p ON p.id = a.projeto_id
LEFT JOIN public.clientes c ON c.id = p.cliente_id;

-- Comentário na view
COMMENT ON VIEW public.agendamentos_com_detalhes IS 
'View que retorna agendamentos com dados completos do projeto e cliente. Usa security_invoker para respeitar RLS.';

-- Permitir acesso via RLS
ALTER VIEW public.agendamentos_com_detalhes SET (security_invoker = true);

