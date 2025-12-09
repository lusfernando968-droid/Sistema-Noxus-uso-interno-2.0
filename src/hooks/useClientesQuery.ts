/**
 * Hook useClientesQuery - React Query para Clientes
 * 
 * Implementa:
 * - useQuery para busca de clientes com cache automático
 * - useMutation para operações CRUD com invalidação de cache
 * - Query keys tipadas para cache granular
 * - Stale time e cache time otimizados
 * 
 * @example
 * ```tsx
 * const { 
 *   clientes, 
 *   isLoading, 
 *   createCliente, 
 *   updateCliente, 
 *   deleteCliente 
 * } = useClientesQuery();
 * ```
 */
import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTemporaryReferrals } from "@/hooks/useTemporaryReferrals";
import { ClientesService, type ClienteComLTV } from "@/services/clientes.service";

// ============================================================
// QUERY KEYS
// ============================================================

export const clientesKeys = {
  all: ['clientes'] as const,
  lists: () => [...clientesKeys.all, 'list'] as const,
  list: (userId: string) => [...clientesKeys.lists(), userId] as const,
  details: () => [...clientesKeys.all, 'detail'] as const,
  detail: (id: string) => [...clientesKeys.details(), id] as const,
  cities: () => [...clientesKeys.all, 'cities'] as const,
  citiesList: (userId: string) => [...clientesKeys.cities(), userId] as const,
};

// ============================================================
// TYPES
// ============================================================

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  documento?: string;
  endereco?: string;
  instagram?: string;
  cidade?: string;
  cidades?: string[];
  indicado_por?: string;
  data_aniversario?: string;
  created_at: string;
}

export interface FiltrosClientes {
  cidades: string[];
  hasInstagram: boolean;
  ltvMin: number;
  ltvMax: number;
  dataInicio: string;
  dataFim: string;
  tipoIndicacao: "todos" | "direto" | "indicado" | "indica_outros";
  indicadoPorId: string;
  projetosMin: number;
  transacoesMin: number;
}

export interface ClienteFormData {
  nome: string;
  email: string;
  telefone: string;
  instagram: string;
  cidade: string;
  indicado_por: string;
  data_aniversario: string;
}

export type CidadeOption = { 
  id?: string; 
  nome: string; 
  created_at?: string;
};

// ============================================================
// INITIAL VALUES
// ============================================================

const initialFilters: FiltrosClientes = {
  cidades: [],
  hasInstagram: false,
  ltvMin: 0,
  ltvMax: 0,
  dataInicio: "",
  dataFim: "",
  tipoIndicacao: "todos",
  indicadoPorId: "todos",
  projetosMin: 0,
  transacoesMin: 0
};

const initialFormData: ClienteFormData = {
  nome: "",
  email: "",
  telefone: "",
  instagram: "",
  cidade: "",
  indicado_por: "",
  data_aniversario: ""
};

// ============================================================
// FETCH FUNCTIONS
// ============================================================

async function fetchClientes(userId: string): Promise<ClienteComLTV[]> {
  return ClientesService.fetchAll(userId);
}

