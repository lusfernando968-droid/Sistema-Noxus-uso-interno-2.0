import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ConteudoPlatform = 'instagram' | 'youtube' | 'tiktok' | 'linkedin' | 'blog';
export type ConteudoStatus = 'ideia' | 'roteiro' | 'gravacao' | 'edicao' | 'postado';

export interface ConteudoItem {
    id: string;
    title: string;
    platform: ConteudoPlatform;
    status: ConteudoStatus;
    scheduled_date?: string;
    description?: string;
    link?: string;
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
                .order('scheduled_date', { ascending: true });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Erro ao buscar conteúdo:', error);
            toast.error('Erro ao carregar lista de conteúdo');
        } finally {
            setLoading(false);
        }
    }

    async function addItem(item: Omit<ConteudoItem, 'id' | 'created_at'>) {
        try {
            const { data, error } = await supabase
                .from('conteudo_producao')
                .insert([item])
                .select()
                .single();

            if (error) throw error;

            setItems([...items, data]);
            toast.success('Conteúdo adicionado com sucesso!');
            return data;
        } catch (error) {
            console.error('Erro ao adicionar conteúdo:', error);
            toast.error('Erro ao adicionar conteúdo');
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
