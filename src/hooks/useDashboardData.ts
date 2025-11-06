import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, subMonths } from "date-fns";

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
  const getPreviousStart = () => {
    const now = new Date();
    switch (dateRange) {
      case "7d":
        return subDays(now, 14);
      case "30d":
        return subDays(now, 60);
      case "3m":
        return subMonths(now, 6);
      case "6m":
        return subMonths(now, 12);
      case "1y":
        return subMonths(now, 24);
      default:
        return null;
    }
  };
  const prevStart = getPreviousStart();

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

  const { data: prevProjetos, isLoading: loadingPrevProjetos } = useQuery({
    queryKey: ["projetos_prev", dateRange],
    queryFn: async () => {
      if (!dateFilter || !prevStart) return [] as any[];
      const { data, error } = await supabase
        .from("projetos")
        .select("*, clientes(nome)")
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", dateFilter.toISOString());
      if (error) throw error;
      return data || [];
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

  const { data: prevClientes, isLoading: loadingPrevClientes } = useQuery({
    queryKey: ["clientes_prev", dateRange],
    queryFn: async () => {
      if (!dateFilter || !prevStart) return [] as any[];
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", dateFilter.toISOString());
      if (error) throw error;
      return data || [];
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

  const { data: prevTransacoes, isLoading: loadingPrevTransacoes } = useQuery({
    queryKey: ["transacoes_prev", dateRange],
    queryFn: async () => {
      if (!dateFilter || !prevStart) return [] as any[];
      const { data, error } = await supabase
        .from("transacoes")
        .select("*")
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", dateFilter.toISOString());
      if (error) throw error;
      return data || [];
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

  const { data: prevAgendamentos, isLoading: loadingPrevAgendamentos } = useQuery({
    queryKey: ["agendamentos_prev", dateRange],
    queryFn: async () => {
      if (!dateFilter || !prevStart) return [] as any[];
      const { data, error } = await supabase
        .from("agendamentos")
        .select("*")
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", dateFilter.toISOString());
      if (error) throw error;
      return data || [];
    },
  });

  return {
    projetos: projetos || [],
    prevProjetos: prevProjetos || [],
    clientes: clientes || [],
    prevClientes: prevClientes || [],
    transacoes: transacoes || [],
    prevTransacoes: prevTransacoes || [],
    agendamentos: agendamentos || [],
    prevAgendamentos: prevAgendamentos || [],
    isLoading:
      loadingProjetos ||
      loadingClientes ||
      loadingTransacoes ||
      loadingAgendamentos ||
      loadingPrevProjetos ||
      loadingPrevClientes ||
      loadingPrevTransacoes ||
      loadingPrevAgendamentos,
  };
}
