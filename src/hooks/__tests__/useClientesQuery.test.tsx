import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useClientesQuery } from '../useClientesQuery';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientesService } from '@/services/clientes.service';
import { useAuth } from '@/contexts/AuthContext';

// Mock dependencies
vi.mock('@/services/clientes.service');
vi.mock('@/contexts/AuthContext');
vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));
vi.mock('@/hooks/useTemporaryReferrals', () => ({
    useTemporaryReferrals: () => ({
        setReferral: vi.fn(),
        getReferral: vi.fn()
    }),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });
    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useClientesQuery', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useAuth as any).mockReturnValue({ user: { id: 'user-123' } });
    });

    it('should fetch clients', async () => {
        const mockClients = [{ id: '1', nome: 'Test', ltv: 100 }];
        (ClientesService.fetchAll as any).mockResolvedValue(mockClients);

        const { result } = renderHook(() => useClientesQuery(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.clientes).toHaveLength(1);
        expect(result.current.clientes[0].nome).toBe('Test');
    });

    it('should handle fetch error', async () => {
        (ClientesService.fetchAll as any).mockRejectedValue(new Error('Fetch failed'));

        const { result } = renderHook(() => useClientesQuery(), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(result.current.error).toBe('Fetch failed');
    });
});
