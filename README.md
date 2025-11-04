# 🍎 Apple Zen CRM

Um sistema de CRM moderno e intuitivo com visualização avançada de rede de indicações, desenvolvido com React, TypeScript e Supabase.

## ✨ Funcionalidades Principais

### 📊 Dashboard Inteligente
- **Analytics Avançados** com gráficos interativos
- **Widgets Customizáveis** e reorganizáveis
- **Insights Inteligentes** com recomendações automáticas
- **Notificações em Tempo Real** integradas no header

### 👥 Gestão de Clientes
- **CRUD Completo** com edição inline
- **Sistema de Indicações** com rastreamento de origem
- **Visualização em Rede Neural** estilo Obsidian
- **Múltiplas Visualizações**: Lista, Grid, Tabela e Rede
- **Busca e Filtros** avançados

### 🕸️ Rede de Indicações
- **Visualização Hierárquica** com níveis bem definidos
- **Layout Circular** alternativo
- **Conexões Direcionais** com setas e gradientes
- **Zoom e Pan** com qualidade HiDPI
- **Sistema LOD** (Level of Detail) para performance

### 🎯 Outras Funcionalidades
- **Projetos** vinculados a clientes
- **Agendamentos** com status e categorias
- **Financeiro** com controle de receitas/despesas
- **Estoque** para produtos e serviços
- **Sistema de Conquistas** gamificado
- **Temas** claro e escuro
- **Efeitos Sonoros** opcionais

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes
- **Lucide React** para ícones
- **React Router** para navegação
- **React Query** para cache de dados

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- **Row Level Security** (RLS)
- **Real-time subscriptions**

### Funcionalidades Avançadas
- **Canvas API** para visualização de rede
- **localStorage** para dados temporários
- **Service Workers** para PWA
- **Responsive Design** mobile-first

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase

### Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/apple-zen-crm.git
cd apple-zen-crm
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. **Execute as migrações do banco**
```bash
# Se tiver Supabase CLI instalado
supabase db push

# Ou execute manualmente no painel do Supabase
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

6. **Acesse a aplicação**
```
http://localhost:5173
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── dashboard/      # Componentes do dashboard
│   ├── clientes/       # Componentes de clientes
│   ├── layout/         # Layout e navegação
│   └── auth/           # Autenticação
├── contexts/           # Contextos React
├── hooks/              # Hooks customizados
├── pages/              # Páginas da aplicação
├── lib/                # Utilitários e configurações
└── integrations/       # Integrações (Supabase)
```

## 🎨 Funcionalidades Destacadas

### Rede de Indicações
- **Algoritmo de Posicionamento** hierárquico
- **Renderização HiDPI** para qualidade cristalina
- **Gradientes e Sombras** para profundidade 3D
- **Interatividade** com zoom, pan e seleção

### Dashboard Avançado
- **Métricas em Tempo Real** com animações
- **Gráficos Interativos** responsivos
- **Widgets Drag & Drop** personalizáveis
- **Insights com IA** (simulados)

### Sistema de Notificações
- **Bell Icon Inteligente** no header
- **5 Tipos** de notificações
- **Estados** lido/não lido
- **Timestamps** inteligentes

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Verificar código
```

## 🌐 Deploy

### Lovable (Recomendado)
1. Conecte seu repositório GitHub ao Lovable
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

### Vercel
```bash
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# Upload da pasta dist/
```

## 📊 Banco de Dados

### Tabelas Principais
- `profiles` - Perfis de usuário
- `clientes` - Dados dos clientes
- `projetos` - Projetos vinculados
- `agendamentos` - Agendamentos e tarefas
- `transacoes` - Movimentações financeiras
- `estoque` - Produtos e serviços

### Funcionalidades do Banco
- **Row Level Security** para isolamento de dados
- **Triggers** para timestamps automáticos
- **Índices** otimizados para performance
- **Relacionamentos** bem definidos

## 🎯 Roadmap

- [ ] **Mobile App** com React Native
- [ ] **API REST** para integrações
- [ ] **Relatórios PDF** automatizados
- [ ] **Integração WhatsApp** para comunicação
- [ ] **IA Real** para insights e recomendações
- [ ] **Multi-tenancy** para empresas
- [ ] **Marketplace** de plugins

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Desenvolvido com ❤️ por [Seu Nome]

## 🙏 Agradecimentos

- **shadcn/ui** pelos componentes incríveis
- **Supabase** pela infraestrutura robusta
- **Lucide** pelos ícones elegantes
- **Tailwind CSS** pela estilização eficiente

---

⭐ Se este projeto te ajudou, considere dar uma estrela no GitHub!
