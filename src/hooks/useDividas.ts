import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type DividaRecord = {
  id?: string;
  user_id?: string;
  credor: string;
  valor: number;
  data_vencimento: string; // yyyy-MM-dd
  status: 'ABERTA' | 'PAGA';
  conta_id?: string | null;
  observacoes?: string | null;
  data_pagamento?: string | null;
  total_parcelas?: number;
  parcela_atual?: number;
  periodicidade?: 'MENSAL' | 'SEMANAL' | 'QUINZENAL';
  created_at?: string;
  updated_at?: string;
};

export const dividaSchema = z.object({
  credor: z.string().min(2),
  valor: z.number().nonnegative(),
  data_vencimento: z.string().min(1),
  status: z.enum(['ABERTA', 'PAGA']),
  conta_id: z.string().optional().nullable().or(z.literal("")),
  observacoes: z.string().optional().nullable(),
  data_pagamento: z.string().optional().nullable(),
  total_parcelas: z.number().int().min(1).default(1),
  parcela_atual: z.number().int().min(1).default(1),
  periodicidade: z.enum(['MENSAL', 'SEMANAL', 'QUINZENAL']).default('MENSAL'),
});

export function useDividas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<DividaRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data, error } = await sb
        .from("dividas")
        .select("*")
        .eq("user_id", user.id)
        .order("data_vencimento", { ascending: true });
      if (error) throw error;
      setItems((data || []) as any);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar dividas:", err);
      setError(err?.message || "Erro desconhecido");
      toast({ title: "Erro ao carregar dívidas", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const insert = async (payload: DividaRecord) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const parsed = dividaSchema.parse(payload);
      const toInsert = {
        user_id: user.id,
        credor: parsed.credor,
        valor: Number(parsed.valor),
        data_vencimento: parsed.data_vencimento,
        status: parsed.status,
        conta_id: parsed.conta_id || null,
        observacoes: parsed.observacoes ?? null,
        data_pagamento: parsed.data_pagamento ?? null,
        total_parcelas: parsed.total_parcelas,
        parcela_atual: parsed.parcela_atual,
        periodicidade: parsed.periodicidade,
      };
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("dividas")
        .insert(toInsert)
        .select("*");
      if (error) throw error;
      setItems(prev => rows ? ([rows[0] as any, ...prev]) : prev);
      toast({ title: "Dívida criada", description: "Registro salvo com sucesso." });
    } catch (err: any) {
      console.error("Erro ao inserir em dividas:", err);
      toast({ title: "Erro ao criar dívida", description: err.message || "Verifique os dados.", variant: "destructive" });
      throw err;
    }
  };

  const update = async (id: string, changes: Partial<DividaRecord>) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const merged: any = { ...changes };
      if (merged.valor !== undefined) merged.valor = Number(merged.valor);
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("dividas")
        .update(merged)
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      if (rows && rows.length) {
        const updated = rows[0] as any;
        setItems(prev => prev.map(i => (i.id === updated.id ? updated : i)));
      } else {
        await fetchAll();
      }
      toast({ title: "Dívida atualizada", description: "Alterações salvas com sucesso." });
    } catch (err: any) {
      console.error("Erro ao atualizar dividas:", err);
      toast({ title: "Erro ao atualizar", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { error } = await sb
        .from("dividas")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id));
      toast({ title: "Dívida removida", description: "Registro excluído." });
    } catch (err: any) {
      console.error("Erro ao remover dividas:", err);
      toast({ title: "Erro ao remover", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  useEffect(() => {
    fetchAll();
    if (!user) return;
    const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
    const channel = sb
      .channel("realtime-dividas")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "dividas", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "dividas", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => prev.map(i => (i.id === payload.new.id ? (payload.new as any) : i)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "dividas", filter: `user_id=eq.${user.id}` }, (payload) => {
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
    loading,
    error,
    fetchAll,
    insert,
    update,
    remove,
  };
}
