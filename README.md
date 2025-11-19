# Apple Zen CRM

Sistema de CRM moderno com visualização avançada de rede de indicações. Construído com React + Vite, TypeScript, TailwindCSS, Radix UI e integrações com Supabase e AI (Gemini/OpenAI).

## Stack
- `React 18`, `TypeScript`, `Vite 5`
- `TailwindCSS`, `Radix UI`, `lucide-react`
- `React Router`, `@tanstack/react-query`
- `Supabase` (auth/dados), `Recharts` (gráficos)
- Integrações AI: `@google/generative-ai` (Gemini) e proxy OpenAI

## Pré-requisitos
- `Node >= 18`
- `pnpm 8` (projeto usa `packageManager: pnpm@8.15.4`)

## Instalação e Execução
```bash
pnpm install
pnpm dev      # servidor de desenvolvimento
pnpm build    # build de produção
pnpm preview  # preview do build
pnpm lint     # checagens de lint
```
- Servidor de desenvolvimento: `http://localhost:8082/` (configurado em `vite.config.ts`)

## Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz com:
```bash
# Supabase
VITE_SUPABASE_URL=https://<sua-instancia>.supabase.co
VITE_SUPABASE_ANON_KEY=sbp_...
# ou use VITE_SUPABASE_PUBLISHABLE_KEY se aplicável

# Recursos de metas
VITE_ENABLE_METAS=true

# Gemini
VITE_GEMINI_API_KEY=AIza...

# OpenAI via proxy (opcional; padrão: http://localhost:5174/api/chat)
VITE_OPENAI_PROXY_URL=https://seu-proxy.exemplo/api/chat
```
- Supabase client: `src/integrations/supabase/client.ts` usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- Gemini: `src/integrations/gemini/client.ts` usa `VITE_GEMINI_API_KEY` e seleciona modelo estável automaticamente.
- OpenAI: `src/integrations/openai/client.ts` consome `VITE_OPENAI_PROXY_URL`.

## Estrutura do Projeto (resumo)
- `src/pages/` páginas principais (Clientes, Financeiro, Projetos, etc.)
- `src/components/` UI e módulos (dashboard, financeiro, layout, ui)
- `src/contexts/` contextos globais (Auth, Theme, Navigation)
- `src/hooks/` hooks específicos (dados, onboarding, metas, financeiro)
- `src/integrations/` clientes externos (Supabase, Gemini, OpenAI)
- `src/lib/` utilitários e configs (`config.ts` com `VITE_ENABLE_METAS`)
- `src/App.tsx` e `src/main.tsx` bootstrap da aplicação

## Convenções
- Aliases de import: `@` aponta para `./src` (ver `vite.config.ts`).
- CSS via Tailwind; componentes base em `src/components/ui/`.
- Evitar duplicação de lógica; preferir hooks em `src/hooks/`.
- Não commit de segredos (.env); use `.env.local` apenas no dev.

## Funcionalidades Principais
- Dashboard com widgets, gráficos e insights.
- Gestão de clientes e rede de indicações (visualização SVG).
- Calendário financeiro e tabelas de controle.
- Metas e notificações em tempo real.
- Chat AI (Gemini/OpenAI) quando configurado.

## Deploy
- Build com `pnpm build` gera `dist/`.
- Sirva `dist/` atrás de um servidor estático (Nginx, Vercel, etc.).
- Configure variáveis de ambiente no provedor (prefixo `VITE_`).

## Troubleshooting
- Supabase não configurado lança erro de acesso ao client.
- Sem `VITE_GEMINI_API_KEY`: recursos de AI são desativados com aviso.
- Porta de dev fixa em `8082`; ajuste em `vite.config.ts` se necessário.

## Scripts
- `dev`: Vite dev server
- `build`: Build de produção
- `preview`: Preview do build
- `lint`: ESLint

## Licença
MIT
