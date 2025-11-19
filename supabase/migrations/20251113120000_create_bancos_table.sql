-- Criar tabela de bancos
CREATE TABLE public.bancos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL, -- Código do banco (ex: "260" para Nubank)
    nome VARCHAR(100) NOT NULL, -- Nome completo do banco
    nome_curto VARCHAR(50) NOT NULL, -- Nome curto para exibição
    cor_primaria VARCHAR(7) DEFAULT '#7A3CE1', -- Cor primária em hexadecimal
    cor_secundaria VARCHAR(7) DEFAULT '#9A4DFF', -- Cor secundária em hexadecimal
    logo_url TEXT, -- URL do logo do banco
    site_url TEXT, -- Site oficial do banco
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índice para busca rápida por código
CREATE INDEX idx_bancos_codigo ON public.bancos(codigo);

-- Adicionar índice para busca por nome
CREATE INDEX idx_bancos_nome ON public.bancos(nome);

-- Inserir bancos brasileiros comuns
INSERT INTO public.bancos (codigo, nome, nome_curto, cor_primaria, cor_secundaria, logo_url, site_url) VALUES
('260', 'Nu Pagamentos S.A.', 'Nubank', '#8A05BE', '#D219E2', 'https://logosmarcas.net/wp-content/uploads/2020/09/Nubank-logo.png', 'https://nubank.com.br'),
('341', 'Itaú Unibanco S.A.', 'Itaú', '#FF8C00', '#FFA500', 'https://logosmarcas.net/wp-content/uploads/2020/09/Itau-logo.png', 'https://itau.com.br'),
('237', 'Bradesco S.A.', 'Bradesco', '#CC0000', '#FF0000', 'https://logosmarcas.net/wp-content/uploads/2020/09/Bradesco-logo.png', 'https://bradesco.com.br'),
('104', 'Caixa Econômica Federal', 'Caixa', '#005CA9', '#007ACC', 'https://logosmarcas.net/wp-content/uploads/2020/09/Caixa-logo.png', 'https://caixa.gov.br'),
('033', 'Santander Brasil S.A.', 'Santander', '#FF0000', '#CC0000', 'https://logosmarcas.net/wp-content/uploads/2020/09/Santander-logo.png', 'https://santander.com.br'),
('001', 'Banco do Brasil S.A.', 'Banco do Brasil', '#F5E500', '#FFD700', 'https://logosmarcas.net/wp-content/uploads/2020/09/Banco-do-Brasil-logo.png', 'https://bb.com.br'),
('745', 'Banco Citibank S.A.', 'Citibank', '#0018A8', '#0047AB', 'https://logosmarcas.net/wp-content/uploads/2020/09/Citibank-logo.png', 'https://citibank.com.br'),
('399', 'HSBC Bank Brasil S.A.', 'HSBC', '#FF4500', '#FF6347', 'https://logosmarcas.net/wp-content/uploads/2020/09/HSBC-logo.png', 'https://hsbc.com.br'),
('756', 'Banco Cooperativo do Brasil S.A.', 'Bancoob', '#005500', '#008000', 'https://logosmarcas.net/wp-content/uploads/2020/09/Bancoob-logo.png', 'https://bancoob.com.br'),
('422', 'Banco Safra S.A.', 'Safra', '#003366', '#004080', 'https://logosmarcas.net/wp-content/uploads/2020/09/Safra-logo.png', 'https://safra.com.br');

-- Criar trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bancos_updated_at 
    BEFORE UPDATE ON public.bancos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.bancos TO anon, authenticated;