import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClientesService } from '../clientes.service';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

describe('ClientesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchAll', () => {
    it('should fetch clients successfully', async () => {
      const mockData = [{ id: '1', nome: 'Test Client', ltv: 100 }];

      // Mock implementation
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockData, error: null })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: selectMock
      });

      const result = await ClientesService.fetchAll('user-123');

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('clientes_com_ltv');
    });

    it('should throw error on failure', async () => {
      const mockError = { message: 'Database error' };

      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: null, error: mockError })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: selectMock
      });

      await expect(ClientesService.fetchAll('user-123')).rejects.toThrow('Erro ao buscar clientes');
    });
  });

  describe('create', () => {
    it('should create a client successfully', async () => {
      const newClient = { nome: 'New Client', email: 'test@test.com' };
      const createdClient = { id: '1', ...newClient };

      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: createdClient, error: null })
        })
      });

      (supabase.from as any).mockReturnValue({
        insert: insertMock
      });

      const result = await ClientesService.create('user-123', newClient);

      expect(result).toEqual(createdClient);
      expect(supabase.from).toHaveBeenCalledWith('clientes');
    });
  });
});
