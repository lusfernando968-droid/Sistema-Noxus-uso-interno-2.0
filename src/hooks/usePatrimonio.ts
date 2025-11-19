import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type PatrimonioItem = {
  id?: string;
  user_id?: string;
  nome: string;
  categoria: string;
  descricao?: string | null;
  data_aquisicao: string;
  custo_inicial: number;
  valor_residual?: number;
  metodo_depreciacao: "linha_reta" | "declinante";
  vida_util_meses?: number;
  taxa_declinante_anual?: number | null;
  localizacao?: string | null;
  condicao?: "novo" | "bom" | "usado" | "avariado";
  serial_nota?: string | null;
  garantia_fim?: string | null;
  rendimento_mensal_estimado?: number | null;
  tags?: string[] | null;
  status?: "ativo" | "vendido" | "descartado";
  valor_atual_cache?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type PatrimonioMovimento = {
  id?: string;
  user_id?: string;
  item_id: string;
  tipo: "entrada" | "saida";
  valor: number;
  data: string;
  descricao?: string | null;
  categoria?: string | null;
  comprovante_url?: string | null;
  created_at?: string;
  updated_at?: string;
};

export const patrimonioItemSchema = z.object({
  nome: z.string().min(2),
  categoria: z.string().min(1),
  descricao: z.string().optional().nullable(),
  data_aquisicao: z.string().min(1),
  custo_inicial: z.number().nonnegative(),
  valor_residual: z.number().min(0).default(0),
  metodo_depreciacao: z.enum(["linha_reta", "declinante"]).default("linha_reta"),
  vida_util_meses: z.number().int().min(1).default(36),
  taxa_declinante_anual: z.number().min(0).optional().nullable(),
  localizacao: z.string().optional().nullable(),
  condicao: z.enum(["novo", "bom", "usado", "avariado"]).default("bom"),
  serial_nota: z.string().optional().nullable(),
  garantia_fim: z.string().optional().nullable(),
  rendimento_mensal_estimado: z.number().min(0).optional().nullable(),
  tags: z.array(z.string()).optional().nullable(),
  status: z.enum(["ativo", "vendido", "descartado"]).default("ativo"),
  valor_atual_cache: z.number().min(0).optional().nullable(),
});

export const patrimonioMovSchema = z.object({
  item_id: z.string().min(1),
  tipo: z.enum(["entrada", "saida"]),
  valor: z.number().nonnegative(),
  data: z.string().min(1),
  descricao: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  comprovante_url: z.string().url().optional().nullable(),
});

function diffMonths(a: Date, b: Date) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

export function calcularValorAtual(i: PatrimonioItem, hoje = new Date()) {
  const custo = Number(i.custo_inicial) || 0;
  const residual = Number(i.valor_residual || 0) || 0;
  const vida = Number(i.vida_util_meses || 36) || 36;
  const aquis = i.data_aquisicao ? new Date(i.data_aquisicao) : hoje;
  const meses = Math.max(0, diffMonths(aquis, hoje));
  if (i.metodo_depreciacao === "declinante") {
    const taxaAnual = Number(i.taxa_declinante_anual || 0) / 100;
    const anos = meses / 12;
    const v = custo * Math.pow(1 - taxaAnual, anos);
    return Math.max(residual, Number(v.toFixed(2)));
  }
  const depMensal = (custo - residual) / vida;
  const v = custo - depMensal * meses;
  return Math.max(residual, Number(v.toFixed(2)));
}

export function usePatrimonio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<PatrimonioItem[]>([]);
  const [movimentos, setMovimentos] = useState<Record<string, PatrimonioMovimento[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const valorAtualTotal = items.reduce((s, i) => s + Number(i.valor_atual_cache ?? calcularValorAtual(i)), 0);
    const custoTotal = items.reduce((s, i) => s + (Number(i.custo_inicial) || 0), 0);
    const roiItems = items.filter((i) => !Array.isArray(i.tags) || !i.tags?.includes('no_roi'));
    const valorAtualRoiTotal = roiItems.reduce((s, i) => s + Number(i.valor_atual_cache ?? calcularValorAtual(i)), 0);
    const custoRoiTotal = roiItems.reduce((s, i) => s + (Number(i.custo_inicial) || 0), 0);
    return { valorAtualTotal, custoTotal, valorAtualRoiTotal, custoRoiTotal };
  }, [items]);

  const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;

  const fetchItems = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const { data, error } = await sb
        .from("patrimonio_itens")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setItems((data || []) as any);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar patrimonio_itens:", err);
      setError(err?.message || "Erro desconhecido");
      toast({ title: "Erro ao carregar patrimônio", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const insertItem = async (payload: PatrimonioItem) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const parsed = patrimonioItemSchema.parse(payload);
      const toInsert = { user_id: user.id, ...parsed } as any;
      const { data: rows, error } = await sb
        .from("patrimonio_itens")
        .insert(toInsert)
        .select("*");
      if (error) throw error;
      setItems(prev => rows ? ([rows[0] as any, ...prev]) : prev);
      toast({ title: "Item criado", description: "Patrimônio salvo com sucesso." });
    } catch (err: any) {
      console.error("Erro ao inserir patrimonio_itens:", err);
      toast({ title: "Erro ao criar item", description: err.message || "Verifique os dados.", variant: "destructive" });
      throw err;
    }
  };

  const updateItem = async (id: string, changes: Partial<PatrimonioItem>) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const merged: any = { ...changes };
      if (merged.custo_inicial !== undefined) merged.custo_inicial = Number(merged.custo_inicial);
      if (merged.valor_residual !== undefined) merged.valor_residual = Number(merged.valor_residual);
      if (merged.valor_atual_cache !== undefined && merged.valor_atual_cache != null) merged.valor_atual_cache = Number(merged.valor_atual_cache);
      const { data: rows, error } = await sb
        .from("patrimonio_itens")
        .update(merged)
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      if (rows && rows.length) {
        const updated = rows[0] as any;
        setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      } else {
        await fetchItems();
      }
      toast({ title: "Item atualizado", description: "Alterações salvas com sucesso." });
    } catch (err: any) {
      console.error("Erro ao atualizar patrimonio_itens:", err);
      toast({ title: "Erro ao atualizar", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  const removeItem = async (id: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await sb
        .from("patrimonio_itens")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id));
      toast({ title: "Item removido", description: "Registro excluído." });
    } catch (err: any) {
      console.error("Erro ao remover patrimonio_itens:", err);
      toast({ title: "Erro ao remover", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  const fetchMovimentos = async (itemId: string) => {
    try {
      if (!user) return [];
      const { data, error } = await sb
        .from("patrimonio_movimentos")
        .select("*")
        .eq("user_id", user.id)
        .eq("item_id", itemId)
        .order("data", { ascending: false });
      if (error) throw error;
      setMovimentos(prev => ({ ...prev, [itemId]: (data || []) as any }));
      return (data || []) as any;
    } catch (err: any) {
      console.error("Erro ao carregar movimentos:", err);
      toast({ title: "Erro ao carregar lançamentos", description: "Tente novamente mais tarde.", variant: "destructive" });
      return [];
    }
  };

  const insertMovimento = async (payload: PatrimonioMovimento) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const parsed = patrimonioMovSchema.parse(payload);
      const toInsert = { user_id: user.id, ...parsed } as any;
      const { data: rows, error } = await sb
        .from("patrimonio_movimentos")
        .insert(toInsert)
        .select("*");
      if (error) throw error;
      const row = rows?.[0] as any;
      setMovimentos(prev => {
        const list = prev[parsed.item_id] || [];
        return { ...prev, [parsed.item_id]: [row, ...list] };
      });
      toast({ title: "Lançamento criado", description: "Registro salvo com sucesso." });
    } catch (err: any) {
      console.error("Erro ao inserir patrimonio_movimentos:", err);
      toast({ title: "Erro ao criar lançamento", description: err.message || "Verifique os dados.", variant: "destructive" });
      throw err;
    }
  };

  const removeMovimento = async (id: string, itemId: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await sb
        .from("patrimonio_movimentos")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      setMovimentos(prev => ({ ...prev, [itemId]: (prev[itemId] || []).filter(m => m.id !== id) }));
      toast({ title: "Lançamento removido", description: "Registro excluído." });
    } catch (err: any) {
      console.error("Erro ao remover patrimonio_movimentos:", err);
      toast({ title: "Erro ao remover", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  const calcularRoiDoItem = (itemId: string) => {
    const list = movimentos[itemId] || [];
    const entradas = list.filter(m => m.tipo === "entrada").reduce((s, m) => s + (Number(m.valor) || 0), 0);
    const saídas = list.filter(m => m.tipo === "saida").reduce((s, m) => s + (Number(m.valor) || 0), 0);
    const item = items.find(i => i.id === itemId);
    const custo = item ? Number(item.custo_inicial) || 0 : 0;
    if (!custo) return 0;
    return Number(((entradas - saídas) / custo).toFixed(4));
  };

  useEffect(() => {
    fetchItems();
    if (!user) return;
    const channel = sb
      .channel("realtime-patrimonio")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "patrimonio_itens", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "patrimonio_itens", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => prev.map(i => (i.id === payload.new.id ? (payload.new as any) : i)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "patrimonio_itens", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => prev.filter(i => i.id !== payload.old.id));
      })
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    items,
    movimentos,
    stats,
    loading,
    error,
    fetchItems,
    insertItem,
    updateItem,
    removeItem,
    fetchMovimentos,
    insertMovimento,
    removeMovimento,
    calcularRoiDoItem,
    calcularValorAtual,
  };
}
