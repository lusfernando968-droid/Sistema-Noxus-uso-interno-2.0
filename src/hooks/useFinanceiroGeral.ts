import { useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type FinanceiroGeralRecord = {
  id?: string;
  user_id?: string;
  data: string;
  descricao: string;
  valor: number;
  categoria: string;
  forma_pagamento: string;
  tipo: 'entrada' | 'saida';
  comprovante?: string | null;
  observacoes?: string | null;
  conta_id?: string | null;
  created_at?: string;
  updated_at?: string;
  origem?: string | null;
  origem_id?: string | null;
  setor?: string | null;
  readOnly?: boolean;
  editLink?: string | null;
  agendamento_id?: string | null;
  cliente_nome?: string;
};

export const financeiroGeralSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  descricao: z.string().min(2, "Descrição muito curta"),
  valor: z
    .number({ invalid_type_error: "Valor deve ser numérico" })
    .nonnegative("Valor não pode ser negativo"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  forma_pagamento: z.string().min(1, "Forma de pagamento é obrigatória"),
  tipo: z.enum(["entrada", "saida"], { errorMap: () => ({ message: "Tipo deve ser entrada ou saída" }) }),
  comprovante: z.string().url().optional().or(z.literal("")),
  observacoes: z.string().optional(),
  conta_id: z.string().uuid().optional(),
});

export type FinanceiroStats = {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  porCategoriaEntradas: Record<string, number>;
  porCategoriaSaidas: Record<string, number>;
};

function calcularStats(rows: FinanceiroGeralRecord[]): FinanceiroStats {
  const entradas = rows.filter(r => r.tipo === 'entrada');
  const saidas = rows.filter(r => r.tipo === 'saida');

  const totalEntradas = entradas.reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
  const totalSaidas = saidas.reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
  const saldo = totalEntradas - totalSaidas;

  const porCategoriaEntradas: Record<string, number> = {};
  const porCategoriaSaidas: Record<string, number> = {};

  for (const r of entradas) {
    const cat = r.categoria || "Outros";
    porCategoriaEntradas[cat] = (porCategoriaEntradas[cat] || 0) + (Number(r.valor) || 0);
  }

  for (const r of saidas) {
    const cat = r.categoria || "Outros";
    porCategoriaSaidas[cat] = (porCategoriaSaidas[cat] || 0) + (Number(r.valor) || 0);
  }

  return { totalEntradas, totalSaidas, saldo, porCategoriaEntradas, porCategoriaSaidas };
}

// Query key factory para consistência
const financeiroKeys = {
  all: ['financeiro_geral'] as const,
  list: (userId: string) => [...financeiroKeys.all, 'list', userId] as const,
};

// Função para buscar dados do financeiro com JOINs otimizados
async function fetchFinanceiroData(userId: string): Promise<FinanceiroGeralRecord[]> {
  const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
  
  // Query principal com JOIN para agendamentos -> projetos -> clientes
  const { data, error } = await sb
    .from("financeiro_geral")
    .select(`
      *,
      agendamentos (
        id,
        projetos (
          id,
          clientes (
            id,
            nome
          )
        )
      )
    `)
    .eq("user_id", userId)
    .order("data", { ascending: false });

  if (error) throw error;

  // Mapear dados com cliente_nome já resolvido
  return (data || []).map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    data: item.data,
    descricao: item.descricao,
    valor: Number(item.valor),
    categoria: item.categoria,
    forma_pagamento: item.forma_pagamento,
    tipo: item.tipo,
    comprovante: item.comprovante,
    observacoes: item.observacoes,
    conta_id: item.conta_id,
    created_at: item.created_at,
    updated_at: item.updated_at,
    origem: item.origem,
    origem_id: item.origem_id,
    setor: item.setor,
    readOnly: !!item.origem,
    editLink: item.origem === 'financeiro_tattoo' && item.origem_id ? `/tattoo-financeiro?id=${item.origem_id}` : null,
    agendamento_id: item.agendamento_id,
    // Nome do cliente via JOIN (evita N+1 queries)
    cliente_nome: item.agendamentos?.projetos?.clientes?.nome || undefined,
  }));
}

