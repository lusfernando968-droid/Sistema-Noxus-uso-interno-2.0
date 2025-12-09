import { useMemo, useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type AulaStatus = "esboco" | "desenvolvimento" | "revisao" | "finalizacao" | "pronta";

export interface Aula {
  id: string;
  titulo: string;
  descricao?: string | null;
  status: AulaStatus;
  disciplina?: string | null;
  responsavel_id?: string | null;
  prazo?: string | null;
  modelo_id?: string | null;
  estrutura?: any | null;
  created_at?: string;
  updated_at?: string;
}

export interface AulaModelo {
  id: string;
  titulo: string;
  disciplina?: string | null;
  descricao?: string | null;
  estrutura?: any | null;
  created_at?: string;
  updated_at?: string;
}

// Query key factory
const aulasKeys = {
  all: ['aulas'] as const,
  list: (userId: string) => [...aulasKeys.all, 'list', userId] as const,
  modelos: (userId: string) => [...aulasKeys.all, 'modelos', userId] as const,
};

// Fetch functions
async function fetchAulas(): Promise<Aula[]> {
  const { data, error } = await supabase
    .from("aulas")
    .select("*")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as Aula[];
}

async function fetchModelos(): Promise<AulaModelo[]> {
  const { data, error } = await supabase
    .from("aula_modelos")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as AulaModelo[];
}

export function useAulaModelos() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: modelos = [], isLoading: loading } = useQuery({
    queryKey: aulasKeys.modelos(user?.id || ''),
    queryFn: fetchModelos,
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  return { modelos, loading };
}

export function useAulas() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Filtros locais
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AulaStatus | "all">("all");
  const [disciplinaFilter, setDisciplinaFilter] = useState<string | "all">("all");
  const [responsavelFilter, setResponsavelFilter] = useState<string | "all">("all");

  // Query principal
  const {
    data: aulas = [],
    isLoading: loading,
  } = useQuery({
    queryKey: aulasKeys.list(user?.id || ''),
    queryFn: fetchAulas,
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  // Filtro memoizado
  const filtered = useMemo(() => {
    return aulas.filter((a) => {
      const s = search.toLowerCase();
      const matchSearch = !s || a.titulo?.toLowerCase().includes(s) || a.descricao?.toLowerCase().includes(s) || a.disciplina?.toLowerCase().includes(s);
      const matchStatus = statusFilter === "all" || a.status === statusFilter;
      const matchDisciplina = disciplinaFilter === "all" || a.disciplina === disciplinaFilter;
      const matchResp = responsavelFilter === "all" || a.responsavel_id === responsavelFilter;
      return matchSearch && matchStatus && matchDisciplina && matchResp;
    });
  }, [aulas, search, statusFilter, disciplinaFilter, responsavelFilter]);

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, novoStatus }: { id: string; novoStatus: AulaStatus }) => {
      const { error } = await supabase.from("aulas").update({ status: novoStatus }).eq("id", id);
      if (error) throw error;
      await supabase.from("aula_versions").insert({ 
        aula_id: id, 
        user_id: user!.id, 
        version_number: Date.now(), 
        snapshot: { status: novoStatus } 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aulasKeys.all });
    },
    onError: (err: Error) => {
      toast({ title: "Falha ao mover aula", description: err.message });
    },
  });

  // Mutation para atualizar aula
  const updateAulaMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Aula> }) => {
      const { error } = await supabase.from("aulas").update(patch).eq("id", id);
      if (error) throw error;
      await supabase.from("aula_versions").insert({ 
        aula_id: id, 
        user_id: user!.id, 
        version_number: Date.now(), 
        snapshot: { ...patch } 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aulasKeys.all });
    },
    onError: (err: Error) => {
      toast({ title: "Falha ao salvar aula", description: err.message });
    },
  });

  // Mutation para criar aula
  const createAulaMutation = useMutation({
    mutationFn: async (overrides: Partial<Aula> = {}) => {
      if (!user) throw new Error("Sessão não encontrada");
      const payload = {
        titulo: overrides.titulo || "Nova Aula",
        descricao: overrides.descricao ?? null,
        status: (overrides.status as AulaStatus) || "esboco",
        disciplina: overrides.disciplina ?? null,
        responsavel_id: overrides.responsavel_id ?? user.id,
        prazo: overrides.prazo ?? null,
        modelo_id: overrides.modelo_id ?? null,
        estrutura: overrides.estrutura ?? null,
      };
      const { data, error } = await supabase.from("aulas").insert(payload).select("*").single();
      if (error) throw error;
      await supabase.from("aula_versions").insert({ 
        aula_id: (data as Aula).id, 
        user_id: user.id, 
        version_number: 1, 
        snapshot: payload 
      });
      return data as Aula;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aulasKeys.all });
      toast({ title: "Aula criada", description: "A aula foi adicionada" });
    },
    onError: (err: Error) => {
      toast({ title: "Falha ao criar aula", description: err.message });
    },
  });

  // Mutation para criar aula a partir de modelo
  const createFromModeloMutation = useMutation({
    mutationFn: async ({ modeloId, overrides = {} }: { modeloId: string; overrides?: Partial<Aula> }) => {
      if (!user) throw new Error("Sessão não encontrada");
      const { data: modelo } = await supabase.from("aula_modelos").select("*").eq("id", modeloId).maybeSingle();
      const payload = {
        titulo: modelo?.titulo || "Nova Aula",
        disciplina: modelo?.disciplina || null,
        descricao: modelo?.descricao || null,
        status: "esboco" as AulaStatus,
        modelo_id: modeloId,
        responsavel_id: user.id,
        estrutura: modelo?.estrutura || null,
        ...overrides,
      };
      const { data, error } = await supabase.from("aulas").insert(payload).select("*").single();
      if (error) throw error;
      await supabase.from("aula_versions").insert({ 
        aula_id: (data as Aula).id, 
        user_id: user.id, 
        version_number: 1, 
        snapshot: payload 
      });
      return data as Aula;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aulasKeys.all });
      toast({ title: "Aula criada", description: "A aula foi adicionada" });
    },
    onError: (err: Error) => {
      toast({ title: "Falha ao criar aula", description: err.message });
    },
  });

  // Mutation para deletar
  const deleteAulaMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Sessão não encontrada");
      const { error } = await supabase.from("aulas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aulasKeys.all });
      toast({ title: "Aula excluída", description: "A aula foi removida" });
    },
    onError: (err: Error) => {
      toast({ title: "Falha ao excluir aula", description: err.message, variant: "destructive" });
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('realtime-aulas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'aulas' }, () => {
        queryClient.invalidateQueries({ queryKey: aulasKeys.all });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // API compatível
  const updateStatus = useCallback(async (id: string, novoStatus: AulaStatus) => {
    await updateStatusMutation.mutateAsync({ id, novoStatus });
  }, [updateStatusMutation]);

  const updateAula = useCallback(async (id: string, patch: Partial<Aula>) => {
    try {
      await updateAulaMutation.mutateAsync({ id, patch });
      return true;
    } catch {
      return false;
    }
  }, [updateAulaMutation]);

  const createAulaFromModelo = useCallback(async (modeloId: string, overrides: Partial<Aula> = {}) => {
    try {
      return await createFromModeloMutation.mutateAsync({ modeloId, overrides });
    } catch {
      return null;
    }
  }, [createFromModeloMutation]);

  const createAula = useCallback(async (overrides: Partial<Aula> = {}) => {
    try {
      return await createAulaMutation.mutateAsync(overrides);
    } catch {
      return null;
    }
  }, [createAulaMutation]);

  const deleteAula = useCallback(async (id: string) => {
    try {
      await deleteAulaMutation.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  }, [deleteAulaMutation]);

  const createDefaultModelos = async () => {
    const modelosPadrao = [
      {
        titulo: 'Aula de Matemática Básica',
        disciplina: 'Matemática',
        descricao: 'Modelo para aulas de matemática básica',
        estrutura: [
          { tipo: 'introducao', titulo: 'Introdução', duracao: 10 },
          { tipo: 'conteudo', titulo: 'Explicação do Conceito', duracao: 25 },
          { tipo: 'exercicios', titulo: 'Exercícios Práticos', duracao: 15 },
          { tipo: 'conclusao', titulo: 'Conclusão e Tarefa', duracao: 10 }
        ]
      },
      {
        titulo: 'Aula de Português - Gramática',
        disciplina: 'Português',
        descricao: 'Modelo para aulas de gramática',
        estrutura: [
          { tipo: 'revisao', titulo: 'Revisão da Aula Anterior', duracao: 5 },
          { tipo: 'novo_conteudo', titulo: 'Novo Conteúdo', duracao: 20 },
          { tipo: 'pratica', titulo: 'Prática em Grupo', duracao: 15 },
          { tipo: 'tarefa', titulo: 'Tarefa de Casa', duracao: 5 }
        ]
      },
      {
        titulo: 'Aula de Ciências - Experimentos',
        disciplina: 'Ciências',
        descricao: 'Modelo para aulas com experimentos',
        estrutura: [
          { tipo: 'hipotese', titulo: 'Apresentação da Hipótese', duracao: 10 },
          { tipo: 'experimento', titulo: 'Experimento Prático', duracao: 30 },
          { tipo: 'registro', titulo: 'Registro dos Resultados', duracao: 10 },
          { tipo: 'analise', titulo: 'Análise e Conclusão', duracao: 10 }
        ]
      }
    ];

    try {
      const { error } = await supabase.from('aula_modelos').insert(modelosPadrao);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: aulasKeys.modelos(user?.id || '') });
    } catch (error) {
      console.error('Erro ao criar modelos padrão:', error);
      throw error;
    }
  };

  return {
    aulas,
    filtered,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    disciplinaFilter,
    setDisciplinaFilter,
    responsavelFilter,
    setResponsavelFilter,
    updateStatus,
    updateAula,
    createAulaFromModelo,
    createAula,
    deleteAula,
    createDefaultModelos,
    // Mutations expostas
    updateStatusMutation,
    updateAulaMutation,
    createAulaMutation,
    createFromModeloMutation,
    deleteAulaMutation,
  };
}
