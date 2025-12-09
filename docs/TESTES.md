# 🧪 Guia de Testes

Este documento descreve a estrutura e práticas de testes do Sistema Noxus.

---

## 📁 Estrutura

```
src/
├── test/
│   ├── setup.ts          # Configuração global
│   └── utils.tsx          # Utilitários de teste
├── services/
│   └── __tests__/
│       ├── transacoes.service.test.ts
│       └── clientes.service.test.ts
└── hooks/
    └── __tests__/
        ├── useFinanceiroReducer.test.ts
        └── useProjetoDetalhesReducer.test.ts
```

---

## ⚡ Comandos

```bash
# Modo interativo (watch)
pnpm test

# Executar uma vez
pnpm test:run

# Com cobertura de código
pnpm test:ci

# Interface visual
pnpm test:ui

# Verificação de tipos
pnpm typecheck
```

---

## 🛠️ Configuração

### `vitest.config.ts`

```ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
});
```

---

## 📝 Padrões de Teste

### Teste Unitário de Serviço

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Service, ServiceError } from '../service';

// Mock do Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

describe('Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAll', () => {
    it('deve buscar dados com sucesso', async () => {
      const result = await Service.fetchAll('user-123');
      expect(result).toEqual([]);
    });

    it('deve lançar erro quando falha', async () => {
      // Configurar mock para retornar erro
      await expect(Service.fetchAll('user-123')).rejects.toThrow(ServiceError);
    });
  });
});
```

### Teste de Hook com useReducer

```ts
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducerHook } from '../useReducerHook';

describe('useReducerHook', () => {
  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useReducerHook());
    
    expect(result.current.state.isOpen).toBe(false);
  });

  it('deve atualizar estado via action', () => {
    const { result } = renderHook(() => useReducerHook());

    act(() => {
      result.current.actions.open();
    });

    expect(result.current.state.isOpen).toBe(true);
  });

  it('deve completar fluxo complexo', () => {
    const { result } = renderHook(() => useReducerHook());

    // Passo 1
    act(() => {
      result.current.actions.open();
    });

    // Passo 2
    act(() => {
      result.current.actions.setData({ value: 100 });
    });

    // Verificações
    expect(result.current.state.data.value).toBe(100);

    // Passo 3
    act(() => {
      result.current.actions.close();
    });

    expect(result.current.state.isOpen).toBe(false);
  });
});
```

### Teste de Componente

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import { Component } from './Component';

describe('Component', () => {
  it('deve renderizar título', () => {
    render(<Component title="Teste" />);
    expect(screen.getByText('Teste')).toBeInTheDocument();
  });

  it('deve chamar callback ao clicar', async () => {
    const onClick = vi.fn();
    render(<Component onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('deve exibir loading e depois dados', async () => {
    render(<Component />);

    // Inicialmente mostra loading
    expect(screen.getByText('Carregando...')).toBeInTheDocument();

    // Depois mostra dados
    await waitFor(() => {
      expect(screen.getByText('Dados carregados')).toBeInTheDocument();
    });
  });
});
```

---

## 🔧 Utilitários

### `src/test/utils.tsx`

```tsx
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Wrapper com providers
function AllTheProviders({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

// Render customizado
function customRender(ui, options) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

### Mock Factory

```tsx
import { mockFactory } from '@/test/utils';

// Criar transação de teste
const transacao = mockFactory.transacao({
  valor: 500,
  tipo: 'DESPESA',
});

// Criar cliente de teste
const cliente = mockFactory.cliente({
  nome: 'Cliente Especial',
  ltv: 10000,
});
```

---

## 📊 Cobertura

### Metas

| Métrica | Mínimo |
|---------|--------|
| Lines | 50% |
| Functions | 50% |
| Branches | 50% |
| Statements | 50% |

### Verificar Cobertura

```bash
# Gerar relatório
pnpm test:ci

# Ver relatório HTML
open coverage/index.html
```

---

## 🚀 CI/CD

Os testes são executados automaticamente via GitHub Actions:

1. **Push/PR**: Executa lint, typecheck e testes
2. **Coverage**: Enviado para Codecov
3. **Build**: Só executa se testes passarem
4. **Deploy**: Apenas na branch `main`

---

## 📋 Boas Práticas

1. **Isolamento**: Cada teste deve ser independente
2. **Descrição**: Use nomes descritivos (`deve fazer X quando Y`)
3. **AAA Pattern**: Arrange, Act, Assert
4. **Mocks**: Mock apenas o necessário
5. **Async**: Use `waitFor` para operações assíncronas
6. **Cleanup**: Testes são limpos automaticamente pelo setup

---

## 🔍 Debugging

```ts
// Ver estado atual
console.log(result.current.state);

// Pausar execução
await new Promise(r => setTimeout(r, 100));

// Debug do DOM
screen.debug();
```

