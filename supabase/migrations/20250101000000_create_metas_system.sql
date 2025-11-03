-- Criação do sistema de metas
-- Tabela principal de metas
CREATE TABLE IF NOT EXISTS metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  categoria VARCHAR(100) NOT NULL CHECK (categoria IN ('financeiro', 'clientes', 'projetos', 'vendas', 'pessoal', 'operacional')),
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('valor', 'quantidade', 'percentual')),
  valor_meta DECIMAL(15,2) NOT NULL CHECK (valor_meta > 0),
  valor_atual DECIMAL(15,2) DEFAULT 0 CHECK (valor_atual >= 0),
  unidade VARCHAR(50) DEFAULT 'unidades',
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL CHECK (data_fim > data_inicio),
  status VARCHAR(50) DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'concluida', 'cancelada')),
  prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'critica')),
  cor VARCHAR(7) DEFAULT '#8B5CF6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de progresso das metas
CREATE TABLE IF NOT EXISTS meta_progresso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID REFERENCES metas(id) ON DELETE CASCADE,
  valor_anterior DECIMAL(15,2),
  valor_novo DECIMAL(15,2),
  percentual_anterior DECIMAL(5,2),
  percentual_novo DECIMAL(5,2),
  observacao TEXT,
  data_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- Tabela de configuração de alertas para metas
CREATE TABLE IF NOT EXISTS meta_alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID REFERENCES metas(id) ON DELETE CASCADE,
  tipo_alerta VARCHAR(50) NOT NULL CHECK (tipo_alerta IN ('prazo', 'progresso', 'conclusao', 'inatividade')),
  percentual_trigger INTEGER CHECK (percentual_trigger BETWEEN 0 AND 100),
  dias_antes_prazo INTEGER,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para otimização de performance
CREATE INDEX IF NOT EXISTS idx_metas_user_id ON metas(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_status ON metas(status);
CREATE INDEX IF NOT EXISTS idx_metas_categoria ON metas(categoria);
CREATE INDEX IF NOT EXISTS idx_metas_data_fim ON metas(data_fim);
CREATE INDEX IF NOT EXISTS idx_meta_progresso_meta_id ON meta_progresso(meta_id);
CREATE INDEX IF NOT EXISTS idx_meta_progresso_data ON meta_progresso(data_registro);
CREATE INDEX IF NOT EXISTS idx_meta_alertas_meta_id ON meta_alertas(meta_id);

-- Função para calcular percentual de progresso
CREATE OR REPLACE FUNCTION calcular_percentual_meta(valor_atual DECIMAL, valor_meta DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  IF valor_meta = 0 THEN
    RETURN 0;
  END IF;
  RETURN ROUND((valor_atual / valor_meta) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE TRIGGER update_metas_updated_at
  BEFORE UPDATE ON metas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para registrar progresso automaticamente
CREATE OR REPLACE FUNCTION registrar_progresso_meta()
RETURNS TRIGGER AS $$
BEGIN
  -- Só registra se o valor_atual mudou
  IF OLD.valor_atual IS DISTINCT FROM NEW.valor_atual THEN
    INSERT INTO meta_progresso (
      meta_id,
      valor_anterior,
      valor_novo,
      percentual_anterior,
      percentual_novo,
      user_id
    ) VALUES (
      NEW.id,
      OLD.valor_atual,
      NEW.valor_atual,
      calcular_percentual_meta(OLD.valor_atual, NEW.valor_meta),
      calcular_percentual_meta(NEW.valor_atual, NEW.valor_meta),
      NEW.user_id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para registrar progresso automaticamente
CREATE TRIGGER trigger_registrar_progresso
  AFTER UPDATE ON metas
  FOR EACH ROW
  EXECUTE FUNCTION registrar_progresso_meta();

-- View para facilitar consultas de metas com progresso
CREATE OR REPLACE VIEW metas_com_progresso AS
SELECT 
  m.*,
  calcular_percentual_meta(m.valor_atual, m.valor_meta) as percentual_progresso,
  CASE 
    WHEN m.data_fim < CURRENT_DATE AND m.status = 'ativa' THEN 'vencida'
    WHEN m.data_fim <= CURRENT_DATE + INTERVAL '7 days' AND m.status = 'ativa' THEN 'proxima_vencimento'
    ELSE m.status
  END as status_calculado,
  (m.data_fim - CURRENT_DATE) as dias_restantes,
  CASE 
    WHEN calcular_percentual_meta(m.valor_atual, m.valor_meta) >= 100 THEN 'concluida'
    WHEN calcular_percentual_meta(m.valor_atual, m.valor_meta) >= 75 THEN 'quase_concluida'
    WHEN calcular_percentual_meta(m.valor_atual, m.valor_meta) >= 50 THEN 'em_andamento'
    WHEN calcular_percentual_meta(m.valor_atual, m.valor_meta) >= 25 THEN 'iniciada'
    ELSE 'nao_iniciada'
  END as nivel_progresso
FROM metas m;

-- Políticas de segurança RLS (Row Level Security)
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_progresso ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_alertas ENABLE ROW LEVEL SECURITY;

-- Política para metas - usuários só veem suas próprias metas
CREATE POLICY "Usuários podem ver suas próprias metas" ON metas
  FOR ALL USING (auth.uid() = user_id);

-- Política para progresso - usuários só veem progresso de suas metas
CREATE POLICY "Usuários podem ver progresso de suas metas" ON meta_progresso
  FOR ALL USING (auth.uid() = user_id);

-- Política para alertas - usuários só veem alertas de suas metas
CREATE POLICY "Usuários podem ver alertas de suas metas" ON meta_alertas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM metas 
      WHERE metas.id = meta_alertas.meta_id 
      AND metas.user_id = auth.uid()
    )
  );

-- Inserir algumas categorias e tipos padrão como comentários para referência
/*
Categorias disponíveis:
- financeiro: Metas relacionadas a receitas, despesas, lucro
- clientes: Metas de aquisição, retenção, satisfação de clientes
- projetos: Metas de entrega, qualidade, produtividade de projetos
- vendas: Metas de vendas, conversão, pipeline
- pessoal: Metas de desenvolvimento pessoal, aprendizado
- operacional: Metas de eficiência, processos, qualidade

Tipos disponíveis:
- valor: Metas monetárias (R$ 10.000)
- quantidade: Metas numéricas (50 clientes)
- percentual: Metas em porcentagem (95% satisfação)

Unidades sugeridas:
- R$, USD, EUR (para valores monetários)
- unidades, clientes, projetos, vendas (para quantidades)
- %, pontos, estrelas (para percentuais/avaliações)
*/