async function fetchCidades(): Promise<CidadeOption[]> {
  const { data, error } = await supabase
    .from("cidades")
    .select("id, nome, created_at")
    .order("nome", { ascending: true });
  
  if (error) throw error;
  
  return (data || []).map((c: any) => ({ 
    id: c.id, 
    nome: c.nome, 
    created_at: c.created_at 
  }));
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================

export function useClientesQuery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setReferral, getReferral } = useTemporaryReferrals();

  // State local para UI
  const [filtros, setFiltros] = useState<FiltrosClientes>(initialFilters);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"nome" | "ltv" | "created_at">("ltv");
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [editedData, setEditedData] = useState<Record<string, Partial<Cliente>>>({});

  // ============================================================
  // QUERIES
  // ============================================================

  // Query principal - clientes com LTV
  const {
    data: clientesRaw = [],
    isLoading: loading,
    error: queryError,
    refetch: refetchClientes,
  } = useQuery({
    queryKey: clientesKeys.list(user?.id || ''),
    queryFn: () => fetchClientes(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 5, // 5 minutos
  });

  // Query de cidades
  const {
    data: availableCities = [],
  } = useQuery({
    queryKey: clientesKeys.citiesList(user?.id || ''),
    queryFn: fetchCidades,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Adicionar fallback para indicado_por
  const clientes = useMemo(() => {
    return clientesRaw.map(c => ({
      ...c,
      indicado_por: c.indicado_por ?? getReferral(c.id)
    }));
  }, [clientesRaw, getReferral]);

  // Calcular contagem de uso por cidade
  const cityUsageCounts = useMemo(() => {
    const usage: Record<string, number> = {};
    clientes.forEach(c => {
      const names = (c.cidades && c.cidades.length > 0) ? c.cidades : (c.cidade ? [c.cidade] : []);
      names.forEach(n => {
        const key = (n || "").trim();
        if (!key) return;
        usage[key] = (usage[key] || 0) + 1;
      });
    });
    return usage;
  }, [clientes]);

  // ============================================================
  // MUTATIONS
  // ============================================================

  // Mutation para criar cliente
  const createMutation = useMutation({
    mutationFn: async ({ 
      formData, 
      selectedCities, 
      cityQuery 
    }: { 
      formData: ClienteFormData; 
      selectedCities: CidadeOption[]; 
      cityQuery: string;
    }) => {
      if (!user) throw new Error("Usuário não autenticado");

      const payload: any = {
        user_id: user.id,
        nome: formData.nome,
      };
      if (formData.email) payload.email = formData.email;
      if (formData.telefone) payload.telefone = formData.telefone;
      if (formData.instagram) payload.instagram = formData.instagram;
      if (formData.cidade) payload.cidade = formData.cidade;
      if (formData.data_aniversario) payload.data_aniversario = formData.data_aniversario;
      if (formData.indicado_por && formData.indicado_por !== "none") {
        payload.indicado_por = formData.indicado_por;
      }

      const cityNames: string[] = (selectedCities.length > 0
        ? selectedCities.map(c => (c.nome || '').trim()).filter(Boolean)
        : ((cityQuery || '').trim() ? [(cityQuery || '').trim()] : [])
      );

      const { data, error } = await supabase
        .from("clientes")
        .insert([payload])
        .select();
      if (error) throw error;

      // Vincular cidades ao cliente
      if (data && data[0] && cityNames.length > 0) {
        const ensuredCityIds: string[] = [];
        for (const nome of cityNames) {
          const existing = availableCities.find(c => (c.nome || '').toLowerCase() === nome.toLowerCase());
          if (existing?.id) {
            ensuredCityIds.push(existing.id);
          } else {
            const { data: created, error: createErr } = await supabase
              .from("cidades")
              .insert([{ user_id: user.id, nome }])
              .select();
            if (!createErr && created?.[0]?.id) {
              ensuredCityIds.push(created[0].id);
            }
          }
        }
        if (ensuredCityIds.length > 0) {
          const rows = ensuredCityIds.map(cid => ({ 
            user_id: user.id, 
            cliente_id: data[0].id, 
            cidade_id: cid 
          }));
          await supabase.from("clientes_cidades").insert(rows);
        }
      }

      return { 
        cliente: data?.[0], 
        cityNames,
        indicado_por: formData.indicado_por && formData.indicado_por !== "none" ? formData.indicado_por : null 
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: clientesKeys.cities() });
      toast({
        title: "Cliente criado!",
        description: "O cliente foi adicionado com sucesso."
      });
    },
    onError: (error: Error) => {
      console.error("Erro ao criar cliente:", error);
      toast({
        title: "Erro ao criar cliente",
        description: error.message || "Não foi possível criar o cliente.",
        variant: "destructive"
      });
    },
  });

  // Mutation para atualizar cliente
  const updateMutation = useMutation({
    mutationFn: async ({ 
      clienteId, 
      data 
    }: { 
      clienteId: string; 
      data: Partial<Cliente>;
    }) => {
      const { indicado_por, ...clienteData } = data;
      
      const { error } = await supabase
        .from("clientes")
        .update(clienteData)
        .eq("id", clienteId);
      if (error) throw error;

      if (indicado_por !== undefined) {
        const referralValue = indicado_por === "none" ? null : indicado_por;
        const { error: refErr } = await supabase
          .from("clientes")
          .update({ indicado_por: referralValue as any })
          .eq("id", clienteId);
        
        if (refErr) {
          // Fallback para armazenamento local
          setReferral(clienteId, referralValue);
        }
      }

      return { clienteId, data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesKeys.lists() });
      toast({
        title: "Cliente atualizado!",
        description: "As alterações foram salvas com sucesso."
      });
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar cliente:", error);
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message || "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    },
  });

  // Mutation para deletar cliente
  const deleteMutation = useMutation({
    mutationFn: async (clienteId: string) => {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", clienteId);
      if (error) throw error;
      return clienteId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesKeys.lists() });
      toast({
        title: "Cliente removido!",
        description: "O cliente foi removido com sucesso."
      });
    },
    onError: (error: Error) => {
      console.error("Erro ao deletar cliente:", error);
      toast({
        title: "Erro ao remover cliente",
        description: error.message || "Não foi possível remover o cliente.",
        variant: "destructive"
      });
    },
  });

  // ============================================================
  // ACTIONS (wrappers para mutations)
  // ============================================================

  const createCliente = useCallback(async (
    formData: ClienteFormData,
    selectedCities: CidadeOption[],
    cityQuery: string
  ): Promise<boolean> => {
    try {
      await createMutation.mutateAsync({ formData, selectedCities, cityQuery });
      return true;
    } catch {
      return false;
    }
  }, [createMutation]);

  const deleteCliente = useCallback(async (id: string) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  // ============================================================
  // EDITING HELPERS
  // ============================================================

  const startEditing = useCallback((clienteId: string, cliente: Cliente) => {
    setEditingRows(prev => new Set(prev).add(clienteId));
    setEditedData(prev => ({
      ...prev,
      [clienteId]: {
        nome: cliente.nome,
        email: cliente.email,
        telefone: cliente.telefone,
        instagram: cliente.instagram || "",
        cidade: cliente.cidade || "",
        indicado_por: cliente.indicado_por || "none"
      }
    }));
  }, []);

  const cancelEditing = useCallback((clienteId: string) => {
    setEditingRows(prev => {
      const next = new Set(prev);
      next.delete(clienteId);
      return next;
    });
    setEditedData(prev => {
      const next = { ...prev };
      delete next[clienteId];
      return next;
    });
  }, []);

  const saveEdit = useCallback(async (clienteId: string) => {
    const data = editedData[clienteId];
    if (!data) return;
    
    try {
      await updateMutation.mutateAsync({ clienteId, data });
      cancelEditing(clienteId);
    } catch {
      // Error já tratado pelo mutation
    }
  }, [editedData, updateMutation, cancelEditing]);

  const updateEditedData = useCallback((clienteId: string, field: keyof Cliente, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [clienteId]: {
        ...prev[clienteId],
        [field]: value
      }
    }));
  }, []);

  const saveAllEdits = useCallback(async () => {
    const promises = Array.from(editingRows).map(id => saveEdit(id));
    await Promise.all(promises);
  }, [editingRows, saveEdit]);

  // ============================================================
  // FILTERING & SORTING
  // ============================================================

  const filteredClientes = useMemo(() => {
    return clientes.filter(cliente => {
      const term = searchTerm.trim().toLowerCase();
      const passesSearch = term === "" || 
        cliente.nome.toLowerCase().includes(term) || 
        cliente.email?.toLowerCase().includes(term) || 
        cliente.telefone?.toLowerCase().includes(term);
      if (!passesSearch) return false;

      if (filtros.cidades.length > 0) {
        const clientCities = (cliente.cidades && cliente.cidades.length > 0)
          ? cliente.cidades
          : (cliente.cidade ? [cliente.cidade] : []);
        const hasMatch = clientCities.some(cc => 
          filtros.cidades.some(fc => (cc || "").toLowerCase() === fc.toLowerCase())
        );
        if (!hasMatch) return false;
      }

      if (filtros.hasInstagram && !cliente.instagram) return false;
      if (cliente.ltv < filtros.ltvMin) return false;
      if (filtros.ltvMax > 0 && cliente.ltv > filtros.ltvMax) return false;

      const created = new Date(cliente.created_at).getTime();
      if (filtros.dataInicio) {
        const di = new Date(filtros.dataInicio).getTime();
        if (created < di) return false;
      }
      if (filtros.dataFim) {
        const df = new Date(filtros.dataFim).getTime();
        if (created > df) return false;
      }

      if (filtros.tipoIndicacao === "direto" && cliente.indicado_por) return false;
      if (filtros.tipoIndicacao === "indicado" && !cliente.indicado_por) return false;
      if (filtros.tipoIndicacao === "indica_outros") {
        const indicaAlguem = clientes.some(c => c.indicado_por === cliente.id);
        if (!indicaAlguem) return false;
      }

      if (filtros.indicadoPorId !== "todos" && filtros.indicadoPorId !== "" && cliente.indicado_por !== filtros.indicadoPorId) return false;
      if (cliente.projetos_count < filtros.projetosMin) return false;
      if (cliente.transacoes_count < filtros.transacoesMin) return false;

      return true;
    });
  }, [clientes, searchTerm, filtros]);

  const sortedClientes = useMemo(() => {
    return [...filteredClientes].sort((a, b) => {
      if (sortBy === "ltv") return b.ltv - a.ltv;
      if (sortBy === "created_at") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return a.nome.localeCompare(b.nome);
    });
  }, [filteredClientes, sortBy]);

  // ============================================================
  // STATS
  // ============================================================

  const totalLTV = useMemo(() => 
    filteredClientes.reduce((sum, c) => sum + c.ltv, 0), 
    [filteredClientes]
  );

  const maxLTV = useMemo(() => 
    Math.max(...filteredClientes.map(c => c.ltv), 0), 
    [filteredClientes]
  );

  const avgLTV = useMemo(() => 
    filteredClientes.length > 0 ? totalLTV / filteredClientes.length : 0, 
    [filteredClientes, totalLTV]
  );

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filtros.cidades.length > 0) count++;
    if (filtros.hasInstagram) count++;
    if (filtros.ltvMin > 0) count++;
    if (filtros.ltvMax > 0) count++;
    if (filtros.dataInicio) count++;
    if (filtros.dataFim) count++;
    if (filtros.tipoIndicacao !== "todos") count++;
    if (filtros.indicadoPorId !== "todos" && filtros.indicadoPorId !== "") count++;
    if (filtros.projetosMin > 0) count++;
    if (filtros.transacoesMin > 0) count++;
    return count;
  }, [filtros]);

  const resetFilters = useCallback(() => {
    setFiltros(initialFilters);
  }, []);

  // ============================================================
  // RETURN
  // ============================================================

  return {
    // State
    clientes,
    sortedClientes,
    filteredClientes,
    loading,
    isLoading: loading,
    error: queryError ? (queryError as Error).message : null,
    filtros,
    searchTerm,
    sortBy,
    availableCities,
    cityUsageCounts,
    editingRows,
    editedData,
    
    // Stats
    totalLTV,
    maxLTV,
    avgLTV,
    activeFiltersCount,
    
    // Setters
    setFiltros,
    setSearchTerm,
    setSortBy,
    setAvailableCities: () => {}, // Mantido para compatibilidade
    
    // Actions
    fetchClientes: refetchClientes,
    createCliente,
    deleteCliente,
    startEditing,
    cancelEditing,
    saveEdit,
    updateEditedData,
    saveAllEdits,
    resetFilters,
    
    // Mutations status
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Constants
    initialFormData
  };
}

// ============================================================
// HELPER FUNCTIONS (exportadas para uso em componentes)
// ============================================================

export const getLTVColor = (ltv: number, maxLtv: number): string => {
  const percentage = maxLtv > 0 ? ltv / maxLtv * 100 : 0;
  if (percentage >= 75) return "text-success bg-success/10 border-success/20";
  if (percentage >= 50) return "text-primary bg-primary/10 border-primary/20";
  if (percentage >= 25) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
  return "text-muted-foreground bg-muted/10 border-muted/20";
};

export const getLTVLabel = (ltv: number): string => {
  if (ltv >= 50000) return "VIP";
  if (ltv >= 20000) return "Premium";
  if (ltv >= 5000) return "Regular";
  if (ltv > 0) return "Novo";
  return "Sem faturamento";
};

export { type ClienteComLTV };

