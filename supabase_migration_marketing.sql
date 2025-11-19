-- Tabela para Branding Assets
create table if not exists branding_assets (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  type text not null check (type in ('logo', 'color', 'font', 'manual')),
  asset_url text, -- URL da imagem ou arquivo
  value text, -- Para cores (HEX/RGB) ou nome da fonte
  description text
);

-- Tabela para Produção de Conteúdo
create table if not exists conteudo_producao (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  platform text not null check (platform in ('instagram', 'youtube', 'tiktok', 'linkedin', 'blog')),
  status text not null check (status in ('ideia', 'roteiro', 'gravacao', 'edicao', 'postado')),
  scheduled_date date,
  description text,
  link text -- Link para o post ou pasta de arquivos
);

-- Tabela para Anúncios
create table if not exists anuncios (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  campaign_name text not null,
  platform text not null check (platform in ('meta', 'google', 'tiktok')),
  status text not null check (status in ('ativo', 'pausado', 'concluido')),
  budget numeric,
  spend numeric default 0,
  reach integer default 0,
  clicks integer default 0,
  start_date date,
  end_date date
);

-- Habilitar RLS (Row Level Security) - Opcional, mas recomendado
alter table branding_assets enable row level security;
alter table conteudo_producao enable row level security;
alter table anuncios enable row level security;

-- Políticas de acesso (Exemplo: permitir tudo para autenticados - AJUSTE CONFORME NECESSIDADE)
create policy "Enable all access for authenticated users" on branding_assets for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on conteudo_producao for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on anuncios for all using (auth.role() = 'authenticated');
