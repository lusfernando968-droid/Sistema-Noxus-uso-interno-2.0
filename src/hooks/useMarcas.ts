import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Marca {
    id: string;
    nome: string;
    descricao?: string | null;
    descricao_produto?: string | null;
    campanha_id?: string | null;
    campanha_nome?: string; // joined from campanhas table
    created_at: string;
    updated_at: string;
}

export interface MarcaInput {
    nome: string;
    descricao?: string;
    descricao_produto?: string;
    campanha_id?: string | null;
}

export function useMarcas() {
    const [marcas, setMarcas] = useState<Marca[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMarcas();
    }, []);

    async function fetchMarcas() {
        try {
            setLoading(true);
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

            const mappedMarcas: Marca[] = (data || []).map(item => ({
                id: item.id,
                nome: item.nome,
                descricao: item.descricao,
                descricao_produto: item.descricao_produto,
                campanha_id: item.campanha_id,
                campanha_nome: item.campanhas?.titulo,
                created_at: item.created_at,
                updated_at: item.updated_at
            }));

            setMarcas(mappedMarcas);
        } catch (error) {
            console.error('Erro ao buscar marcas:', error);
            toast.error('Erro ao carregar marcas');
        } finally {
            setLoading(false);
        }
    }

    async function addMarca(marca: MarcaInput) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Usuário não autenticado');
                return;
            }

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

            const newMarca: Marca = {
                id: data.id,
                nome: data.nome,
                descricao: data.descricao,
                descricao_produto: data.descricao_produto,
                campanha_id: data.campanha_id,
                campanha_nome: data.campanhas?.titulo,
                created_at: data.created_at,
                updated_at: data.updated_at
            };

            setMarcas([newMarca, ...marcas]);
            toast.success('Marca adicionada com sucesso!');
            return newMarca;
        } catch (error: any) {
            console.error('Erro ao adicionar marca:', error);
            toast.error(`Erro ao adicionar marca: ${error.message || 'Erro desconhecido'}`);
            throw error;
        }
    }

    async function updateMarca(id: string, marca: Partial<MarcaInput>) {
        try {
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

            const updatedMarca: Marca = {
                id: data.id,
                nome: data.nome,
                descricao: data.descricao,
                descricao_produto: data.descricao_produto,
                campanha_id: data.campanha_id,
                campanha_nome: data.campanhas?.titulo,
                created_at: data.created_at,
                updated_at: data.updated_at
            };

            setMarcas(marcas.map(m => m.id === id ? updatedMarca : m));
            toast.success('Marca atualizada com sucesso!');
            return updatedMarca;
        } catch (error: any) {
            console.error('Erro ao atualizar marca:', error);
            toast.error(`Erro ao atualizar marca: ${error.message || 'Erro desconhecido'}`);
            throw error;
        }
    }

    async function deleteMarca(id: string) {
        try {
            const { error } = await supabase
                .from('marcas')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setMarcas(marcas.filter(m => m.id !== id));
            toast.success('Marca removida com sucesso!');
        } catch (error) {
            console.error('Erro ao remover marca:', error);
            toast.error('Erro ao remover marca');
        }
    }

    return {
        marcas,
        loading,
        addMarca,
        updateMarca,
        deleteMarca,
        refresh: fetchMarcas
    };
}
