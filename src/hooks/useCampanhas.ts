import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type CampanhaStatus = 'RASCUNHO' | 'ATIVA' | 'PAUSADA' | 'ENCERRADA';
export type CampanhaCanal = 'INSTAGRAM' | 'FACEBOOK' | 'TIKTOK' | 'GOOGLE_ADS' | 'ORGANICO' | 'EMAIL';
export type CampanhaEstagioFunil = 'TOPO' | 'MEIO' | 'FUNDO';

export type CampanhaRecord = {
  id?: string;
  user_id?: string;
  titulo: string;
  objetivo?: string | null;
  publico_alvo?: string | null;
  canal: CampanhaCanal;
  estagio_funil?: CampanhaEstagioFunil | null;
  orcamento?: number | null;
  data_inicio?: string | null;
  data_fim?: string | null;
  status: CampanhaStatus;
  tags?: string[] | null;
  notas?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const campanhaSchema = z.object({
  titulo: z.string().min(2),
  objetivo: z.string().optional().nullable(),
  publico_alvo: z.string().optional().nullable(),
  canal: z.enum(['INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'GOOGLE_ADS', 'ORGANICO', 'EMAIL']),
  estagio_funil: z.enum(['TOPO', 'MEIO', 'FUNDO']).optional().nullable(),
  orcamento: z.number().nonnegative().optional().nullable(),
  data_inicio: z.string().optional().nullable(),
  data_fim: z.string().optional().nullable(),
  status: z.enum(['RASCUNHO', 'ATIVA', 'PAUSADA', 'ENCERRADA']).default('RASCUNHO'),
  tags: z.array(z.string()).optional().nullable(),
  notas: z.string().optional().nullable(),
});

type ListFilters = {
  status?: CampanhaStatus | 'TODOS';
  canal?: CampanhaCanal | 'TODOS';
  periodo?: { inicio?: string; fim?: string };
  q?: string;
};

// Query key factory
const campanhasKeys = {
  all: ['campanhas'] as const,
  list: (userId: string, filters?: ListFilters) => [...campanhasKeys.all, 'list', userId, filters] as const,
};

// Função para buscar campanhas
async function fetchCampanhas(userId: string, filters?: ListFilters): Promise<CampanhaRecord[]> {
  const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
  let query = sb
    .from("campanhas")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== 'TODOS') query = query.eq('status', filters.status);
  if (filters?.canal && filters.canal !== 'TODOS') query = query.eq('canal', filters.canal);
  if (filters?.periodo?.inicio) query = query.gte('data_inicio', filters.periodo.inicio);
  if (filters?.periodo?.fim) query = query.lte('data_fim', filters.periodo.fim);
  if (filters?.q) query = query.ilike('titulo', `%${filters.q}%`);

  const { data, error } = await query;
  
  if (error) {
    if ((error as any).code === 'PGRST205' || (error as any).message?.includes('schema cache')) {
      return [];
    }
    throw error;
  }
  
  return (data || []) as CampanhaRecord[];
}

export function useCampanhas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ListFilters>({ status: 'TODOS', canal: 'TODOS' });

  // Query principal com React Query
  const {
    data: items = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: campanhasKeys.list(user?.id || '', filters),
    queryFn: () => fetchCampanhas(user!.id, filters),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const error = queryError ? (queryError as Error).message : null;

  const stats = useMemo(() => {
    const porStatus = {
      RASCUNHO: items.filter(i => i.status === 'RASCUNHO').length,
      ATIVA: items.filter(i => i.status === 'ATIVA').length,
      PAUSADA: items.filter(i => i.status === 'PAUSADA').length,
      ENCERRADA: items.filter(i => i.status === 'ENCERRADA').length,
    };
    const totalOrcamento = items.reduce((s, i) => s + (Number(i.orcamento || 0)), 0);
    return { porStatus, totalOrcamento };
  }, [items]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: async (payload: CampanhaRecord) => {
      if (!user) throw new Error("Usuário não autenticado");
      const parsed = campanhaSchema.parse(payload);
      const toInsert = {
        user_id: user.id,
        titulo: parsed.titulo,
        objetivo: parsed.objetivo ?? null,
        publico_alvo: parsed.publico_alvo ?? null,
        canal: parsed.canal,
        estagio_funil: parsed.estagio_funil ?? null,
        orcamento: parsed.orcamento ?? null,
        data_inicio: parsed.data_inicio ?? null,
        data_fim: parsed.data_fim ?? null,
        status: parsed.status,
        tags: parsed.tags ?? null,
        notas: parsed.notas ?? null,
      };
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("campanhas")
        .insert(toInsert)
        .select("*");
      if (error) {
        if ((error as any).code === 'PGRST205') {
          throw new Error('Tabela campanhas não existe. Aplique a migration.');
        }
        throw error;
      }
      return rows?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campanhasKeys.all });
      toast({ title: "Campanha criada", description: "Registro salvo com sucesso." });
    },
    onError: (err: Error) => {
      console.error("Erro ao criar campanha:", err);
      toast({ title: "Erro ao criar", description: err.message || "Verifique os dados.", variant: "destructive" });
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<CampanhaRecord> }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const merged: any = { ...changes };
      if (merged.orcamento !== undefined) merged.orcamento = Number(merged.orcamento);
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("campanhas")
        .update(merged)
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) {
        if ((error as any).code === 'PGRST205') {
          throw new Error('Tabela campanhas não existe. Aplique a migration.');
        }
        throw error;
      }
      return rows?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campanhasKeys.all });
      toast({ title: "Campanha atualizada", description: "Alterações salvas com sucesso." });
    },
    onError: (err: Error) => {
      console.error("Erro ao atualizar campanha:", err);
      toast({ title: "Erro ao atualizar", description: err.message || "Tente novamente.", variant: "destructive" });
    },
  });

  // Mutation para remover
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { error } = await sb
        .from("campanhas")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) {
        if ((error as any).code === 'PGRST205') {
          throw new Error('Tabela campanhas não existe. Aplique a migration.');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campanhasKeys.all });
      toast({ title: "Campanha removida", description: "Registro excluído." });
    },
    onError: (err: Error) => {
      console.error("Erro ao remover campanha:", err);
      toast({ title: "Erro ao remover", description: err.message || "Tente novamente.", variant: "destructive" });
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
    const channel = sb
      .channel("realtime-campanhas")
      .on("postgres_changes", { event: "*", schema: "public", table: "campanhas", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: campanhasKeys.all });
      })
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // API compatível
  const create = async (payload: CampanhaRecord) => {
    await createMutation.mutateAsync(payload);
  };

  const update = async (id: string, changes: Partial<CampanhaRecord>) => {
    await updateMutation.mutateAsync({ id, changes });
  };

  const remove = async (id: string) => {
    await removeMutation.mutateAsync(id);
  };

  const duplicate = async (id: string) => {
    const src = items.find(i => i.id === id);
    if (!src) return;
    const copy: CampanhaRecord = {
      titulo: `${src.titulo} (cópia)`,
      objetivo: src.objetivo ?? null,
      publico_alvo: src.publico_alvo ?? null,
      canal: src.canal,
      orcamento: src.orcamento ?? null,
      data_inicio: src.data_inicio ?? null,
      data_fim: src.data_fim ?? null,
      status: 'RASCUNHO',
      tags: src.tags ?? null,
      notas: src.notas ?? null,
    };
    await create(copy);
  };

  const setStatus = async (id: string, status: CampanhaStatus) => {
    await update(id, { status });
  };

  const fetchAll = (opts?: ListFilters) => {
    if (opts) setFilters(opts);
    return refetch();
  };

  return {
    items,
    stats,
    filters,
    setFilters,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
    duplicate,
    setStatus,
    // Mutations expostas
    createMutation,
    updateMutation,
    removeMutation,
  };
}
