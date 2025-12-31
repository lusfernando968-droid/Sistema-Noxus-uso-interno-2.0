# Noxus WhatsApp Chatbot

Chatbot WhatsApp para Sistema Noxus usando **Baileys** (WhatsApp Web API) e AI/ML API.

## 🚀 Funcionalidades

- ✅ Cadastro de clientes via WhatsApp
- 🔄 Agendamento de sessões (em desenvolvimento)
- 📋 Criação de projetos (em desenvolvimento)
- 🤖 Processamento de linguagem natural com AI/ML API
- 💾 Integração com Supabase
- 📊 Log de conversas

## 📋 Pré-requisitos

- Node.js 20+
- Conta Supabase
- Chave AI/ML API
- WhatsApp (para escanear QR Code)

## ⚙️ Configuração

### 1. Variáveis de Ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

Edite `.env`:

```env
# Supabase (obtenha em https://supabase.com/dashboard/project/_/settings/api)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_KEY=seu-service-key-aqui

# AI/ML API
AIML_API_KEY=sua-chave-aiml-api

# Baileys (opcional)
BAILEYS_SESSION_DIR=./auth_info_baileys
```

### 2. Aplicar Migrations no Supabase

Execute as migrations na ordem:

```bash
# Na raiz do projeto Sistema-Noxus-uso-interno-2.0
# As migrations estão em supabase/migrations/
# 20251216000000_create_chatbot_tables.sql
# 20251216000001_create_chatbot_rpcs.sql
```

Via Supabase Dashboard:
1. Acesse SQL Editor
2. Cole o conteúdo de cada migration
3. Execute

### 3. Instalar Dependências

```bash
npm install
```

## 💻 Executar o Chatbot

### 1. Iniciar o servidor

```bash
npm run dev
```

### 2. Conectar WhatsApp

Após iniciar o servidor, um **QR Code** será exibido no terminal.

**Para conectar:**
1. Abra o WhatsApp no celular
2. Android: Menu (⋮) → Dispositivos conectados → Conectar um dispositivo
3. iPhone: Configurações → Dispositivos conectados → Conectar um dispositivo
4. Escaneie o QR Code exibido no terminal

**Aguarde a confirmação:**
```
✅ WhatsApp conectado com sucesso!
```

> **Nota:** A sessão fica salva em `auth_info_baileys/`. Você só precisa escanear o QR Code uma vez. Nas próximas execuções, o bot reconectará automaticamente.

### 3. Verificar Status

```bash
# Health check
curl http://localhost:3001/health
```

## 📱 Testar o Chatbot

### Via WhatsApp

Envie mensagem para o número conectado:

```
Cadastrar cliente João Silva, email joao@email.com, telefone (11) 99999-9999
```

### Via API (Teste)

```bash
curl -X POST http://localhost:3001/test-message \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "message": "Olá!"
  }'
```

## 📚 Comandos Disponíveis

### Cadastrar Cliente

```
Cadastrar cliente [Nome], email [email], telefone [telefone]
```

Exemplo:
```
Cadastrar cliente Maria Santos, email maria@email.com, telefone (11) 98765-4321
```

### Ajuda

```
ajuda
```

### Saudação

```
oi
olá
bom dia
```

## 🏗️ Estrutura do Projeto

```
chatbot-backend/
├── src/
│   ├── config.ts              # Configurações
│   ├── server.ts              # Servidor Express
│   ├── services/
│   │   ├── baileys.service.ts     # Baileys WhatsApp
│   │   ├── whatsapp.service.ts    # Wrapper WhatsApp
│   │   ├── supabase.service.ts    # Supabase
│   │   ├── aiml.service.ts        # AI/ML API
│   │   └── message.processor.ts   # Processador
│   └── handlers/
│       └── cliente.handler.ts     # Handler clientes
├── auth_info_baileys/         # Sessão WhatsApp (gitignored)
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔧 Troubleshooting

### WhatsApp não conecta

```bash
# Reiniciar servidor
# Ctrl+C para parar
npm run dev

# Escanear QR Code novamente
```

### QR Code não aparece

1. Verifique se a porta 3001 está livre
2. Delete a pasta `auth_info_baileys/` e tente novamente
3. Verifique os logs no terminal

### Backend não recebe mensagens

1. Verifique se WhatsApp está conectado (logs devem mostrar "✅ WhatsApp conectado")
2. Envie mensagem de teste
3. Verifique logs no terminal

### Erro ao criar cliente

1. Verifique se migrations foram aplicadas
2. Verifique se usuário tem telefone vinculado
3. Veja logs no Supabase Dashboard

## 📖 Documentação Adicional

- [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- [AI/ML API Docs](https://docs.aimlapi.com/)
- [Supabase Docs](https://supabase.com/docs)

## 🔐 Segurança

- ✅ Service Key do Supabase nunca exposto ao frontend
- ✅ RLS habilitado em todas as tabelas
- ✅ Validação de telefone antes de criar dados
- ✅ Logs de todas as operações

## 📝 Próximos Passos

- [ ] Implementar handler de agendamentos
- [ ] Implementar handler de projetos
- [ ] Adicionar sistema de verificação de telefone
- [ ] Implementar notificações automáticas
- [ ] Dashboard de métricas do chatbot
