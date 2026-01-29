import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { subDays, subMonths, startOfDay, startOfWeek, startOfMonth, startOfYear, subWeeks, subYears } from "date-fns";

export type DateRange = "today" | "week" | "7d" | "month" | "30d" | "3m" | "6m" | "year" | "1y" | "all";

export function useDashboardData(dateRange: DateRange = "30d") {
  const getDateFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return startOfDay(now);
      case "week":
        return startOfWeek(now, { weekStartsOn: 0 }); // Sunday start
      case "7d":
        return subDays(now, 7);
      case "month":
        return startOfMonth(now);
      case "30d":
        return subDays(now, 30);
      case "3m":
        return subMonths(now, 3);
      case "6m":
        return subMonths(now, 6);
      case "year":
        return startOfYear(now);
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
      case "today":
        return subDays(startOfDay(now), 1); // Compare to yesterday
      case "week":
        return subWeeks(startOfWeek(now, { weekStartsOn: 0 }), 1); // Compare to prev week
      case "7d":
        return subDays(now, 14);
      case "month":
        return subMonths(startOfMonth(now), 1); // Compare to prev month
      case "30d":
        return subDays(now, 60);
      case "3m":
        return subMonths(now, 6);
      case "6m":
        return subMonths(now, 12);
      case "year":
        return subYears(startOfYear(now), 1); // Compare to prev year
      case "1y":
        return subMonths(now, 24);
      default:
        return null;
    }
  };
  const prevStart = getPreviousStart();

  const { data: allProjetos, isLoading: loadingProjetos } = useQuery({
    queryKey: ["projetos_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projetos")
        .select("*, clientes(nome)");
      if (error) throw error;
      return data;
    },
  });

  const projetos = allProjetos?.filter(p => {
    if (!dateFilter) return true;
    const date = new Date(p.data_inicio || p.created_at);
    return date >= dateFilter;
  }) || [];

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

  const { data: allClientes, isLoading: loadingClientes } = useQuery({
    queryKey: ["clientes_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("*");
      if (error) throw error;
      return data;
    },
  });

  const clientes = allClientes?.filter(c => {
    if (!dateFilter) return true;
    return new Date(c.created_at) >= dateFilter;
  }) || [];

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

  const { data: allTransacoes, isLoading: loadingTransacoes } = useQuery({
    queryKey: ["transacoes_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("transacoes").select("*");
      if (error) throw error;
      return data;
    },
  });

  const transacoes = allTransacoes?.filter(t => {
    if (!dateFilter) return true;
    const date = new Date(t.data_vencimento || t.data || t.created_at);
    return date >= dateFilter;
  }) || [];

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

  const { data: allAgendamentos, isLoading: loadingAgendamentos } = useQuery({
    queryKey: ["agendamentos_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agendamentos").select("*");
      if (error) throw error;
      return data;
    },
  });

  const agendamentos = allAgendamentos?.filter(a => {
    if (!dateFilter) return true;
    const date = new Date(a.data || a.created_at);
    return date >= dateFilter;
  }) || [];

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

  const { data: allOrcamentos, isLoading: loadingOrcamentos } = useQuery({
    queryKey: ["orcamentos_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orcamentos").select("*");
      if (error) throw error;
      return data;
    },
  });

  const orcamentos = allOrcamentos?.filter(o => {
    if (!dateFilter) return true;
    return new Date(o.created_at) >= dateFilter;
  }) || [];

  const { data: prevOrcamentos, isLoading: loadingPrevOrcamentos } = useQuery({
    queryKey: ["orcamentos_prev", dateRange],
    queryFn: async () => {
      if (!dateFilter || !prevStart) return [] as any[];
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*")
        .gte("created_at", prevStart.toISOString())
        .lt("created_at", dateFilter.toISOString());
      if (error) throw error;
      return data || [];
    },
  });

  return {
    projetos,
    allProjetos: allProjetos || [],
    prevProjetos: prevProjetos || [],
    clientes,
    allClientes: allClientes || [],
    prevClientes: prevClientes || [],
    transacoes,
    allTransacoes: allTransacoes || [],
    prevTransacoes: prevTransacoes || [],
    agendamentos,
    allAgendamentos: allAgendamentos || [],
    prevAgendamentos: prevAgendamentos || [],
    orcamentos,
    allOrcamentos: allOrcamentos || [],
    prevOrcamentos: prevOrcamentos || [],
    isLoading:
      loadingProjetos ||
      loadingClientes ||
      loadingTransacoes ||
      loadingAgendamentos ||
      loadingOrcamentos ||
      loadingPrevProjetos ||
      loadingPrevClientes ||
      loadingPrevTransacoes ||
      loadingPrevAgendamentos ||
      loadingPrevOrcamentos,
  };
}
