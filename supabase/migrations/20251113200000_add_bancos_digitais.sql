-- Adicionar bancos digitais famosos do Brasil
INSERT INTO public.bancos (codigo, nome, nome_curto, cor_primaria, cor_secundaria, logo_url, site_url) VALUES
-- Bancos Digitais Populares
('077', 'Banco Inter S.A.', 'Inter', '#FF7900', '#FF9E44', 'https://logosmarcas.net/wp-content/uploads/2020/09/Banco-Inter-logo.png', 'https://bancointer.com.br'),
('735', 'Neon Pagamentos S.A.', 'Neon', '#00D8FF', '#00A8CC', 'https://logosmarcas.net/wp-content/uploads/2020/09/Neon-logo.png', 'https://neon.com.br'),
('336', 'Banco C6 S.A.', 'C6 Bank', '#00D4E6', '#00A3B4', 'https://logosmarcas.net/wp-content/uploads/2020/09/C6-Bank-logo.png', 'https://c6bank.com.br'),
('290', 'PagBank Pagamentos S.A.', 'PagBank', '#00D4E6', '#008C95', 'https://logosmarcas.net/wp-content/uploads/2020/09/PagBank-logo.png', 'https://pagbank.com.br'),
('323', 'Mercado Pago S.A.', 'Mercado Pago', '#00A1FF', '#007EB5', 'https://logosmarcas.net/wp-content/uploads/2020/09/Mercado-Pago-logo.png', 'https://mercadopago.com.br'),
('121', 'Banco Agibank S.A.', 'Agibank', '#FF6900', '#FF8533', 'https://logosmarcas.net/wp-content/uploads/2020/09/Agibank-logo.png', 'https://agibank.com.br'),
('654', 'Banco Digio S.A.', 'Digio', '#FF477E', '#FF6B9D', 'https://logosmarcas.net/wp-content/uploads/2020/09/Digio-logo.png', 'https://digio.com.br'),
('140', 'Easynvest - Título Corretora de Valores S.A.', 'Easynvest', '#00C8C0', '#009B95', 'https://logosmarcas.net/wp-content/uploads/2020/09/Easynvest-logo.png', 'https://easynvest.com.br'),
('280', 'Will Bank S.A.', 'Will Bank', '#FF4757', '#FF6B7A', 'https://logosmarcas.net/wp-content/uploads/2020/09/Will-Bank-logo.png', 'https://willbank.com.br'),
('146', 'Banco Original S.A.', 'Original', '#00D27A', '#00A85F', 'https://logosmarcas.net/wp-content/uploads/2020/09/Banco-Original-logo.png', 'https://original.com.br'),

-- Fintechs e Corretoras
('608', 'Clear Corretora S.A.', 'Clear', '#FF6B35', '#FF8A5C', 'https://logosmarcas.net/wp-content/uploads/2020/09/Clear-logo.png', 'https://clear.com.br'),
('102', 'XP Investimentos S.A.', 'XP', '#FFDD00', '#FFC400', 'https://logosmarcas.net/wp-content/uploads/2020/09/XP-logo.png', 'https://xp.com.br'),
('324', 'BTG Pactual S.A.', 'BTG Pactual', '#000080', '#1E3A8A', 'https://logosmarcas.net/wp-content/uploads/2020/09/BTG-Pactual-logo.png', 'https://btgpactual.com'),
('600', 'Rico Corretora S.A.', 'Rico', '#FF4500', '#FF6B35', 'https://logosmarcas.net/wp-content/uploads/2020/09/Rico-logo.png', 'https://rico.com.vc'),
('620', 'Avenue Securities S.A.', 'Avenue', '#1E40AF', '#3B82F6', 'https://logosmarcas.net/wp-content/uploads/2020/09/Avenue-logo.png', 'https://avenue.us'),

-- Bancos Tradicionais (já existem mas garantindo)
('260', 'Nu Pagamentos S.A.', 'Nubank', '#8A05BE', '#D219E2', 'https://logosmarcas.net/wp-content/uploads/2020/09/Nubank-logo.png', 'https://nubank.com.br'),
('341', 'Itaú Unibanco S.A.', 'Itaú', '#FF8C00', '#FFA500', 'https://logosmarcas.net/wp-content/uploads/2020/09/Itau-logo.png', 'https://itau.com.br'),
('237', 'Bradesco S.A.', 'Bradesco', '#CC0000', '#FF0000', 'https://logosmarcas.net/wp-content/uploads/2020/09/Bradesco-logo.png', 'https://bradesco.com.br'),
('104', 'Caixa Econômica Federal', 'Caixa', '#005CA9', '#007ACC', 'https://logosmarcas.net/wp-content/uploads/2020/09/Caixa-logo.png', 'https://caixa.gov.br'),
('033', 'Santander Brasil S.A.', 'Santander', '#FF0000', '#CC0000', 'https://logosmarcas.net/wp-content/uploads/2020/09/Santander-logo.png', 'https://santander.com.br'),
('001', 'Banco do Brasil S.A.', 'Banco do Brasil', '#F5E500', '#FFD700', 'https://logosmarcas.net/wp-content/uploads/2020/09/Banco-do-Brasil-logo.png', 'https://bb.com.br')

ON CONFLICT (codigo) DO UPDATE SET
  nome = EXCLUDED.nome,
  nome_curto = EXCLUDED.nome_curto,
  cor_primaria = EXCLUDED.cor_primaria,
  cor_secundaria = EXCLUDED.cor_secundaria,
  logo_url = EXCLUDED.logo_url,
  site_url = EXCLUDED.site_url,
  updated_at = NOW();