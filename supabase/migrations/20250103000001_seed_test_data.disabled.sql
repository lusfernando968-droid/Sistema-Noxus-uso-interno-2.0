-- Script para popular o banco com dados de teste
-- ATENÇÃO: Este script deve ser executado apenas em ambiente de desenvolvimento

-- Inserir dados de teste apenas se não existirem dados
DO $$
DECLARE
  test_user_id UUID;
  cliente1_id UUID;
  cliente2_id UUID;
  cliente3_id UUID;
  projeto1_id UUID;
  projeto2_id UUID;
  projeto3_id UUID;
BEGIN
  -- Verificar se já existem dados de teste
  IF EXISTS (SELECT 1 FROM public.clientes LIMIT 1) THEN
    RAISE NOTICE 'Dados de teste já existem. Pulando inserção.';
    RETURN;
  END IF;

  -- Criar um usuário de teste (simulando um usuário autenticado)
  -- Em produção, isso seria feito através do auth.users
  test_user_id := '00000000-0000-0000-0000-000000000001'::UUID;

  -- Inserir clientes de teste
  INSERT INTO public.clientes (id, user_id, nome, email, telefone, documento, endereco, created_at) VALUES
  (gen_random_uuid(), test_user_id, 'João Silva', 'joao.silva@email.com', '(11) 99999-1111', '123.456.789-01', 'Rua das Flores, 123 - São Paulo/SP', NOW() - INTERVAL '30 days'),
  (gen_random_uuid(), test_user_id, 'Maria Santos', 'maria.santos@email.com', '(11) 99999-2222', '987.654.321-02', 'Av. Paulista, 456 - São Paulo/SP', NOW() - INTERVAL '25 days'),
  (gen_random_uuid(), test_user_id, 'Pedro Oliveira', 'pedro.oliveira@email.com', '(11) 99999-3333', '456.789.123-03', 'Rua Augusta, 789 - São Paulo/SP', NOW() - INTERVAL '20 days'),
  (gen_random_uuid(), test_user_id, 'Ana Costa', 'ana.costa@email.com', '(11) 99999-4444', '321.654.987-04', 'Rua Oscar Freire, 321 - São Paulo/SP', NOW() - INTERVAL '15 days'),
  (gen_random_uuid(), test_user_id, 'Carlos Ferreira', 'carlos.ferreira@email.com', '(11) 99999-5555', '654.321.987-05', 'Av. Faria Lima, 654 - São Paulo/SP', NOW() - INTERVAL '10 days');

  -- Pegar IDs dos clientes para usar nos projetos
  SELECT id INTO cliente1_id FROM public.clientes WHERE nome = 'João Silva' AND user_id = test_user_id;
  SELECT id INTO cliente2_id FROM public.clientes WHERE nome = 'Maria Santos' AND user_id = test_user_id;
  SELECT id INTO cliente3_id FROM public.clientes WHERE nome = 'Pedro Oliveira' AND user_id = test_user_id;

  -- Inserir projetos de teste
  INSERT INTO public.projetos (
    id, user_id, cliente_id, titulo, descricao, status, 
    valor_total, valor_por_sessao, quantidade_sessoes, 
    data_inicio, data_fim, categoria, notas, created_at
  ) VALUES
  (
    gen_random_uuid(), test_user_id, cliente1_id, 
    'Tatuagem Dragão Oriental', 
    'Tatuagem de dragão oriental no braço direito, estilo tradicional japonês',
    'andamento',
    2500.00, 500.00, 5,
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '30 days',
    'tatuagem',
    'Cliente quer cores vibrantes, principalmente vermelho e dourado. Referências de dragões tradicionais japoneses.',
    NOW() - INTERVAL '15 days'
  ),
  (
    gen_random_uuid(), test_user_id, cliente2_id,
    'Piercing Helix Duplo',
    'Dois piercings helix na orelha esquerda com joias de titânio',
    'concluido',
    300.00, 150.00, 2,
    CURRENT_DATE - INTERVAL '20 days',
    CURRENT_DATE - INTERVAL '5 days',
    'piercing',
    'Cliente optou por joias de titânio anodizado em azul. Cicatrização perfeita.',
    NOW() - INTERVAL '20 days'
  ),
  (
    gen_random_uuid(), test_user_id, cliente3_id,
    'Design Logo Estúdio',
    'Criação de identidade visual completa para novo estúdio de tatuagem',
    'planejamento',
    1800.00, 300.00, 6,
    CURRENT_DATE + INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '45 days',
    'design',
    'Logo, cartão de visita, papel timbrado, redes sociais. Estilo moderno com elementos tribais.',
    NOW() - INTERVAL '5 days'
  );

  -- Pegar IDs dos projetos para usar nas sessões
  SELECT id INTO projeto1_id FROM public.projetos WHERE titulo = 'Tatuagem Dragão Oriental' AND user_id = test_user_id;
  SELECT id INTO projeto2_id FROM public.projetos WHERE titulo = 'Piercing Helix Duplo' AND user_id = test_user_id;

  -- Inserir sessões de teste
  INSERT INTO public.projeto_sessoes (
    projeto_id, numero_sessao, data_sessao, valor_sessao, 
    status_pagamento, metodo_pagamento, feedback_cliente, 
    observacoes_tecnicas, avaliacao, created_at
  ) VALUES
  -- Sessões do projeto de tatuagem (3 de 5 realizadas)
  (
    projeto1_id, 1, CURRENT_DATE - INTERVAL '15 days', 500.00,
    'pago', 'pix', 'Muito satisfeito com o esboço inicial',
    'Primeira sessão - contorno básico do dragão', 5,
    NOW() - INTERVAL '15 days'
  ),
  (
    projeto1_id, 2, CURRENT_DATE - INTERVAL '8 days', 500.00,
    'pago', 'cartao', 'Adorou as cores escolhidas',
    'Segunda sessão - preenchimento de cores base', 5,
    NOW() - INTERVAL '8 days'
  ),
  (
    projeto1_id, 3, CURRENT_DATE - INTERVAL '1 day', 500.00,
    'pago', 'dinheiro', 'Resultado superou expectativas',
    'Terceira sessão - detalhes e sombreamento', 5,
    NOW() - INTERVAL '1 day'
  ),
  -- Sessões do projeto de piercing (2 de 2 realizadas)
  (
    projeto2_id, 1, CURRENT_DATE - INTERVAL '20 days', 150.00,
    'pago', 'pix', 'Procedimento muito tranquilo',
    'Primeira perfuração - helix superior', 4,
    NOW() - INTERVAL '20 days'
  ),
  (
    projeto2_id, 2, CURRENT_DATE - INTERVAL '5 days', 150.00,
    'pago', 'pix', 'Cicatrização perfeita, muito satisfeita',
    'Segunda perfuração - helix inferior, troca de joias', 5,
    NOW() - INTERVAL '5 days'
  );

  -- Inserir referências de teste
  INSERT INTO public.projeto_referencias (projeto_id, titulo, url, descricao, created_at) VALUES
  (projeto1_id, 'Dragões Tradicionais Japoneses', 'https://pinterest.com/dragons-japanese', 'Referências de dragões orientais tradicionais', NOW() - INTERVAL '15 days'),
  (projeto1_id, 'Paleta de Cores', 'https://coolors.co/palette/red-gold', 'Paleta de cores vermelha e dourada', NOW() - INTERVAL '14 days'),
  (projeto2_id, 'Joias de Titânio', 'https://bodyartforms.com/titanium', 'Catálogo de joias de titânio anodizado', NOW() - INTERVAL '20 days');

  -- Inserir agendamentos de teste
  INSERT INTO public.agendamentos (
    user_id, projeto_id, titulo, descricao, data, hora, status, created_at
  ) VALUES
  (test_user_id, projeto1_id, 'Sessão 4 - Dragão Oriental', 'Quarta sessão - finalização de detalhes', CURRENT_DATE + INTERVAL '7 days', '14:00', 'agendado', NOW()),
  (test_user_id, projeto1_id, 'Sessão 5 - Dragão Oriental', 'Quinta sessão - retoques finais', CURRENT_DATE + INTERVAL '21 days', '14:00', 'agendado', NOW()),
  (test_user_id, projeto3_id, 'Reunião - Briefing Logo', 'Primeira reunião para definir conceito do logo', CURRENT_DATE + INTERVAL '5 days', '10:00', 'agendado', NOW());

  RAISE NOTICE 'Dados de teste inseridos com sucesso!';
  RAISE NOTICE 'Clientes: 5 | Projetos: 3 | Sessões: 5 | Agendamentos: 3';
  RAISE NOTICE 'User ID de teste: %', test_user_id;

END $$;