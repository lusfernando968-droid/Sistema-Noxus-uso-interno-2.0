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
    return new Date(p.created_at) >= dateFilter;
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
    return new Date(t.created_at) >= dateFilter;
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
    return new Date(a.created_at) >= dateFilter;
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
