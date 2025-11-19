import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type AnaliseCustoRecord = {
    id: string;
    user_id: string;
    nome_produto: string;
    custo_produto: number;
    data_inicio: string;
    data_fim?: string | null;
    qtd_sessoes: number;
    status: 'ativo' | 'concluido';
    created_at: string;
};

export function useAnaliseCusto() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [analises, setAnalises] = useState<AnaliseCustoRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;

    const fetchAnalises = async () => {
        try {
            if (!user) return;
            setLoading(true);
            const { data, error } = await sb
                .from("analise_custo")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setAnalises((data || []) as any);
        } catch (err: any) {
            console.error("Erro ao carregar análises:", err);
        } finally {
            setLoading(false);
        }
    };

    const iniciarAnalise = async (nome: string, custo: number) => {
        try {
            if (!user) throw new Error("Usuário não autenticado");

            const { data, error } = await sb
                .from("analise_custo")
                .insert({
                    user_id: user.id,
                    nome_produto: nome,
                    custo_produto: custo,
                    status: 'ativo',
                    qtd_sessoes: 0
                })
                .select("*")
                .single();

            if (error) throw error;

            setAnalises(prev => [data as any, ...prev]);
            toast({ title: "Análise iniciada", description: `Monitorando: ${nome}` });
            return data;
        } catch (err: any) {
            console.error("Erro ao iniciar análise:", err);
            toast({ title: "Erro", description: "Não foi possível iniciar a análise.", variant: "destructive" });
            throw err;
        }
    };

    const registrarUso = async (ids: string[]) => {
        try {
            if (!user || ids.length === 0) return;

            // Supabase doesn't support increment in one go easily without RPC, 
            // but for simplicity we'll fetch and update or just update blindly if we trust the logic.
            // Let's use a loop for now as it's unlikely to be many items.

            for (const id of ids) {
                // Get current count first to be safe, or use rpc if we had one. 
                // For now, let's just increment locally and push.
                const current = analises.find(a => a.id === id);
                if (!current) continue;

                const { error } = await sb
                    .from("analise_custo")
                    .update({ qtd_sessoes: current.qtd_sessoes + 1 })
                    .eq("id", id);

                if (error) throw error;
            }

            setAnalises(prev => prev.map(a => ids.includes(a.id) ? { ...a, qtd_sessoes: a.qtd_sessoes + 1 } : a));
            toast({ title: "Uso registrado", description: "Contador de sessões atualizado." });
        } catch (err: any) {
            console.error("Erro ao registrar uso:", err);
            toast({ title: "Erro", description: "Falha ao atualizar contadores.", variant: "destructive" });
        }
    };

    const finalizarAnalise = async (id: string) => {
        try {
            if (!user) return;

            const { error } = await sb
                .from("analise_custo")
                .update({
                    status: 'concluido',
                    data_fim: new Date().toISOString()
                })
                .eq("id", id);

            if (error) throw error;

            setAnalises(prev => prev.map(a => a.id === id ? { ...a, status: 'concluido', data_fim: new Date().toISOString() } : a));
            toast({ title: "Análise concluída", description: "Item movido para o histórico." });
        } catch (err: any) {
            console.error("Erro ao finalizar:", err);
            toast({ title: "Erro", description: "Não foi possível finalizar.", variant: "destructive" });
        }
    };

    const excluirAnalise = async (id: string) => {
        try {
            if (!user) return;
            const { error } = await sb
                .from("analise_custo")
                .delete()
                .eq("id", id);

            if (error) throw error;
            setAnalises(prev => prev.filter(a => a.id !== id));
            toast({ title: "Análise excluída", description: "Registro removido com sucesso." });
        } catch (err: any) {
            console.error("Erro ao excluir:", err);
            toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
        }
    }

    useEffect(() => {
        fetchAnalises();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    return {
        analises,
        loading,
        fetchAnalises,
        iniciarAnalise,
        registrarUso,
        finalizarAnalise,
        excluirAnalise
    };
}
