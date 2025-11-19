import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, subMonths } from "date-fns";

export type DateRange = "7d" | "30d" | "3m" | "6m" | "1y" | "all";

export function useInsightsData(dateRange: DateRange = "30d") {
    const getDateFilter = () => {
        const now = new Date();
        switch (dateRange) {
            case "7d": return subDays(now, 7);
            case "30d": return subDays(now, 30);
            case "3m": return subMonths(now, 3);
            case "6m": return subMonths(now, 6);
            case "1y": return subMonths(now, 12);
            default: return null;
        }
    };

    const dateFilter = getDateFilter();

    // Helper to apply date filter if field exists
    const applyDateFilter = (query: any, field: string) => {
        if (dateFilter) {
            return query.gte(field, dateFilter.toISOString());
        }
        return query;
    };

    const { data: clientes, isLoading: loadingClientes } = useQuery({
        queryKey: ["insights_clientes", dateRange],
        queryFn: async () => {
            const { data, error } = await supabase.from("clientes").select("*");
            if (error) throw error;
            return data || [];
        },
    });

    const { data: projetos, isLoading: loadingProjetos } = useQuery({
        queryKey: ["insights_projetos", dateRange],
        queryFn: async () => {
            let query = supabase.from("projetos").select("*, clientes(nome)");
            if (dateFilter) query = query.gte("created_at", dateFilter.toISOString());
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
    });

    const { data: transacoes, isLoading: loadingTransacoes } = useQuery({
        queryKey: ["insights_transacoes", dateRange],
        queryFn: async () => {
            let query = supabase.from("transacoes").select("*");
            if (dateFilter) query = query.gte("data", dateFilter.toISOString());
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
    });

    const { data: agendamentos, isLoading: loadingAgendamentos } = useQuery({
        queryKey: ["insights_agendamentos", dateRange],
        queryFn: async () => {
            let query = supabase.from("agendamentos").select("*");
            if (dateFilter) query = query.gte("data", dateFilter.toISOString());
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
    });

    const { data: campanhas, isLoading: loadingCampanhas } = useQuery({
        queryKey: ["insights_campanhas", dateRange],
        queryFn: async () => {
            const { data, error } = await supabase.from("campanhas").select("*");
            if (error) {
                // Fail gracefully if table doesn't exist yet
                if ((error as any).code === '42P01') return [];
                throw error;
            }
            return data || [];
        },
    });

    const { data: estoque, isLoading: loadingEstoque } = useQuery({
        queryKey: ["insights_estoque"],
        queryFn: async () => {
            const { data, error } = await supabase.from("estoque_materiais").select("*");
            if (error) {
                if ((error as any).code === '42P01') return [];
                throw error;
            }
            return data || [];
        },
    });

    const { data: produtos, isLoading: loadingProdutos } = useQuery({
        queryKey: ["insights_produtos"],
        queryFn: async () => {
            const { data, error } = await supabase.from("produtos").select("*");
            if (error) {
                if ((error as any).code === '42P01') return [];
                throw error;
            }
            return data || [];
        },
    });

    const { data: metas, isLoading: loadingMetas } = useQuery({
        queryKey: ["insights_metas"],
        queryFn: async () => {
            const { data, error } = await supabase.from("metas").select("*");
            if (error) {
                if ((error as any).code === '42P01') return [];
                throw error;
            }
            return data || [];
        },
    });

    const { data: financeiroGeral, isLoading: loadingFinanceiro } = useQuery({
        queryKey: ["insights_financeiro_geral", dateRange],
        queryFn: async () => {
            let query = supabase.from("financeiro_geral").select("*");
            if (dateFilter) query = query.gte("data", dateFilter.toISOString());
            const { data, error } = await query;
            if (error) {
                if ((error as any).code === '42P01') return [];
                throw error;
            }
            return data || [];
        },
    });

    return {
        clientes: clientes || [],
        projetos: projetos || [],
        transacoes: transacoes || [],
        agendamentos: agendamentos || [],
        campanhas: campanhas || [],
        estoque: estoque || [],
        produtos: produtos || [],
        metas: metas || [],
        financeiroGeral: financeiroGeral || [],
        isLoading:
            loadingClientes ||
            loadingProjetos ||
            loadingTransacoes ||
            loadingAgendamentos ||
            loadingCampanhas ||
            loadingEstoque ||
            loadingProdutos ||
            loadingMetas ||
            loadingFinanceiro,
    };
}
