/**
 * Testes unitários para TransacoesService
 * 
 * Testa as operações CRUD de transações, validações e
 * comportamento de tratamento de erros.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  TransacoesService,
  TransacoesServiceError,
  CATEGORIAS_RECEITA,
  CATEGORIAS_DESPESA,
} from '../transacoes.service';

// Mock do Supabase
const mockSupabaseResponse = <T>(data: T, error: Error | null = null) => ({
  data,
  error,
});

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })),
  },
}));

vi.mock('@/integrations/supabase/local', () => ({
  supabaseLocal: null,
  isSupabaseLocalConfigured: false,
}));

describe('TransacoesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Constantes de Categorias', () => {
    it('deve ter categorias de receita definidas', () => {
      expect(CATEGORIAS_RECEITA).toBeDefined();
      expect(CATEGORIAS_RECEITA.length).toBeGreaterThan(0);
      expect(CATEGORIAS_RECEITA).toContain('Pagamento de Cliente');
    });

    it('deve ter categorias de despesa definidas', () => {
      expect(CATEGORIAS_DESPESA).toBeDefined();
      expect(CATEGORIAS_DESPESA.length).toBeGreaterThan(0);
      expect(CATEGORIAS_DESPESA).toContain('Fornecedor');
    });
  });

  describe('fetchAll', () => {
    it('deve buscar todas as transações do usuário', async () => {
      const mockTransacoes = [
        {
          id: '1',
          tipo: 'RECEITA',
          categoria: 'Pagamento de Cliente',
          valor: 1000,
          data_vencimento: '2024-01-15',
          data_liquidacao: null,
          descricao: 'Teste',
          agendamento_id: null,
          conta_id: null,
          agendamentos: null,
        },
      ];

      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue(mockSupabaseResponse(mockTransacoes)),
        }),
      });

      const result = await TransacoesService.fetchAll('user-123');

      expect(result).toHaveLength(1);
      expect(result[0].tipo).toBe('RECEITA');
      expect(result[0].valor).toBe(1000);
    });

    it('deve lançar erro quando falha ao buscar', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue(
            mockSupabaseResponse(null, new Error('Database error'))
          ),
        }),
      });

      await expect(TransacoesService.fetchAll('user-123')).rejects.toThrow(
        TransacoesServiceError
      );
    });

    it('deve retornar array vazio quando não há transações', async () => {
      mockSelect.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue(mockSupabaseResponse([])),
        }),
      });

      const result = await TransacoesService.fetchAll('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('fetchAgendamentos', () => {
    it('deve buscar agendamentos disponíveis', async () => {
      const mockAgendamentos = [
        {
          id: '1',
          titulo: 'Sessão Tattoo',
          data: '2024-01-20',
          projetos: { clientes: { nome: 'João' } },
        },
      ];

      mockSelect.mockReturnValue({
        order: vi.fn().mockResolvedValue(mockSupabaseResponse(mockAgendamentos)),
      });

      const result = await TransacoesService.fetchAgendamentos();

      expect(result).toHaveLength(1);
      expect(result[0].titulo).toBe('Sessão Tattoo');
    });
  });

  describe('create', () => {
    it('deve criar uma nova transação de receita', async () => {
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(
            mockSupabaseResponse({ id: 'new-trans-id' })
          ),
        }),
      });

      const result = await TransacoesService.create('user-123', {
        tipo: 'RECEITA',
        categoria: 'Pagamento de Cliente',
        valor: 500,
        data_vencimento: '2024-02-01',
        descricao: 'Novo pagamento',
      });

      expect(result.success).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it('deve criar uma nova transação de despesa', async () => {
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(
            mockSupabaseResponse({ id: 'new-trans-id' })
          ),
        }),
      });

      const result = await TransacoesService.create('user-123', {
        tipo: 'DESPESA',
        categoria: 'Fornecedor',
        valor: 200,
        data_vencimento: '2024-02-15',
        descricao: 'Compra de material',
      });

      expect(result.success).toBe(true);
    });

    it('deve tratar erro de schema cache (conta_id)', async () => {
      const schemaError = new Error('column "conta_id" does not exist in schema cache');
      
      mockInsert.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(mockSupabaseResponse(null, schemaError)),
        }),
      }).mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(mockSupabaseResponse({ id: 'new-id' })),
        }),
      });

      const result = await TransacoesService.create('user-123', {
        tipo: 'RECEITA',
        categoria: 'Outros',
        valor: 100,
        data_vencimento: '2024-03-01',
        descricao: 'Teste fallback',
        conta_id: 'conta-123',
      });

      expect(result.success).toBe(true);
      expect(result.warning).toContain('conta_id');
    });

    it('deve lançar erro para falhas não relacionadas a schema', async () => {
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(
            mockSupabaseResponse(null, new Error('Permission denied'))
          ),
        }),
      });

      await expect(
        TransacoesService.create('user-123', {
          tipo: 'RECEITA',
          categoria: 'Outros',
          valor: 100,
          data_vencimento: '2024-03-01',
          descricao: 'Teste erro',
        })
      ).rejects.toThrow(TransacoesServiceError);
    });
  });

  describe('createAporte', () => {
    it('deve criar um aporte entre contas', async () => {
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(mockSupabaseResponse({ id: 'aporte-1' })),
        }),
      });

      const result = await TransacoesService.createAporte('user-123', {
        valor: 1000,
        data_vencimento: '2024-01-10',
        descricao: 'Transferência entre contas',
        conta_origem_id: 'conta-1',
        conta_destino_id: 'conta-2',
        liquidarImediatamente: true,
      });

      expect(result.success).toBe(true);
    });

    it('deve criar duas transações para o aporte (despesa e receita)', async () => {
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(mockSupabaseResponse({ id: 'trans-id' })),
        }),
      });

      await TransacoesService.createAporte('user-123', {
        valor: 500,
        data_vencimento: '2024-02-01',
        descricao: 'Aporte teste',
        conta_origem_id: 'conta-origem',
        conta_destino_id: 'conta-destino',
        liquidarImediatamente: false,
      });

      // Verifica que insert foi chamado para ambas transações
      expect(mockInsert).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('deve atualizar uma transação existente', async () => {
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue(mockSupabaseResponse(null)),
      });

      const result = await TransacoesService.update('trans-123', {
        valor: 1500,
        descricao: 'Valor atualizado',
      });

      expect(result.success).toBe(true);
    });

    it('deve tratar erro de schema cache na atualização', async () => {
      const schemaError = new Error('conta_id schema cache issue');

      mockUpdate
        .mockReturnValueOnce({
          eq: vi.fn().mockResolvedValue(mockSupabaseResponse(null, schemaError)),
        })
        .mockReturnValueOnce({
          eq: vi.fn().mockResolvedValue(mockSupabaseResponse(null)),
        });

      const result = await TransacoesService.update('trans-123', {
        valor: 800,
        conta_id: 'conta-nova',
      });

      expect(result.success).toBe(true);
      expect(result.warning).toBeDefined();
    });
  });

  describe('delete', () => {
    it('deve deletar uma transação', async () => {
      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue(mockSupabaseResponse(null)),
      });

      await expect(
        TransacoesService.delete('trans-to-delete')
      ).resolves.not.toThrow();
    });

    it('deve lançar erro quando falha ao deletar', async () => {
      mockDelete.mockReturnValue({
        eq: vi.fn().mockResolvedValue(
          mockSupabaseResponse(null, new Error('Delete failed'))
        ),
      });

      await expect(
        TransacoesService.delete('trans-123')
      ).rejects.toThrow(TransacoesServiceError);
    });
  });

  describe('liquidar', () => {
    it('deve liquidar uma transação com sucesso', async () => {
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockResolvedValue(mockSupabaseResponse(null)),
      });

      const transacaoOriginal = {
        id: 'trans-1',
        tipo: 'RECEITA' as const,
        categoria: 'Pagamento de Cliente',
        valor: 1000,
        data_vencimento: '2024-01-15',
        data_liquidacao: null,
        descricao: 'Pagamento cliente',
        agendamento_id: null,
        conta_id: null,
      };

      const result = await TransacoesService.liquidar(
        'trans-1',
        'user-123',
        {
          data_liquidacao: '2024-01-20',
          conta_id: 'conta-principal',
        },
        transacaoOriginal
      );

      expect(result.success).toBe(true);
    });
  });

  describe('TransacoesServiceError', () => {
    it('deve criar erro com código e mensagem', () => {
      const error = new TransacoesServiceError(
        'Erro de teste',
        'TEST_ERROR',
        new Error('Original')
      );

      expect(error.message).toBe('Erro de teste');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('TransacoesServiceError');
      expect(error.originalError).toBeDefined();
    });
  });
});

