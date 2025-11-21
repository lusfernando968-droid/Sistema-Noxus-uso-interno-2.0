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

// Helper to map frontend type to DB type
const mapTypeToDB = (type: BrandingAssetType): string => {
    switch (type) {
        case 'logo': return 'LOGO';
        case 'color': return 'PALETA_CORES';
        case 'font': return 'TIPOGRAFIA';
        case 'manual': return 'DIRETRIZ';
        default: return 'TEMPLATE';
    }
};

// Helper to map DB type to frontend type
const mapTypeFromDB = (type: string): BrandingAssetType => {
    switch (type) {
        case 'LOGO': return 'logo';
        case 'PALETA_CORES': return 'color';
        case 'TIPOGRAFIA': return 'font';
        case 'DIRETRIZ': return 'manual';
        default: return 'manual'; // fallback
    }
};

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
                .from('ativos_marca')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mappedAssets: BrandingAsset[] = (data || []).map(item => ({
                id: item.id,
                title: item.nome,
                type: mapTypeFromDB(item.tipo),
                asset_url: item.arquivo_url,
                value: item.dados_json?.value,
                description: item.descricao,
                created_at: item.created_at
            }));

            setAssets(mappedAssets);
        } catch (error) {
            console.error('Erro ao buscar assets de branding:', error);
            toast.error('Erro ao carregar assets de branding');
        } finally {
            setLoading(false);
        }
    }

    async function addAsset(asset: Omit<BrandingAsset, 'id' | 'created_at'>) {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Usuário não autenticado');
                return;
            }

            const dbAsset = {
                user_id: user.id,
                nome: asset.title,
                tipo: mapTypeToDB(asset.type),
                arquivo_url: asset.asset_url,
                dados_json: asset.value ? { value: asset.value } : null,
                descricao: asset.description
            };

            const { data, error } = await supabase
                .from('ativos_marca')
                .insert([dbAsset])
                .select()
                .single();

            if (error) throw error;

            const newAsset: BrandingAsset = {
                id: data.id,
                title: data.nome,
                type: mapTypeFromDB(data.tipo),
                asset_url: data.arquivo_url,
                value: data.dados_json?.value,
                description: data.descricao,
                created_at: data.created_at
            };

            setAssets([newAsset, ...assets]);
            toast.success('Asset adicionado com sucesso!');
            return newAsset;
        } catch (error: any) {
            console.error('Erro ao adicionar asset:', error);
            toast.error(`Erro ao adicionar asset: ${error.message || 'Erro desconhecido'}`);
            throw error;
        }
    }

    async function deleteAsset(id: string) {
        try {
            const { error } = await supabase
                .from('ativos_marca')
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

    async function uploadImage(file: File): Promise<string> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('branding')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('branding')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (error: any) {
            console.error('Erro ao fazer upload da imagem:', error);
            toast.error(`Erro ao fazer upload: ${error.message}`);
            throw error;
        }
    }

    return {
        assets,
        loading,
        addAsset,
        deleteAsset,
        uploadImage,
        refresh: fetchAssets
    };
}