export function useFinanceiroGeral() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query principal com React Query
  const {
    data: items = [],
    isLoading: loading,
    error: queryError,
    refetch: fetchAll,
  } = useQuery({
    queryKey: financeiroKeys.list(user?.id || ''),
    queryFn: () => fetchFinanceiroData(user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minutos de cache
  });

  const error = queryError ? (queryError as Error).message : null;
  const stats = useMemo(() => calcularStats(items), [items]);

  // Mutation para inserir
  const insertMutation = useMutation({
    mutationFn: async (payload: FinanceiroGeralRecord) => {
      if (!user) throw new Error("Usuário não autenticado");
      const parsed = financeiroGeralSchema.parse(payload);
      const toInsert = {
        user_id: user.id,
        data: parsed.data,
        descricao: parsed.descricao,
        valor: parsed.valor,
        categoria: parsed.categoria,
        forma_pagamento: parsed.forma_pagamento,
        tipo: parsed.tipo,
        comprovante: parsed.comprovante || null,
        observacoes: parsed.observacoes || null,
        conta_id: parsed.conta_id || null,
      };

      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("financeiro_geral")
        .insert(toInsert)
        .select("*");
      if (error) throw error;
      return rows?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeiroKeys.list(user!.id) });
      toast({ title: "Registro criado", description: "Financeiro salvo com sucesso." });
    },
    onError: (err: Error) => {
      console.error("Erro ao inserir em financeiro_geral:", err);
      toast({ title: "Erro ao criar registro", description: err.message || "Verifique os dados.", variant: "destructive" });
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: async ({ id, changes }: { id: string; changes: Partial<FinanceiroGeralRecord> }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const merged: any = { ...changes };
      if (merged.valor !== undefined) merged.valor = Number(merged.valor);
      if (merged.comprovante === "") merged.comprovante = null;
      if (merged.conta_id === "") merged.conta_id = null;
      delete merged.user_id;

      // Verificar se é readonly
      const current = items.find(i => i.id === id);
      if (current?.origem) throw new Error("Registro sincronizado (Tattoo) é somente leitura. Edite no módulo Tattoo.");

      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("financeiro_geral")
        .update(merged)
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .is("origem", null);
      if (error) throw error;
      return rows?.[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeiroKeys.list(user!.id) });
      toast({ title: "Registro atualizado", description: "Alterações salvas com sucesso." });
    },
    onError: (err: Error) => {
      console.error("Erro ao atualizar financeiro_geral:", err);
      toast({ title: "Erro ao atualizar", description: err.message || "Tente novamente.", variant: "destructive" });
    },
  });

  // Mutation para remover
  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      
      const current = items.find(i => i.id === id);
      if (current?.origem) throw new Error("Registro sincronizado (Tattoo) é somente leitura. Exclua no módulo Tattoo.");

      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { error } = await sb
        .from("financeiro_geral")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id)
        .is("origem", null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financeiroKeys.list(user!.id) });
      toast({ title: "Registro removido", description: "Financeiro excluído." });
    },
    onError: (err: Error) => {
      console.error("Erro ao remover financeiro_geral:", err);
      toast({ title: "Erro ao remover", description: err.message || "Tente novamente.", variant: "destructive" });
    },
  });

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
    
    const channel = sb
      .channel("realtime-financeiro_geral")
      .on("postgres_changes", { event: "*", schema: "public", table: "financeiro_geral", filter: `user_id=eq.${user.id}` }, () => {
        // Invalidar cache para refetch automático
        queryClient.invalidateQueries({ queryKey: financeiroKeys.list(user.id) });
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // API compatível com versão anterior
  const insert = async (payload: FinanceiroGeralRecord) => {
    await insertMutation.mutateAsync(payload);
  };

  const update = async (id: string, changes: Partial<FinanceiroGeralRecord>) => {
    await updateMutation.mutateAsync({ id, changes });
  };

  const remove = async (id: string) => {
    await removeMutation.mutateAsync(id);
  };

  return {
    items,
    stats,
    loading,
    error,
    fetchAll: () => fetchAll(),
    insert,
    update,
    remove,
    // Expor mutations para uso direto se necessário
    insertMutation,
    updateMutation,
    removeMutation,
  };
}

export const CATEGORIAS_GERAIS = [
  "Vendas",
  "Serviços Prestados",
  "Aluguel",
  "Investimento",
  "Outras Entradas",
  "Aluguel (Despesa)",
  "Contas",
  "Materiais",
  "Marketing",
  "Impostos",
  "Salários",
  "Serviços",
  "Manutenção",
  "Outras Despesas",
];

export const FORMAS_PAGAMENTO = [
  "Dinheiro",
  "Cartão",
  "Pix",
  "Transferência",
  "Boleto",
  "Outros",
];
