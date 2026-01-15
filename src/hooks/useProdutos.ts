import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type ProdutoRecord = {
    id?: string;
    user_id?: string;
    nome: string;
    marca?: string | null;
    tipo_material: string;
    unidade: string;
    unidade_embalagem?: string | null;
    fator_conversao?: number | null;
    created_at?: string;
    updated_at?: string;
};

export const produtoSchema = z.object({
    nome: z.string().min(2, "Nome é obrigatório"),
    marca: z.string().optional().nullable(),
    tipo_material: z.string().min(1, "Tipo é obrigatório"),
    unidade: z.string().min(1, "Unidade é obrigatória"),
    unidade_embalagem: z.string().optional().nullable(),
    fator_conversao: z.number().positive().optional().nullable(),
});

export function useProdutos() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [produtos, setProdutos] = useState<ProdutoRecord[]>([]);
    const [loading, setLoading] = useState(false);

    console.log('🔧 useProdutos inicializado, user:', user?.id, 'produtos atuais:', produtos.length);

    const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;

    const fetchProdutos = async () => {
        try {
            console.log('🔄 fetchProdutos chamado, user:', user?.id);
            if (!user) {
                console.warn('⚠️ Sem usuário logado, não pode carregar produtos');
                return;
            }
            setLoading(true);
            const { data, error } = await sb
                .from("produtos")
                .select("*")
                .eq("user_id", user.id)
                .order("nome", { ascending: true });
            if (error) throw error;
            console.log('✅ Produtos carregados:', data);
            setProdutos((data || []) as any);
        } catch (err: any) {
            console.error("❌ Erro ao carregar produtos:", err);
        } finally {
            setLoading(false);
        }
    };

    const insertProduto = async (payload: ProdutoRecord) => {
        try {
            if (!user) throw new Error("Usuário não autenticado");
            const parsed = produtoSchema.parse(payload);
            const toInsert = {
                user_id: user.id,
                nome: parsed.nome,
                marca: parsed.marca ?? null,
                tipo_material: parsed.tipo_material,
                unidade: parsed.unidade,
                unidade_embalagem: parsed.unidade_embalagem ?? null,
                fator_conversao: parsed.fator_conversao ?? null,
            };
            const { data: rows, error } = await sb
                .from("produtos")
                .insert(toInsert)
                .select("*");
            if (error) throw error;
            const newProduto = rows[0] as any;
            setProdutos(prev => [...prev, newProduto].sort((a, b) => a.nome.localeCompare(b.nome)));
            toast({ title: "Produto cadastrado", description: "Produto salvo para uso futuro." });
            return newProduto;
        } catch (err: any) {
            console.error("Erro ao inserir produto:", err);
            toast({ title: "Erro ao salvar produto", description: err.message || "Verifique os dados.", variant: "destructive" });
            throw err;
        }
    };

    const updateProduto = async (id: string, changes: Partial<ProdutoRecord>) => {
        try {
            if (!user) throw new Error("Usuário não autenticado");

            const { data: rows, error } = await sb
                .from("produtos")
                .update(changes)
                .eq("id", id)
                .eq("user_id", user.id)
                .select("*");

            if (error) throw error;

            if (rows && rows.length) {
                const updated = rows[0] as any;
                setProdutos(prev => prev.map(p => p.id === id ? updated : p).sort((a, b) => a.nome.localeCompare(b.nome)));
                toast({ title: "Produto atualizado", description: "Alterações salvas com sucesso." });
            }
        } catch (err: any) {
            console.error("Erro ao atualizar produto:", err);
            toast({ title: "Erro ao atualizar", description: err.message || "Tente novamente.", variant: "destructive" });
            throw err;
        }
    };

    const deleteProduto = async (id: string) => {
        try {
            if (!user) throw new Error("Usuário não autenticado");
            const { error } = await sb
                .from("produtos")
                .delete()
                .eq("id", id)
                .eq("user_id", user.id);

            if (error) throw error;

            setProdutos(prev => prev.filter(p => p.id !== id));
            toast({ title: "Produto removido", description: "Produto excluído com sucesso." });
        } catch (err: any) {
            console.error("Erro ao remover produto:", err);
            toast({ title: "Erro ao remover", description: err.message || "Tente novamente.", variant: "destructive" });
            throw err;
        }
    };

    useEffect(() => {
        fetchProdutos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    return { produtos, loading, fetchProdutos, insertProduto, updateProduto, deleteProduto };
}
