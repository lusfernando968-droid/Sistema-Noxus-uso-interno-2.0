import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfDay, endOfDay, subDays, subMonths } from "date-fns";

export type DateRange = "7d" | "30d" | "3m" | "6m" | "1y" | "all";

export function useDashboardData(dateRange: DateRange = "30d") {
  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "7d":
        return subDays(now, 7);
      case "30d":
        return subDays(now, 30);
      case "3m":
        return subMonths(now, 3);
      case "6m":
        return subMonths(now, 6);
      case "1y":
        return subMonths(now, 12);
      default:
        return null;
    }
  };

  const dateFilter = getDateFilter();

  const { data: projetos, isLoading: loadingProjetos } = useQuery({
    queryKey: ["projetos", dateRange],
    queryFn: async () => {
      let query = supabase
        .from("projetos")
        .select("*, clientes(nome)");
      
      if (dateFilter) {
        query = query.gte("created_at", dateFilter.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: clientes, isLoading: loadingClientes } = useQuery({
    queryKey: ["clientes", dateRange],
    queryFn: async () => {
      let query = supabase.from("clientes").select("*");
      
      if (dateFilter) {
        query = query.gte("created_at", dateFilter.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: transacoes, isLoading: loadingTransacoes } = useQuery({
    queryKey: ["transacoes", dateRange],
    queryFn: async () => {
      let query = supabase.from("transacoes").select("*");
      
      if (dateFilter) {
        query = query.gte("created_at", dateFilter.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: agendamentos, isLoading: loadingAgendamentos } = useQuery({
    queryKey: ["agendamentos", dateRange],
    queryFn: async () => {
      let query = supabase.from("agendamentos").select("*");
      
      if (dateFilter) {
        query = query.gte("created_at", dateFilter.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return {
    projetos: projetos || [],
    clientes: clientes || [],
    transacoes: transacoes || [],
    agendamentos: agendamentos || [],
    isLoading: loadingProjetos || loadingClientes || loadingTransacoes || loadingAgendamentos,
  };
}
