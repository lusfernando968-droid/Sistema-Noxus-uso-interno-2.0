import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type BancoRecord = {
  id: string;
  codigo: string;
  nome: string;
  nome_curto: string;
  cor_primaria: string;
  cor_secundaria: string;
  logo_url?: string | null;
  site_url?: string | null;
  ativo?: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ContaBancariaRecord = {
  id?: string;
  user_id?: string;
  nome: string;
  banco?: string | null;
  banco_id?: string | null;
  agencia?: string | null;
  numero?: string | null;
  tipo?: string | null;
  moeda?: string;
  saldo_inicial?: number;
  is_arquivada?: boolean;
  arquivado_em?: string | null;
  created_at?: string;
  updated_at?: string;
  banco_detalhes?: BancoRecord | null;
};

export const contaBancariaSchema = z.object({
  nome: z.string().min(2, "Nome muito curto"),
  banco: z.string().optional(),
  banco_id: z.string().uuid().optional(),
  agencia: z.string().optional(),
  numero: z.string().optional(),
  tipo: z.string().optional(),
  moeda: z.string().default("BRL"),
  saldo_inicial: z
    .number({ invalid_type_error: "Saldo inicial deve ser numérico" })
    .nonnegative("Saldo inicial não pode ser negativo")
    .default(0),
});

// Query key factory
const contasKeys = {
  all: ['contas_bancarias'] as const,
  list: (userId: string, incluirArquivadas?: boolean) => 
    [...contasKeys.all, 'list', userId, incluirArquivadas] as const,
};

// Função para buscar contas
async function fetchContas(
  userId: string, 
  incluirArquivadas?: boolean
): Promise<ContaBancariaRecord[]> {
  const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
  let query = sb
    .from("contas_bancarias")
    .select(`*, banco_detalhes:bancos(*)`)
    .eq("user_id", userId)
    .order("nome", { ascending: true });
  
  if (!incluirArquivadas) query = query.eq("is_arquivada", false);
  
  const { data, error } = await query;
  if (error) throw error;
  
  return (data || []).map((conta: any) => ({
    ...conta,
    banco_detalhes: conta.banco_detalhes || null
  }));
}

export function useContasBancarias() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query principal
  const {
    data: items = [],
    isLoading: loading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: contasKeys.list(user?.id || '', false),
    queryFn: () => fetchContas(user!.id, false),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });

  const error = queryError ? (queryError as Error).message : null;

  // Mutation para inserir
  const insertMutation = useMutation({
    mutationFn: async (payload: ContaBancariaRecord) => {
      if (!user) throw new Error("Usuário não autenticado");
      const parsed = contaBancariaSchema.parse(payload);
      const toInsert: any = {
        ...parsed,
        user_id: user.id,
        banco: parsed.banco ?? null,
        banco_id: parsed.banco_id ?? null,
        agencia: parsed.agencia ?? null,
        numero: parsed.numero ?? null,
        tipo: parsed.tipo ?? null,
      };
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("contas_bancarias")
        .insert(toInsert)
        .select(`*, banco_detalhes:bancos(*)`);
      
      if (error) throw error;
      return rows?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasKeys.all });
      toast({ title: "Conta criada", description: "Conta bancária salva com sucesso." });
    },
    onError: (err: Error) => {
      console.error("Erro ao inserir em contas_bancarias:", err);
      toast({ title: "Erro ao criar conta", description: err.message || "Verifique os dados.", variant: "destructive" });
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<ContaBancariaRecord> }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const merged: any = { ...changes };
      if (merged.saldo_inicial !== undefined) merged.saldo_inicial = Number(merged.saldo_inicial);
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("contas_bancarias")
        .update(merged)
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      return rows?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasKeys.all });
      toast({ title: "Conta atualizada", description: "Alterações salvas com sucesso." });
    },
    onError: (err: Error) => {
      console.error("Erro ao atualizar contas_bancarias:", err);
      toast({ title: "Erro ao atualizar", description: err.message || "Tente novamente.", variant: "destructive" });
    },
  });

  // Mutation para arquivar
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { error } = await sb
        .from("contas_bancarias")
        .update({ is_arquivada: true, arquivado_em: new Date().toISOString() })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasKeys.all });
      toast({ title: "Conta arquivada", description: "A conta foi arquivada." });
    },
    onError: (err: Error) => {
      console.error("Erro ao arquivar conta:", err);
      toast({ title: "Erro ao arquivar", description: err.message || "Tente novamente.", variant: "destructive" });
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
    const channel = sb
      .channel("realtime-contas-bancarias")
      .on("postgres_changes", { event: "*", schema: "public", table: "contas_bancarias", filter: `user_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: contasKeys.all });
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // API compatível
  const insert = async (payload: ContaBancariaRecord) => {
    await insertMutation.mutateAsync(payload);
  };

  const update = async (id: string, changes: Partial<ContaBancariaRecord>) => {
    await updateMutation.mutateAsync({ id, changes });
  };

  const archive = async (id: string) => {
    await archiveMutation.mutateAsync(id);
  };

  const fetchAll = (opts?: { incluirArquivadas?: boolean }) => {
    if (opts?.incluirArquivadas) {
      return queryClient.fetchQuery({
        queryKey: contasKeys.list(user!.id, true),
        queryFn: () => fetchContas(user!.id, true),
      });
    }
    return refetch();
  };

  return {
    items,
    loading,
    error,
    fetchAll,
    insert,
    update,
    archive,
    // Mutations expostas
    insertMutation,
    updateMutation,
    archiveMutation,
  };
}

export const TIPOS_CONTA = [
  "Corrente",
  "Poupança",
  "Salário",
  "Investimento",
  "Outros",
];

export const MOEDAS = [
  "BRL",
  "USD",
  "EUR",
];
