import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useTemporaryReferrals } from "@/hooks/useTemporaryReferrals";
import { useAssistantActivityLogger } from "@/hooks/useAssistantActivityLogger";
import { ClientesService, type ClienteComLTV } from "@/services/clientes.service";

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
  created_at?: string
};

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

export function useClientes() {
  const { user, masterId } = useAuth();
  const { toast } = useToast();
  const { setReferral, getReferral } = useTemporaryReferrals();
  const { addLog } = useAssistantActivityLogger();

  // State
  const [clientes, setClientes] = useState<ClienteComLTV[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosClientes>(initialFilters);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"nome" | "ltv" | "created_at">("ltv");
  const [availableCities, setAvailableCities] = useState<CidadeOption[]>([]);
  const [cityUsageCounts, setCityUsageCounts] = useState<Record<string, number>>({});
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [editedData, setEditedData] = useState<Record<string, Partial<Cliente>>>({});

  // Fetch cities
  const fetchAvailableCities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("cidades")
        .select("id, nome, created_at")
        .order("nome", { ascending: true });
      if (error) throw error;
      setAvailableCities((data || []).map((c: any) => ({
        id: c.id,
        nome: c.nome,
        created_at: c.created_at
      })));
    } catch (err) {
      console.warn("Tabela 'cidades' indisponível. Multiselect funcionará localmente.");
    }
  }, []);

  // Fetch clientes
  const fetchClientes = useCallback(async () => {
    try {
      if (!user || !masterId) return;

      const data = await ClientesService.fetchAll(masterId);

      // Adicionar fallback para indicado_por usando hook local
      const dataWithFallback = data.map(c => ({
        ...c,
        indicado_por: c.indicado_por ?? getReferral(c.id)
      }));

      // Calcular contagem de uso por cidade
      const usage: Record<string, number> = {};
      (dataWithFallback || []).forEach(c => {
        const names = (c.cidades && c.cidades.length > 0) ? c.cidades : (c.cidade ? [c.cidade] : []);
        names.forEach(n => {
          const key = (n || "").trim();
          if (!key) return;
          usage[key] = (usage[key] || 0) + 1;
        });
      });
      setCityUsageCounts(usage);

      setClientes(dataWithFallback);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      toast({
        title: "Erro ao carregar clientes",
        description: "Não foi possível carregar os clientes.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, masterId, getReferral, toast]);

  // Create cliente
  const createCliente = useCallback(async (
    formData: ClienteFormData,
    selectedCities: CidadeOption[],
    cityQuery: string
  ): Promise<boolean> => {
    if (!user || !masterId) return false;

    try {
      const payload: any = {
        user_id: masterId, // Use masterId (Admin's ID) as owner
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
        try {
          const ensuredCityIds: string[] = [];
          for (const nome of cityNames) {
            const existing = availableCities.find(c => (c.nome || '').toLowerCase() === nome.toLowerCase());
            if (existing?.id) {
              ensuredCityIds.push(existing.id);
            } else {
              const { data: created, error: createErr } = await supabase
                .from("cidades")
                .insert([{ user_id: masterId, nome }]) // Cities also belong to masterId
                .select();
              if (createErr) throw createErr;
              const createdId = created && created[0] ? created[0].id : undefined;
              if (createdId) {
                ensuredCityIds.push(createdId);
                setAvailableCities(prev => prev.some(x => (x.nome || '').toLowerCase() === nome.toLowerCase())
                  ? prev
                  : [...prev, { id: createdId, nome, created_at: created?.[0]?.created_at }]
                );
              }
            }
          }
          if (ensuredCityIds.length > 0) {
            const rows = ensuredCityIds.map(cid => ({ user_id: masterId, cliente_id: data[0].id, cidade_id: cid }));
            await supabase.from("clientes_cidades").insert(rows);
          }
        } catch (linkError) {
          console.warn("Não foi possível vincular cidades ao cliente:", linkError);
        }
      }

      // Adicionar cliente ao estado local
      if (data && data[0]) {
        const novoCliente: ClienteComLTV = {
          ...data[0],
          ltv: 0,
          projetos_count: 0,
          transacoes_count: 0,
          indicado_por: formData.indicado_por && formData.indicado_por !== "none" ? formData.indicado_por : null,
          cidades: cityNames.length > 0 ? cityNames : undefined
        };
        setClientes(prev => [novoCliente, ...prev]);

        // Rastrear atividade do assistente usando localStorage
        try {
          const { data: assistantData } = await supabase
            .from('assistants')
            .select('user_id, assistant_email')
            .eq('assistant_id', user.id)
            .maybeSingle();

          if (assistantData) {
            addLog({
              assistant_id: user.id,
              assistant_email: assistantData.assistant_email,
              admin_id: assistantData.user_id,
              action_type: 'CREATE_CLIENT',
              entity_id: data[0].id,
              details: { table: 'clientes', client_name: formData.nome }
            });
          }
        } catch (logError) {
          console.error('Erro ao registrar atividade do assistente:', logError);
        }
      }

      toast({
        title: "Cliente criado!",
        description: "O cliente foi adicionado com sucesso."
      });

      return true;
    } catch (error) {
      console.error("Erro ao criar cliente:", error);

      // Fallback mínimo
      try {
        const { data } = await supabase
          .from("clientes")
          .insert([{ user_id: masterId, nome: formData.nome }])
          .select();
        if (data && data[0]) {
          const novoCliente: ClienteComLTV = {
            ...data[0],
            instagram: formData.instagram || undefined,
            cidade: formData.cidade || undefined,
            ltv: 0,
            projetos_count: 0,
            transacoes_count: 0,
            indicado_por: formData.indicado_por && formData.indicado_por !== "none" ? formData.indicado_por : null,
            cidades: selectedCities.length > 0 ? selectedCities.map(c => c.nome) : undefined
          } as any;
          setClientes(prev => [novoCliente, ...prev]);
        }
        toast({
          title: "Cliente criado!",
          description: "Alguns campos novos serão persistidos após migração do banco."
        });
        return true;
      } catch (e2) {
        console.error("Fallback falhou ao criar cliente:", e2);
      }

      toast({
        title: "Erro ao criar cliente",
        description: "Não foi possível criar o cliente.",
        variant: "destructive"
      });
      return false;
    }
  }, [user, masterId, availableCities, toast]);

  // Delete cliente
  const deleteCliente = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;

      setClientes(prev => prev.filter(cliente => cliente.id !== id));
      toast({
        title: "Cliente removido!",
        description: "O cliente foi removido com sucesso."
      });
    } catch (error) {
      console.error("Erro ao deletar cliente:", error);
      toast({
        title: "Erro ao remover cliente",
        description: "Não foi possível remover o cliente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Start editing
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

  // Cancel editing
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

  // Save edit
  const saveEdit = useCallback(async (clienteId: string) => {
    const data = editedData[clienteId];
    if (!data) return;

    try {
      const { indicado_por, ...clienteData } = data;

      const { error } = await supabase.from("clientes").update(clienteData).eq("id", clienteId);
      if (error) throw error;

      if (indicado_por !== undefined) {
        const referralValue = indicado_por === "none" ? null : indicado_por;
        try {
          const { error: refErr } = await supabase
            .from("clientes")
            .update({ indicado_por: referralValue as any })
            .eq("id", clienteId);
          if (refErr) throw refErr;

          setClientes(prev => prev.map(cliente => cliente.id === clienteId ? {
            ...cliente,
            ...clienteData,
            indicado_por: referralValue || null
          } : cliente));
        } catch {
          setReferral(clienteId, referralValue);
          setClientes(prev => prev.map(cliente => cliente.id === clienteId ? {
            ...cliente,
            ...clienteData,
            indicado_por: referralValue || null
          } : cliente));
        }
      } else {
        setClientes(prev => prev.map(cliente => cliente.id === clienteId ? {
          ...cliente,
          ...clienteData
        } : cliente));
      }

      toast({
        title: "Cliente atualizado!",
        description: "As alterações foram salvas com sucesso."
      });
      cancelEditing(clienteId);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);

      // Fallback
      try {
        const { error } = await supabase.from("clientes").update({
          nome: data.nome,
          email: data.email,
          telefone: data.telefone
        }).eq("id", clienteId);
        if (!error) {
          setClientes(prev => prev.map(cliente => cliente.id === clienteId ? {
            ...cliente,
            nome: data.nome ?? cliente.nome,
            email: data.email ?? cliente.email,
            telefone: data.telefone ?? cliente.telefone,
            instagram: (data as any).instagram ?? cliente.instagram,
            cidade: (data as any).cidade ?? cliente.cidade
          } : cliente));
          toast({
            title: "Cliente atualizado parcialmente",
            description: "Campos novos serão persistidos após migração do banco."
          });
          cancelEditing(clienteId);
          return;
        }
      } catch (e2) {
        console.error("Fallback falhou ao atualizar cliente:", e2);
      }

      toast({
        title: "Erro ao atualizar cliente",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive"
      });
    }
  }, [editedData, cancelEditing, setReferral, toast]);

  // Update edited data
  const updateEditedData = useCallback((clienteId: string, field: keyof Cliente, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [clienteId]: {
        ...prev[clienteId],
        [field]: value
      }
    }));
  }, []);

  // Save all edits
  const saveAllEdits = useCallback(async () => {
    const promises = Array.from(editingRows).map(id => saveEdit(id));
    await Promise.all(promises);
  }, [editingRows, saveEdit]);

  // Filter and sort
  const filteredClientes = clientes.filter(cliente => {
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

  const sortedClientes = [...filteredClientes].sort((a, b) => {
    if (sortBy === "ltv") return b.ltv - a.ltv;
    if (sortBy === "created_at") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return a.nome.localeCompare(b.nome);
  });

  // Stats
  const totalLTV = filteredClientes.reduce((sum, c) => sum + c.ltv, 0);
  const maxLTV = Math.max(...filteredClientes.map(c => c.ltv), 0);
  const avgLTV = filteredClientes.length > 0 ? totalLTV / filteredClientes.length : 0;

  const activeFiltersCount = (() => {
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
  })();

  // Reset filters
  const resetFilters = useCallback(() => {
    setFiltros(initialFilters);
  }, []);

  // Initial load
  useEffect(() => {
    if (user && masterId) {
      fetchClientes();
      fetchAvailableCities();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, masterId]); // Apenas user e masterId como dependências


  return {
    // State
    clientes,
    sortedClientes,
    filteredClientes,
    loading,
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
    setAvailableCities,

    // Actions
    fetchClientes,
    createCliente,
    deleteCliente,
    startEditing,
    cancelEditing,
    saveEdit,
    updateEditedData,
    saveAllEdits,
    resetFilters,

    // Constants
    initialFormData
  };
}

// Helper functions exported for components
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

