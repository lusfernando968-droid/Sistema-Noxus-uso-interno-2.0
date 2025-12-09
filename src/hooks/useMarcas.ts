import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Marca {
    id: string;
    nome: string;
    descricao?: string | null;
    descricao_produto?: string | null;
    campanha_id?: string | null;
    campanha_nome?: string;
    created_at: string;
    updated_at: string;
}

export interface MarcaInput {
    nome: string;
    descricao?: string;
    descricao_produto?: string;
    campanha_id?: string | null;
}

// Query key factory
const marcasKeys = {
    all: ['marcas'] as const,
    list: (userId: string) => [...marcasKeys.all, 'list', userId] as const,
};

// Função para buscar marcas com JOIN para campanhas
async function fetchMarcas(): Promise<Marca[]> {
    const { data, error } = await supabase
        .from('marcas')
        .select(`
            *,
            campanhas:campanha_id (
                titulo
            )
        `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
        id: item.id,
        nome: item.nome,
        descricao: item.descricao,
        descricao_produto: item.descricao_produto,
        campanha_id: item.campanha_id,
        campanha_nome: (item.campanhas as any)?.titulo,
        created_at: item.created_at,
        updated_at: item.updated_at
    }));
}

export function useMarcas() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Query principal
    const {
        data: marcas = [],
        isLoading: loading,
        refetch: refresh,
    } = useQuery({
        queryKey: marcasKeys.list(user?.id || ''),
        queryFn: fetchMarcas,
        enabled: !!user,
        staleTime: 1000 * 60 * 2,
    });

    // Mutation para adicionar
    const addMutation = useMutation({
        mutationFn: async (marca: MarcaInput) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { data, error } = await supabase
                .from('marcas')
                .insert([{
                    user_id: user.id,
                    nome: marca.nome,
                    descricao: marca.descricao || null,
                    descricao_produto: marca.descricao_produto || null,
                    campanha_id: marca.campanha_id || null
                }])
                .select(`
                    *,
                    campanhas:campanha_id (
                        titulo
                    )
                `)
                .single();

            if (error) throw error;
            return {
                id: data.id,
                nome: data.nome,
                descricao: data.descricao,
                descricao_produto: data.descricao_produto,
                campanha_id: data.campanha_id,
                campanha_nome: (data.campanhas as any)?.titulo,
                created_at: data.created_at,
                updated_at: data.updated_at
            } as Marca;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: marcasKeys.all });
            toast.success('Marca adicionada com sucesso!');
        },
        onError: (err: Error) => {
            console.error('Erro ao adicionar marca:', err);
            toast.error(`Erro ao adicionar marca: ${err.message || 'Erro desconhecido'}`);
        },
    });

    // Mutation para atualizar
    const updateMutation = useMutation({
        mutationFn: async ({ id, marca }: { id: string; marca: Partial<MarcaInput> }) => {
            const { data, error } = await supabase
                .from('marcas')
                .update({
                    nome: marca.nome,
                    descricao: marca.descricao || null,
                    descricao_produto: marca.descricao_produto || null,
                    campanha_id: marca.campanha_id || null
                })
                .eq('id', id)
                .select(`
                    *,
                    campanhas:campanha_id (
                        titulo
                    )
                `)
                .single();

            if (error) throw error;
            return {
                id: data.id,
                nome: data.nome,
                descricao: data.descricao,
                descricao_produto: data.descricao_produto,
                campanha_id: data.campanha_id,
                campanha_nome: (data.campanhas as any)?.titulo,
                created_at: data.created_at,
                updated_at: data.updated_at
            } as Marca;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: marcasKeys.all });
            toast.success('Marca atualizada com sucesso!');
        },
        onError: (err: Error) => {
            console.error('Erro ao atualizar marca:', err);
            toast.error(`Erro ao atualizar marca: ${err.message || 'Erro desconhecido'}`);
        },
    });

    // Mutation para deletar
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('marcas')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: marcasKeys.all });
            toast.success('Marca removida com sucesso!');
        },
        onError: (err: Error) => {
            console.error('Erro ao remover marca:', err);
            toast.error('Erro ao remover marca');
        },
    });

    // Realtime subscription
    useEffect(() => {
        if (!user) return;
        const channel = supabase
            .channel('realtime-marcas')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'marcas' }, () => {
                queryClient.invalidateQueries({ queryKey: marcasKeys.all });
            })
            .subscribe();
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, queryClient]);

    // API compatível
    const addMarca = async (marca: MarcaInput) => {
        return await addMutation.mutateAsync(marca);
    };

    const updateMarca = async (id: string, marca: Partial<MarcaInput>) => {
        return await updateMutation.mutateAsync({ id, marca });
    };

    const deleteMarca = async (id: string) => {
        await deleteMutation.mutateAsync(id);
    };

    return {
        marcas,
        loading,
        addMarca,
        updateMarca,
        deleteMarca,
        refresh: () => refresh(),
        // Mutations expostas
        addMutation,
        updateMutation,
        deleteMutation,
    };
}
