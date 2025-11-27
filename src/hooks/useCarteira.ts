import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { supabaseLocal, isSupabaseLocalConfigured } from "@/integrations/supabase/local";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export type CarteiraRecord = {
  id?: string;
  user_id?: string;
  tipo: 'RECEITA' | 'DESPESA';
  categoria: string;
  valor: number;
  data_vencimento: string; // yyyy-MM-dd
  data_liquidacao?: string | null;
  descricao: string;
  agendamento_id?: string | null;
  conta_id?: string | null;
  created_at?: string;
  updated_at?: string;
  agendamento?: {
    projeto?: {
      cliente?: {
        nome: string;
      } | null;
    } | null;
  } | null;
};

export const carteiraSchema = z.object({
  tipo: z.enum(['RECEITA', 'DESPESA', 'APORTE']),
  categoria: z.string().min(1),
  valor: z.number().nonnegative(),
  data_vencimento: z.string().min(1),
  descricao: z.string().min(2),
  agendamento_id: z.string().optional().nullable().or(z.literal("")),
  data_liquidacao: z.string().optional().nullable(),
  conta_id: z.string().optional().nullable().or(z.literal("")),
});

export function useCarteira() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<CarteiraRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const receitas = items.filter(r => r.tipo === 'RECEITA' && r.data_liquidacao);
    const despesas = items.filter(r => r.tipo === 'DESPESA' && r.data_liquidacao);
    const totalReceitas = receitas.reduce((s, r) => s + (Number(r.valor) || 0), 0);
    const totalDespesas = despesas.reduce((s, r) => s + (Number(r.valor) || 0), 0);
    return { totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas };
  }, [items]);

  const fetchAll = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data, error } = await sb
        .from("financeiro_tattoo")
        .select(`*`)
        .eq("user_id", user.id)
        .order("data_vencimento", { ascending: false });
      if (error) throw error;
      setItems((data || []) as any);
      setError(null);
    } catch (err: any) {
      console.error("Erro ao carregar financeiro_tattoo:", err);
      setError(err?.message || "Erro desconhecido");
      toast({ title: "Erro ao carregar dados", description: "Tente novamente mais tarde.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const insert = async (payload: CarteiraRecord) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const parsed = carteiraSchema.parse(payload);
      const toInsert = {
        user_id: user.id,
        tipo: parsed.tipo,
        categoria: parsed.categoria,
        valor: parsed.valor,
        data_vencimento: parsed.data_vencimento,
        descricao: parsed.descricao,
        agendamento_id: parsed.agendamento_id || null,
        data_liquidacao: parsed.data_liquidacao ?? null,
        conta_id: parsed.conta_id || null,
      };
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("financeiro_tattoo")
        .insert(toInsert)
        .select("*");
      if (error) throw error;
      setItems(prev => rows ? ([rows[0] as any, ...prev]) : prev);
      toast({ title: "Registro criado", description: "Fluxo de caixa geral salvo com sucesso." });
    } catch (err: any) {
      console.error("Erro ao inserir em financeiro_tattoo:", err);
      toast({ title: "Erro ao criar registro", description: err.message || "Verifique os dados.", variant: "destructive" });
      throw err;
    }
  };

  const update = async (id: string, changes: Partial<CarteiraRecord>) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const merged: any = { ...changes };
      if (merged.valor !== undefined) merged.valor = Number(merged.valor);
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { data: rows, error } = await sb
        .from("financeiro_tattoo")
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
      toast({ title: "Registro atualizado", description: "Alterações salvas com sucesso." });
    } catch (err: any) {
      console.error("Erro ao atualizar financeiro_tattoo:", err);
      toast({ title: "Erro ao atualizar", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      if (!user) throw new Error("Usuário não autenticado");
      const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
      const { error } = await sb
        .from("financeiro_tattoo")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      setItems(prev => prev.filter(i => i.id !== id));
      toast({ title: "Registro removido", description: "Fluxo de caixa geral excluído." });
    } catch (err: any) {
      console.error("Erro ao remover financeiro_tattoo:", err);
      toast({ title: "Erro ao remover", description: err.message || "Tente novamente.", variant: "destructive" });
      throw err;
    }
  };

  useEffect(() => {
    fetchAll();
    if (!user) return;
    const sb = isSupabaseLocalConfigured ? supabaseLocal : supabase;
    const channel = sb
      .channel("realtime-financeiro_tattoo")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "financeiro_tattoo", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => [payload.new as any, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "financeiro_tattoo", filter: `user_id=eq.${user.id}` }, (payload) => {
        setItems(prev => prev.map(i => (i.id === payload.new.id ? (payload.new as any) : i)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "financeiro_tattoo", filter: `user_id=eq.${user.id}` }, (payload) => {
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
    stats,
    loading,
    error,
    fetchAll,
    insert,
    update,
    remove,
  };
}
