import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ConteudoPlatform = 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'YOUTUBE' | 'LINKEDIN' | 'EMAIL' | 'BLOG' | 'CURSO_NOXUS_MVP';
export type ConteudoStatus = 'IDEIA' | 'EM_PRODUCAO' | 'REVISAO' | 'AGENDADO' | 'PUBLICADO' | 'ARQUIVADO';
export type ConteudoTipo = 'POST' | 'STORY' | 'REEL' | 'VIDEO' | 'ARTIGO' | 'EMAIL';

export interface ConteudoItem {
    id: string;
    user_id: string;
    titulo: string;
    descricao?: string;
    tipo: ConteudoTipo;
    plataforma: ConteudoPlatform;
    status: ConteudoStatus;
    data_agendamento?: string;
    data_publicacao?: string;
    link?: string;
    visualizacoes?: number;
    engajamento?: number;
    cliques?: number;
    tags?: string[];
    notas?: string;
    created_at: string;
}

export function useConteudo() {
    const [items, setItems] = useState<ConteudoItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems();
    }, []);

    async function fetchItems() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('conteudo_producao')
                .select('*')
                .order('data_agendamento', { ascending: true });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Erro ao buscar conteúdo:', error);
            toast.error('Erro ao carregar lista de conteúdo');
        } finally {
            setLoading(false);
        }
    }

    async function addItem(item: Omit<ConteudoItem, 'id' | 'created_at' | 'user_id'>) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Você precisa estar logado para adicionar conteúdo');
                return;
            }

            const { data, error } = await supabase
                .from('conteudo_producao')
                .insert([{ ...item, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;

            setItems([...items, data]);
            toast.success('Conteúdo adicionado com sucesso!');
            return data;
        } catch (error: any) {
            console.error('Erro ao adicionar conteúdo:', error);
            toast.error(`Erro ao adicionar conteúdo: ${error.message || 'Erro desconhecido'}`);
            throw error;
        }
    }

    async function updateItem(id: string, updates: Partial<ConteudoItem>) {
        try {
            const { data, error } = await supabase
                .from('conteudo_producao')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setItems(items.map(i => i.id === id ? data : i));
            toast.success('Conteúdo atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar conteúdo:', error);
            toast.error('Erro ao atualizar conteúdo');
        }
    }

    async function deleteItem(id: string) {
        try {
            const { error } = await supabase
                .from('conteudo_producao')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setItems(items.filter(i => i.id !== id));
            toast.success('Conteúdo removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover conteúdo:', error);
            toast.error('Erro ao remover conteúdo');
        }
    }

    return {
        items,
        loading,
        addItem,
        updateItem,
        deleteItem,
        refresh: fetchItems
    };
}
