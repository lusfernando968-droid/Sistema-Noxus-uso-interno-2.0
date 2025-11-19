import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AnuncioPlatform = 'meta' | 'google' | 'tiktok';
export type AnuncioStatus = 'ativo' | 'pausado' | 'concluido';

export interface AnuncioItem {
    id: string;
    campaign_name: string;
    platform: AnuncioPlatform;
    status: AnuncioStatus;
    budget: number;
    spend: number;
    reach: number;
    clicks: number;
    start_date?: string;
    end_date?: string;
    created_at: string;
}

export function useAnuncios() {
    const [items, setItems] = useState<AnuncioItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems();
    }, []);

    async function fetchItems() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('anuncios')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Erro ao buscar anúncios:', error);
            toast.error('Erro ao carregar lista de anúncios');
        } finally {
            setLoading(false);
        }
    }

    async function addItem(item: Omit<AnuncioItem, 'id' | 'created_at' | 'spend' | 'reach' | 'clicks'>) {
        try {
            const { data, error } = await supabase
                .from('anuncios')
                .insert([{ ...item, spend: 0, reach: 0, clicks: 0 }])
                .select()
                .single();

            if (error) throw error;

            setItems([data, ...items]);
            toast.success('Anúncio adicionado com sucesso!');
            return data;
        } catch (error) {
            console.error('Erro ao adicionar anúncio:', error);
            toast.error('Erro ao adicionar anúncio');
            throw error;
        }
    }

    async function updateItem(id: string, updates: Partial<AnuncioItem>) {
        try {
            const { data, error } = await supabase
                .from('anuncios')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            setItems(items.map(i => i.id === id ? data : i));
            toast.success('Anúncio atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar anúncio:', error);
            toast.error('Erro ao atualizar anúncio');
        }
    }

    async function deleteItem(id: string) {
        try {
            const { error } = await supabase
                .from('anuncios')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setItems(items.filter(i => i.id !== id));
            toast.success('Anúncio removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover anúncio:', error);
            toast.error('Erro ao remover anúncio');
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
