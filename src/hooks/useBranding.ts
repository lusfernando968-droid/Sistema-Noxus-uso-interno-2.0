import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type BrandingAssetType = 'logo' | 'color' | 'font' | 'manual';

export interface BrandingAsset {
    id: string;
    title: string;
    type: BrandingAssetType;
    asset_url?: string;
    value?: string;
    description?: string;
    created_at: string;
}

export function useBranding() {
    const [assets, setAssets] = useState<BrandingAsset[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAssets();
    }, []);

    async function fetchAssets() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('branding_assets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAssets(data || []);
        } catch (error) {
            console.error('Erro ao buscar assets de branding:', error);
            toast.error('Erro ao carregar assets de branding');
        } finally {
            setLoading(false);
        }
    }

    async function addAsset(asset: Omit<BrandingAsset, 'id' | 'created_at'>) {
        try {
            const { data, error } = await supabase
                .from('branding_assets')
                .insert([asset])
                .select()
                .single();

            if (error) throw error;

            setAssets([data, ...assets]);
            toast.success('Asset adicionado com sucesso!');
            return data;
        } catch (error) {
            console.error('Erro ao adicionar asset:', error);
            toast.error('Erro ao adicionar asset');
            throw error;
        }
    }

    async function deleteAsset(id: string) {
        try {
            const { error } = await supabase
                .from('branding_assets')
                .delete()
                .eq('id', id);

            if (error) throw error;

            setAssets(assets.filter(a => a.id !== id));
            toast.success('Asset removido com sucesso!');
        } catch (error) {
            console.error('Erro ao remover asset:', error);
            toast.error('Erro ao remover asset');
        }
    }

    return {
        assets,
        loading,
        addAsset,
        deleteAsset,
        refresh: fetchAssets
    };
}
