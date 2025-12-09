/**
 * Utilitários para testes
 * Fornece wrappers e helpers para facilitar a escrita de testes
 */
import React, { ReactElement, ReactNode } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Query client para testes
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

/**
 * Wrapper padrão para testes com React Query e Router
 */
interface AllTheProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Render customizado com todos os providers
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Mock do Supabase para testes
 */
export const createMockSupabase = () => ({
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      match: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
  auth: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    getUser: vi.fn(() => Promise.resolve({ data: { user: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({
      data: { subscription: { unsubscribe: vi.fn() } },
    })),
  },
});

/**
 * Helper para criar mocks de dados
 */
export const mockFactory = {
  transacao: (overrides = {}) => ({
    id: 'trans-' + Math.random().toString(36).substr(2, 9),
    user_id: 'user-123',
    tipo: 'RECEITA' as const,
    categoria: 'Pagamento de Cliente',
    valor: 1000,
    data_vencimento: '2024-01-15',
    data_liquidacao: null,
    descricao: 'Teste de transação',
    agendamento_id: null,
    conta_id: null,
    ...overrides,
  }),

  cliente: (overrides = {}) => ({
    id: 'cli-' + Math.random().toString(36).substr(2, 9),
    user_id: 'user-123',
    nome: 'Cliente Teste',
    email: 'teste@email.com',
    telefone: '11999999999',
    instagram: '@teste',
    cidade: 'São Paulo',
    ltv: 5000,
    projetos_count: 2,
    transacoes_count: 5,
    ...overrides,
  }),

  projeto: (overrides = {}) => ({
    id: 'proj-' + Math.random().toString(36).substr(2, 9),
    user_id: 'user-123',
    titulo: 'Projeto Teste',
    descricao: 'Descrição do projeto',
    cliente_id: 'cli-123',
    cliente_nome: 'Cliente Teste',
    status: 'andamento' as const,
    valor_total: 2000,
    valor_pago: 1000,
    data_inicio: '2024-01-01',
    ...overrides,
  }),

  agendamento: (overrides = {}) => ({
    id: 'ag-' + Math.random().toString(36).substr(2, 9),
    titulo: 'Agendamento Teste',
    data: '2024-01-20',
    hora: '14:00',
    status: 'agendado' as const,
    ...overrides,
  }),

  user: (overrides = {}) => ({
    id: 'user-123',
    email: 'user@test.com',
    ...overrides,
  }),
};

/**
 * Helper para esperar por condições assíncronas
 */
export const waitForCondition = async (
  condition: () => boolean,
  timeout = 5000,
  interval = 50
): Promise<void> => {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
};

// Re-exporta tudo do @testing-library/react
export * from '@testing-library/react';

// Exporta o render customizado como padrão
export { customRender as render };

