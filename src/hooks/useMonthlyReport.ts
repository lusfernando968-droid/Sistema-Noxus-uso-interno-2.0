import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function useMonthlyReport(selectedDate: Date) {
    // Current Month Range
    const startCurrent = startOfMonth(selectedDate);
    const endCurrent = endOfMonth(selectedDate);

    // Previous Month Range
    const startPrevious = startOfMonth(subMonths(selectedDate, 1));
    const endPrevious = endOfMonth(subMonths(selectedDate, 1));

    const { data: currentData, isLoading: loadingCurrent } = useQuery({
        queryKey: ["report_data", format(selectedDate, "yyyy-MM")],
        queryFn: async () => {
            // Parallelize requests for current month
            const [projetos, clientes, transacoes, agendamentos, orcamentos] = await Promise.all([
                supabase.from("projetos").select("*, clientes(nome)").gte("created_at", startCurrent.toISOString()).lte("created_at", endCurrent.toISOString()),
                supabase.from("clientes").select("*").gte("created_at", startCurrent.toISOString()).lte("created_at", endCurrent.toISOString()),
                supabase.from("transacoes").select("*").gte("created_at", startCurrent.toISOString()).lte("created_at", endCurrent.toISOString()),
                supabase.from("agendamentos").select("*").gte("created_at", startCurrent.toISOString()).lte("created_at", endCurrent.toISOString()),
                supabase.from("orcamentos").select("*").gte("created_at", startCurrent.toISOString()).lte("created_at", endCurrent.toISOString())
            ]);

            return {
                projetos: projetos.data || [],
                clientes: clientes.data || [],
                transacoes: transacoes.data || [],
                agendamentos: agendamentos.data || [],
                orcamentos: orcamentos.data || []
            };
        }
    });

    const { data: previousData, isLoading: loadingPrevious } = useQuery({
        queryKey: ["report_data_prev", format(selectedDate, "yyyy-MM")],
        queryFn: async () => {
            // Parallelize requests for previous month
            const [projetos, clientes, transacoes, agendamentos, orcamentos] = await Promise.all([
                supabase.from("projetos").select("*").gte("created_at", startPrevious.toISOString()).lte("created_at", endPrevious.toISOString()),
                supabase.from("clientes").select("*").gte("created_at", startPrevious.toISOString()).lte("created_at", endPrevious.toISOString()),
                supabase.from("transacoes").select("*").gte("created_at", startPrevious.toISOString()).lte("created_at", endPrevious.toISOString()),
                supabase.from("agendamentos").select("*").gte("created_at", startPrevious.toISOString()).lte("created_at", endPrevious.toISOString()),
                supabase.from("orcamentos").select("*").gte("created_at", startPrevious.toISOString()).lte("created_at", endPrevious.toISOString())
            ]);

            return {
                projetos: projetos.data || [],
                clientes: clientes.data || [],
                transacoes: transacoes.data || [],
                agendamentos: agendamentos.data || [],
                orcamentos: orcamentos.data || []
            };
        }
    });

    return {
        current: currentData || { projetos: [], clientes: [], transacoes: [], agendamentos: [], orcamentos: [] },
        previous: previousData || { projetos: [], clientes: [], transacoes: [], agendamentos: [], orcamentos: [] },
        isLoading: loadingCurrent || loadingPrevious,
        dateRange: {
            current: { start: startCurrent, end: endCurrent },
            previous: { start: startPrevious, end: endPrevious }
        }
    };
}
